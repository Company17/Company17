"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";

export default function Rfis() {
  const { state } = useStore();
  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-semibold">Requests for information</h1>
      <p className="text-inkSoft text-sm mt-1">Each RFI is pinned to the drawing it questions, so the answer lands where the change will be priced.</p>
      <table className="mt-6 w-full text-sm border border-rule bg-paper rounded">
        <thead className="text-left text-xs text-inkSoft border-b border-rule">
          <tr><th className="px-4 py-2">Number</th><th className="px-4 py-2">Subject</th><th className="px-4 py-2">Drawing</th><th className="px-4 py-2">Ball in court</th><th className="px-4 py-2">Due</th><th className="px-4 py-2">Status</th></tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {state.rfis.map(r => {
            const d = state.drawings.find(x => x.id === r.drawingId);
            const overdue = r.status === "open" && new Date(r.due) < new Date();
            return (
              <tr key={r.id}>
                <td className="px-4 py-3 font-semibold">{r.number}</td>
                <td className="px-4 py-3">{r.subject}</td>
                <td className="px-4 py-3">{d ? <Link className="underline" href={`/drawings/${d.id}`}>{d.number}</Link> : "—"}</td>
                <td className="px-4 py-3">{r.ballInCourt}</td>
                <td className={`px-4 py-3 ${overdue ? "text-cloud font-medium" : ""}`}>{r.due}</td>
                <td className="px-4 py-3"><span className={`pill ${r.status === "open" ? "bg-cloudSoft text-cloud" : "bg-approve/10 text-approve"}`}>{r.status}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
