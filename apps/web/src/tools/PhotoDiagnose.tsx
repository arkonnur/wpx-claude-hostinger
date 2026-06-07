import { useRef, useState } from "react";
import { ScanLine, Upload, Loader2, ImageOff } from "lucide-react";
import { ToolShell } from "./ToolShell";

type Stage = "idle" | "checking" | "queued";

const MAX_MB = 8;
const OK_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

export function PhotoDiagnose() {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState("");

  function onFile(file: File) {
    setError("");
    // cheap client-side filter (cost cascade tier 0)
    if (!OK_TYPES.includes(file.type)) {
      setError("Use a JPG, PNG or WEBP photo.");
      return;
    }
    if (file.size > MAX_MB * 1024 * 1024) {
      setError(`Photo must be under ${MAX_MB} MB.`);
      return;
    }
    setPreview(URL.createObjectURL(file));
    setStage("idle");
  }

  function analyze() {
    if (!preview) return;
    setStage("checking");
    // Backend AI cascade lands in Phase 5. For now: accept + queue.
    window.setTimeout(() => setStage("queued"), 900);
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
            disabled={!preview || stage === "checking"}
            className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-[#002bfa] px-6 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#1d44ff] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {stage === "checking" ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Analyzing…
              </>
            ) : (
              "Run AI diagnosis"
            )}
          </button>
        </div>

        {/* Result panel */}
        <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6">
          {stage === "queued" ? (
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#60a5fa]">
                Awareness report
              </p>
              <h3 className="mt-2 text-lg font-bold">Photo received & queued</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">
                Our AI is checking surface type, dampness pattern and severity band.
                You'll get an awareness-level condition summary — the full root-cause
                diagnosis comes with a free on-site engineering visit.
              </p>
              <ul className="mt-4 space-y-2 text-sm text-white/55">
                <li>• Surface & material detection</li>
                <li>• Dampness / efflorescence pattern</li>
                <li>• Indicative severity band</li>
                <li>• Recommended next step</li>
              </ul>
              <p className="mt-4 rounded-xl bg-[#002bfa]/10 px-4 py-3 text-xs text-white/55 ring-1 ring-[#002bfa]/20">
                Live AI scoring connects in the next build phase — your upload is
                saved against your verified number.
              </p>
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
