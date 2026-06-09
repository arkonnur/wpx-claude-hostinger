import { useEffect, useState } from "react";
import { get, post, patch, del } from "../lib/api";

interface Product {
  id: string; brand: string; name: string; category: string | null;
  coverageValue: string | null; coverageUnit: string | null;
  packSize: string | null; packUnit: string | null;
  mrp: string | null; costPrice: string | null; marginPct: string | null;
  tier: string | null; active: boolean;
}
type Draft = Partial<Omit<Product, "id" | "active">>;

const TIERS = ["basic", "medium", "premium", "industrial"];
const blank: Draft = { brand: "", name: "", category: "", coverageValue: "", coverageUnit: "sqft/kg", packSize: "", packUnit: "kg", mrp: "", costPrice: "", marginPct: "", tier: "medium" };

export function ProductsConfigEditor() {
  const [list, setList] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<Draft>(blank);
  const [saving, setSaving] = useState(false);
  const [showInactive, setShowInactive] = useState(false);

  function load() {
    get<{ products: Product[] }>("/api/products")
      .then((r) => setList(r.products))
      .catch((e) => setError((e as Error).message))
      .finally(() => setLoading(false));
  }
  useEffect(load, []);

  async function add() {
    if (!draft.brand || !draft.name) { setError("Brand and name required"); return; }
    setSaving(true); setError("");
    try {
      const r = await post<{ product: Product }>("/api/products", draft);
      setList((l) => [r.product, ...l]);
      setDraft(blank);
    } catch (e) { setError((e as Error).message); }
    finally { setSaving(false); }
  }
  async function update(id: string, body: Partial<Product>) {
    try {
      const r = await patch<{ product: Product }>(`/api/products/${id}`, body);
      setList((l) => l.map((p) => (p.id === id ? r.product : p)));
    } catch (e) { setError((e as Error).message); }
  }
  async function remove(id: string) {
    try { await del(`/api/products/${id}`); setList((l) => l.map((p) => (p.id === id ? { ...p, active: false } : p))); }
    catch (e) { setError((e as Error).message); }
  }

  if (loading) return <p className="text-white/50">Loading catalog…</p>;

  const inp = "rounded-lg border border-white/10 bg-[#0b1530] px-2 py-1.5 text-sm text-white focus:border-blue-400 focus:outline-none";
  const shown = list.filter((p) => showInactive || p.active);

  return (
    <div className="space-y-6">
      {error && <p className="text-sm font-semibold text-rose-300">{error}</p>}

      <section className="rounded-2xl border border-white/10 bg-white/[0.02] p-4">
        <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-white/50">Add product</h3>
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <input className={inp} placeholder="Brand *" value={draft.brand ?? ""} onChange={(e) => setDraft({ ...draft, brand: e.target.value })} />
          <input className={inp} placeholder="Product name *" value={draft.name ?? ""} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
          <input className={inp} placeholder="Category (e.g. PU coating)" value={draft.category ?? ""} onChange={(e) => setDraft({ ...draft, category: e.target.value })} />
          <select className={inp} value={draft.tier ?? "medium"} onChange={(e) => setDraft({ ...draft, tier: e.target.value })}>
            {TIERS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
          <input className={inp} placeholder="Coverage value" value={draft.coverageValue ?? ""} onChange={(e) => setDraft({ ...draft, coverageValue: e.target.value })} />
          <input className={inp} placeholder="Coverage unit" value={draft.coverageUnit ?? ""} onChange={(e) => setDraft({ ...draft, coverageUnit: e.target.value })} />
          <input className={inp} placeholder="Pack size" value={draft.packSize ?? ""} onChange={(e) => setDraft({ ...draft, packSize: e.target.value })} />
          <input className={inp} placeholder="Pack unit" value={draft.packUnit ?? ""} onChange={(e) => setDraft({ ...draft, packUnit: e.target.value })} />
          <input className={inp} placeholder="MRP ₹" value={draft.mrp ?? ""} onChange={(e) => setDraft({ ...draft, mrp: e.target.value })} />
          <input className={inp} placeholder="Cost ₹" value={draft.costPrice ?? ""} onChange={(e) => setDraft({ ...draft, costPrice: e.target.value })} />
          <input className={inp} placeholder="Margin %" value={draft.marginPct ?? ""} onChange={(e) => setDraft({ ...draft, marginPct: e.target.value })} />
          <button onClick={add} disabled={saving} className="rounded-lg bg-blue-500 px-4 py-1.5 text-sm font-bold text-white hover:bg-blue-600 disabled:opacity-50">
            {saving ? "Adding…" : "+ Add"}
          </button>
        </div>
      </section>

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h3 className="text-sm font-bold uppercase tracking-wider text-white/50">Catalog · {shown.length}</h3>
          <label className="flex items-center gap-2 text-xs text-white/45">
            <input type="checkbox" checked={showInactive} onChange={(e) => setShowInactive(e.target.checked)} /> Show inactive
          </label>
        </div>
        {shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/15 bg-white/[0.02] p-8 text-center text-sm text-white/45">
            No products yet. Add brands above — they feed material picks in quotes.
          </div>
        ) : (
          <div className="space-y-2">
            {shown.map((p) => (
              <div key={p.id} className={`rounded-xl border border-white/10 bg-white/[0.03] p-3 ${p.active ? "" : "opacity-50"}`}>
                <div className="flex flex-wrap items-center gap-3">
                  <div className="min-w-[160px]">
                    <p className="font-bold">{p.brand} · {p.name}</p>
                    <p className="text-xs text-white/40">{p.category || "—"}{p.tier ? ` · ${p.tier}` : ""}</p>
                  </div>
                  <span className="text-xs text-white/50">
                    {p.coverageValue ? `${p.coverageValue} ${p.coverageUnit ?? ""}` : ""}
                    {p.packSize ? ` · ${p.packSize}${p.packUnit ?? ""}` : ""}
                  </span>
                  <span className="text-xs text-white/50">
                    {p.mrp ? `MRP ₹${p.mrp}` : ""}{p.costPrice ? ` · cost ₹${p.costPrice}` : ""}{p.marginPct ? ` · ${p.marginPct}%` : ""}
                  </span>
                  <div className="ml-auto flex gap-2">
                    {p.active ? (
                      <button onClick={() => remove(p.id)} className="rounded-lg border border-rose-400/30 px-3 py-1 text-xs font-bold text-rose-300 hover:bg-rose-500/10">Deactivate</button>
                    ) : (
                      <button onClick={() => update(p.id, { active: true })} className="rounded-lg border border-emerald-400/30 px-3 py-1 text-xs font-bold text-emerald-300 hover:bg-emerald-500/10">Reactivate</button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
