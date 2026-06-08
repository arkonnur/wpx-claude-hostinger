import { useEffect, useState } from "react";
import { get } from "../lib/api";
import { JobChecklist } from "./JobChecklist";

interface Job {
  id: string; status: string; assignedTo?: string | null; createdAt: string | null;
  contactName: string | null; contactAddress: string | null; contactPhone?: string | null;
}

const STATUS_STYLE: Record<string, string> = {
  scheduled: "bg-sky-500/15 text-sky-300 ring-sky-400/30",
  mobilising: "bg-violet-500/15 text-violet-300 ring-violet-400/30",
  in_progress: "bg-amber-500/15 text-amber-300 ring-amber-400/30",
  qa: "bg-blue-500/15 text-blue-300 ring-blue-400/30",
  handover: "bg-teal-500/15 text-teal-300 ring-teal-400/30",
  warranty_issued: "bg-emerald-500/15 text-emerald-300 ring-emerald-400/30",
  cancelled: "bg-white/10 text-white/40 ring-white/20",
};
const STATUS_LABEL: Record<string, string> = {
  scheduled: "Scheduled", mobilising: "Mobilising", in_progress: "In progress",
  qa: "QA", handover: "Handover", warranty_issued: "Warranty issued", cancelled: "Cancelled",
};

/** Jobs list. scope="mine" → crew's assigned jobs; scope="all" → admin/owner. */
export function JobsBoard({ scope }: { scope: "mine" | "all" }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);

  function load() {
    get<{ jobs: Job[] }>(scope === "mine" ? "/api/jobs/mine" : "/api/jobs")
      .then((r) => setJobs(r.jobs))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }
  useEffect(load, [scope]);

  if (loading) return <p className="text-white/50">Loading jobs…</p>;
  if (error && !jobs.length) return <p className="font-semibold text-rose-300">Error: {error}</p>;

  return (
    <div className="space-y-3">
      {jobs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-sm text-white/45">
          {scope === "mine" ? "No jobs assigned yet." : "No jobs yet. Convert a submitted inspection report into a job from the Site visits tab."}
        </div>
      ) : (
        jobs.map((j) => (
          <button key={j.id} onClick={() => setOpenId(j.id)}
            className="block w-full rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left hover:border-blue-400/40">
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="font-bold">{j.contactName || "Job"}</p>
                {j.contactAddress && <p className="text-xs text-white/40">📍 {j.contactAddress}</p>}
              </div>
              <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase ring-1 ${STATUS_STYLE[j.status] ?? STATUS_STYLE.scheduled}`}>
                {STATUS_LABEL[j.status] ?? j.status}
              </span>
            </div>
          </button>
        ))
      )}
      {openId && <JobChecklist jobId={openId} onClose={() => setOpenId(null)} onChange={load} />}
    </div>
  );
}
