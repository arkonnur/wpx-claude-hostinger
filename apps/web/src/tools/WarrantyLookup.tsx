import { useState } from "react";
import { ShieldCheck, Search, AlertCircle } from "lucide-react";
import { ToolShell } from "./ToolShell";

export function WarrantyLookup() {
  const [code, setCode] = useState("");
  const [searched, setSearched] = useState(false);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    // Warranty registry connects with the lifecycle build (Phase 7).
    setSearched(true);
  }

  return (
    <ToolShell
      title="Warranty Check"
      subtitle="Enter your WaterProofX warranty card number to see coverage and service history."
      gate="Free"
      icon={<ShieldCheck className="h-6 w-6" />}
    >
      <form onSubmit={submit} className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/30" />
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setSearched(false);
            }}
            placeholder="e.g. WPX-2026-XXXXX"
            className="w-full rounded-2xl border border-white/10 bg-white/[0.04] py-3.5 pl-11 pr-4 text-sm uppercase tracking-wider text-white placeholder:text-white/30 placeholder:normal-case focus:border-[#002bfa]/60 focus:outline-none focus:ring-2 focus:ring-[#002bfa]/30"
          />
        </div>
        <button
          type="submit"
          className="rounded-2xl bg-[#002bfa] px-7 py-3.5 text-sm font-bold text-white transition-colors hover:bg-[#1d44ff]"
        >
          Check warranty
        </button>
      </form>

      {searched && (
        <div className="mt-6 rounded-3xl border border-amber-400/20 bg-amber-500/[0.06] p-6">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" />
            <div>
              <h3 className="font-bold">No record found for “{code.trim()}”</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-white/60">
                The warranty registry goes live with our service-tracking system. If
                you have an active WaterProofX job, your card number will resolve here
                with coverage dates, surfaces and the post-service support window.
              </p>
            </div>
          </div>
        </div>
      )}
    </ToolShell>
  );
}
