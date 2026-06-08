import { useEffect, useState } from "react";
import { get } from "../lib/api";

interface Verify {
  valid: boolean;
  active?: boolean;
  cardNo?: string;
  brand?: string | null;
  years?: number | null;
  issueDate?: string | null;
  expiryDate?: string | null;
  holder?: string | null;
}

function fmt(iso?: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  return isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

/** Public warranty authenticity page — reached by scanning the card QR (/verify/:token). */
export function WarrantyVerify({ token }: { token: string }) {
  const [data, setData] = useState<Verify | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    get<Verify>(`/api/warranty/${token}`)
      .then((r) => alive && setData(r))
      .catch(() => alive && setData({ valid: false }))
      .finally(() => alive && setLoading(false));
    return () => { alive = false; };
  }, [token]);

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-8 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-white/40">WaterProofX</p>
        <h1 className="mt-1 text-2xl font-black">Warranty verification</h1>

        {loading ? (
          <p className="mt-8 text-white/50">Checking…</p>
        ) : !data?.valid ? (
          <div className="mt-8">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/15 text-3xl">✕</div>
            <p className="mt-4 font-bold text-rose-300">Not a valid warranty card</p>
            <p className="mt-1 text-sm text-white/45">This code doesn't match any card we issued. Beware of fakes.</p>
          </div>
        ) : (
          <div className="mt-8">
            <div className={`mx-auto flex h-16 w-16 items-center justify-center rounded-full text-3xl ${data.active ? "bg-emerald-500/15 text-emerald-300" : "bg-amber-500/15 text-amber-300"}`}>
              {data.active ? "✓" : "!"}
            </div>
            <p className={`mt-4 font-black ${data.active ? "text-emerald-300" : "text-amber-300"}`}>
              {data.active ? "Genuine & active" : "Genuine — expired"}
            </p>
            <div className="mt-6 space-y-2 text-left text-sm">
              <Row label="Card no" value={data.cardNo} />
              {data.holder && <Row label="Holder" value={data.holder} />}
              {data.brand && <Row label="System" value={data.brand} />}
              <Row label="Coverage" value={data.years ? `${data.years} years` : "—"} />
              <Row label="Issued" value={fmt(data.issueDate)} />
              <Row label="Valid until" value={fmt(data.expiryDate)} />
            </div>
          </div>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-white/30">Scan the QR on your WaterProofX warranty card to verify authenticity.</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-white/5 pb-2">
      <span className="text-white/45">{label}</span>
      <span className="font-semibold">{value || "—"}</span>
    </div>
  );
}
