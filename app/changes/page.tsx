"use client";
import Link from "next/link";
import { useState } from "react";
import { corTotals, itemTotal, money, uid, useStore } from "@/lib/store";
import type { ChangeOrderRequest } from "@/lib/types";

export default function Changes() {
  const { state, dispatch } = useStore();
  const [open, setOpen] = useState<string | null>(state.cors[0]?.id ?? null);
  const unassigned = state.changeItems.filter(c => !c.corId);

  function newCor() {
    const n = state.cors.length + 4;
    const cor: ChangeOrderRequest = { id: uid("cor"), number: `COR-${String(n).padStart(3, "0")}`, title: "New change order request", reason: "Design revision", overheadPct: 10, profitPct: 5, status: "draft", createdAt: new Date().toISOString() };
    dispatch({ type: "addCor", cor }); setOpen(cor.id);
  }

  function exportCsv(cor: ChangeOrderRequest) {
    const items = state.changeItems.filter(c => c.corId === cor.id);
    const rows = [["Item", "Drawing", "Rev", "Description", "Trade", "Qty", "Unit", "Labour/unit", "Material/unit", "Total"]];
    items.forEach((c, i) => {
      const d = state.drawings.find(x => x.id === c.drawingId); const r = d?.revisions.find(x => x.id === c.revisionId);
      rows.push([String(i + 1), d?.number ?? "", r?.rev ?? "", c.description, c.trade, String(c.quantity), c.unit, String(c.labourRate), String(c.materialRate), String(itemTotal(c))]);
    });
    const t = corTotals(cor, items);
    rows.push([], ["", "", "", "Subtotal", "", "", "", "", "", String(t.subtotal)], ["", "", "", `Overhead ${cor.overheadPct}%`, "", "", "", "", "", String(t.overhead)], ["", "", "", `Profit ${cor.profitPct}%`, "", "", "", "", "", String(t.profit)], ["", "", "", "Total", "", "", "", "", "", String(t.total)]);
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" })); a.download = `${cor.number}.csv`; a.click();
  }

  return (
    <div className="p-6 max-w-5xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Change orders</h1>
          <p className="text-inkSoft text-sm mt-1">Every line traces back to a cloud on a drawing.</p>
        </div>
        <button className="btn btn-primary" onClick={newCor}>New change order request</button>
      </div>

      {unassigned.length > 0 && (
        <div className="mt-4 border border-amber/50 bg-amber/10 rounded p-3 text-sm">
          <b>{unassigned.length}</b> priced item{unassigned.length > 1 ? "s" : ""} not yet in a change order request:
          <ul className="mt-1">
            {unassigned.map(c => (
              <li key={c.id} className="flex items-center gap-3 py-1">
                <span className="flex-1 truncate">{c.description || "(no description)"} — {money(itemTotal(c))}</span>
                <select className="field w-auto" value="" onChange={e => e.target.value && dispatch({ type: "assignToCor", itemId: c.id, corId: e.target.value })}>
                  <option value="">Add to…</option>
                  {state.cors.filter(x => x.status === "draft").map(x => <option key={x.id} value={x.id}>{x.number}</option>)}
                </select>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-6 space-y-3">
        {state.cors.map(cor => {
          const items = state.changeItems.filter(c => c.corId === cor.id);
          const t = corTotals(cor, items);
          const isOpen = open === cor.id;
          return (
            <section key={cor.id} className="border border-rule rounded bg-paper">
              <button className="w-full flex items-center gap-4 px-4 py-3 text-left" onClick={() => setOpen(isOpen ? null : cor.id)}>
                <span className="font-semibold w-20">{cor.number}</span>
                <span className="flex-1 truncate">{cor.title}</span>
                <span className={`pill ${cor.status === "approved" ? "bg-approve/10 text-approve" : cor.status === "submitted" ? "bg-amber/10 text-amber" : "bg-ink/5 text-inkSoft"}`}>{cor.status}</span>
                <span className="font-semibold w-28 text-right">{money(t.total)}</span>
              </button>
              {isOpen && (
                <div className="border-t border-rule px-4 py-3 text-sm">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    <div className="md:col-span-2"><label className="label">Title</label><input className="field" value={cor.title} onChange={e => dispatch({ type: "updateCor", id: cor.id, patch: { title: e.target.value } })} /></div>
                    <div><label className="label">Reason</label>
                      <select className="field" value={cor.reason} onChange={e => dispatch({ type: "updateCor", id: cor.id, patch: { reason: e.target.value } })}>
                        {["Design revision", "Site condition", "Owner request", "Consultant error/omission", "Schedule acceleration"].map(r => <option key={r}>{r}</option>)}
                      </select></div>
                    <div><label className="label">Status</label>
                      <select className="field" value={cor.status} onChange={e => dispatch({ type: "updateCor", id: cor.id, patch: { status: e.target.value as ChangeOrderRequest["status"] } })}>
                        {["draft", "submitted", "approved", "rejected"].map(s => <option key={s}>{s}</option>)}
                      </select></div>
                  </div>

                  <table className="w-full mt-4 text-sm">
                    <thead className="text-xs text-inkSoft text-left border-b border-rule">
                      <tr><th className="py-1">Drawing</th><th>Description</th><th>Trade</th><th className="text-right">Qty</th><th className="text-right">Labour</th><th className="text-right">Material</th><th className="text-right">Total</th></tr>
                    </thead>
                    <tbody className="divide-y divide-rule">
                      {items.length === 0 && <tr><td colSpan={7} className="py-3 text-inkSoft">No items yet. Price a cloud on a drawing and add it here.</td></tr>}
                      {items.map(c => {
                        const d = state.drawings.find(x => x.id === c.drawingId); const r = d?.revisions.find(x => x.id === c.revisionId);
                        return (
                          <tr key={c.id}>
                            <td className="py-2"><Link className="underline" href={`/drawings/${c.drawingId}`}>{d?.number} Rev {r?.rev}</Link></td>
                            <td className="py-2 pr-2">{c.description}</td>
                            <td>{c.trade}</td>
                            <td className="text-right">{c.quantity} {c.unit}</td>
                            <td className="text-right">{money(c.labourRate * c.quantity)}</td>
                            <td className="text-right">{money(c.materialRate * c.quantity)}</td>
                            <td className="text-right font-medium">{money(itemTotal(c))}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="mt-4 flex flex-wrap justify-end gap-x-8 gap-y-1 text-sm">
                    <div>Subtotal <b>{money(t.subtotal)}</b></div>
                    <div>Overhead <input type="number" className="field w-16 inline-block mx-1" value={cor.overheadPct} onChange={e => dispatch({ type: "updateCor", id: cor.id, patch: { overheadPct: Number(e.target.value) } })} />% <b>{money(t.overhead)}</b></div>
                    <div>Profit <input type="number" className="field w-16 inline-block mx-1" value={cor.profitPct} onChange={e => dispatch({ type: "updateCor", id: cor.id, patch: { profitPct: Number(e.target.value) } })} />% <b>{money(t.profit)}</b></div>
                    <div className="text-base">Total <b>{money(t.total)}</b></div>
                  </div>
                  <div className="mt-3 flex gap-2 justify-end">
                    <button className="btn" onClick={() => exportCsv(cor)}>Export CSV</button>
                    {cor.status === "draft" && <button className="btn btn-primary" onClick={() => dispatch({ type: "updateCor", id: cor.id, patch: { status: "submitted" } })}>Submit to client</button>}
                  </div>
                </div>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
