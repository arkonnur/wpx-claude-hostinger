import { useRef, useState } from "react";
import { ScanLine, Upload, Loader2, ImageOff, AlertTriangle, CheckCircle2 } from "lucide-react";
import { ToolShell } from "./ToolShell";
import { post, ApiError } from "../lib/api";
import { track } from "../lib/track";

type Stage = "idle" | "analyzing" | "done" | "rejected";

const MAX_MB = 8;
const OK_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface Diagnosis {
  surface_type: string;
  already_waterproofed: boolean;
  has_damage: boolean;
  severity: "none" | "minor" | "moderate" | "severe" | "critical";
  cause: string;
  system: string;
  brand: string;
  summary: string;
  recommendation: string;
}

const SURFACE_LABEL: Record<string, string> = {
  terrace_roof: "Terrace / Roof", interior_wall_ceiling: "Interior wall / ceiling",
  bathroom_wet: "Bathroom / wet area", pool: "Swimming pool", water_tank: "Water tank",
  exterior_facade: "Exterior facade", basement: "Basement", balcony: "Balcony", other: "Surface",
};
const SEV_STYLE: Record<string, string> = {
  none: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  minor: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  moderate: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  severe: "bg-orange-500/15 text-orange-300 ring-orange-400/30",
  critical: "bg-rose-500/15 text-rose-300 ring-rose-400/30",
};

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => {
      const s = String(r.result);
      const comma = s.indexOf(",");
      resolve(comma >= 0 ? s.slice(comma + 1) : s); // strip data: prefix
    };
    r.onerror = () => reject(new Error("read failed"));
    r.readAsDataURL(file);
  });
}

export function PhotoDiagnose() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");
  const [rejectMsg, setRejectMsg] = useState("");
  const [result, setResult] = useState<Diagnosis | null>(null);

  function onFile(f: File) {
    setError(""); setRejectMsg(""); setResult(null); setStage("idle");
    if (!OK_TYPES.includes(f.type)) return setError("Use a JPG, PNG or WEBP photo.");
    if (f.size > MAX_MB * 1024 * 1024) return setError(`Photo must be under ${MAX_MB} MB.`);
    setFile(f);
    setPreview(URL.createObjectURL(f));
  }

  async function analyze() {
    if (!file) return;
    setError(""); setRejectMsg(""); setStage("analyzing");
    track("diagnose_start", { mime: file.type });
    try {
      const imageBase64 = await fileToBase64(file);
      const res = await post<{ ok: true; cached: boolean; diagnosis: Diagnosis }>(
        "/api/diagnose", { imageBase64, mime: file.type },
      );
      setResult(res.diagnosis);
      setStage("done");
      track("diagnose_result", { surface: res.diagnosis.surface_type, severity: res.diagnosis.severity, cached: res.cached });
    } catch (e) {
      if (e instanceof ApiError && e.status === 422) {
        setRejectMsg(
          e.data?.reason === "not_waterproofing_surface"
            ? "That photo doesn't look like a waterproofing surface (terrace, wall, bathroom, tank, etc.). Upload a clear shot of the affected area."
            : "This photo was already rejected. Repeated junk uploads get your access limited.",
        );
        setStage("rejected");
        track("diagnose_result", { rejected: true });
      } else if (e instanceof ApiError && e.status === 429) {
        setError("Daily photo limit reached. Try again tomorrow or book a free inspection.");
        setStage("idle");
      } else if (e instanceof ApiError && e.status === 403) {
        setError("Uploads are temporarily blocked from this device.");
        setStage("idle");
      } else if (e instanceof ApiError && (e.status === 502 || e.status === 503)) {
        setError("AI is busy right now. Wait a few seconds and try again.");
        setStage("idle");
      } else {
        setError((e as Error).message || "Couldn't analyze the photo. Try again.");
        setStage("idle");
      }
    }
  }

  return (
    <ToolShell
      title="AI Photo Diagnosis"
      subtitle="Upload one clear photo of the affected surface — terrace, ceiling, wall or tank."
      gate="OTP once"
      icon={<ScanLine className="h-6 w-6" />}
    >
      <div className="grid gap-6 md:grid-cols-[1fr_1fr]">
        {/* Upload zone */}
        <div>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-white/15 bg-white/[0.02] text-white/50 transition-colors hover:border-[#002bfa]/50 hover:text-white/70"
          >
            {preview ? (
              <img src={preview} alt="Selected" className="h-full w-full rounded-3xl object-cover" />
            ) : (
              <>
                <Upload className="h-8 w-8" />
                <span className="text-sm font-semibold">Tap to upload a photo</span>
                <span className="text-xs">JPG / PNG / WEBP · max {MAX_MB} MB</span>
              </>
            )}
          </button>
          <input
            ref={inputRef}
            type="file"
            accept={OK_TYPES.join(",")}
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) onFile(f);
            }}
          />
          {error && <p className="mt-3 text-sm font-semibold text-rose-300">{error}</p>}
          <button
            onClick={analyze}
            disabled={!file || stage === "analyzing"}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#002bfa] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#1d44ff] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {stage === "analyzing" ? (
              <><Loader2 className="h-4 w-4 animate-spin" /> Analyzing…</>
            ) : (
              "Run AI diagnosis"
            )}
          </button>
        </div>

        {/* Result panel */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          {stage === "done" && result ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60a5fa]">Awareness report</p>
              <div className="mt-2 flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-bold">{SURFACE_LABEL[result.surface_type] ?? "Surface"}</h3>
                <span className={`rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ring-1 ${SEV_STYLE[result.severity]}`}>
                  {result.severity === "none" ? "Healthy" : `${result.severity} severity`}
                </span>
                {result.already_waterproofed && (
                  <span className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-bold uppercase text-white/60 ring-1 ring-white/20">
                    Already coated
                  </span>
                )}
              </div>

              <p className="mt-3 text-sm leading-relaxed text-white/70">{result.summary}</p>

              <dl className="mt-4 space-y-2 text-sm">
                {result.cause && <Row k="Likely cause" v={result.cause} />}
                {result.system && <Row k="Suggested system" v={result.system} />}
                {result.brand && <Row k="Brand family" v={result.brand} />}
              </dl>

              <div className="mt-4 rounded-xl bg-[#002bfa]/10 px-4 py-3 text-sm text-white/70 ring-1 ring-[#002bfa]/20">
                <p className="font-semibold text-white">Next step</p>
                <p className="mt-0.5">{result.recommendation}</p>
              </div>
              <p className="mt-3 text-xs text-white/40">
                Awareness-level read from one photo. A free on-site engineering visit confirms root cause before any work.
              </p>
            </div>
          ) : stage === "rejected" ? (
            <div className="flex h-full flex-col items-center justify-center text-center">
              <AlertTriangle className="h-8 w-8 text-amber-300" />
              <p className="mt-3 text-sm text-white/70">{rejectMsg}</p>
            </div>
          ) : stage === "done" ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-emerald-300">
              <CheckCircle2 className="h-8 w-8" />
            </div>
          ) : (
            <div className="flex h-full flex-col items-center justify-center text-center text-white/40">
              <ImageOff className="h-8 w-8" />
              <p className="mt-3 text-sm">Your AI condition report appears here.</p>
            </div>
          )}
        </div>
      </div>
    </ToolShell>
  );
}

function Row({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-3 border-b border-white/5 pb-1.5">
      <dt className="shrink-0 text-white/45">{k}</dt>
      <dd className="text-right text-white/80">{v}</dd>
    </div>
  );
}
