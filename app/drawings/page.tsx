"use client";
import Link from "next/link";
import { useStore } from "@/lib/store";

export default function Drawings() {
  const { state } = useStore();
  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-semibold">Drawings & review</h1>
      <p className="text-inkSoft text-sm mt-1">Current set. Open a sheet to compare revisions and capture changes.</p>
      <table className="mt-6 w-full text-sm border border-rule bg-paper rounded">
        <thead className="text-left text-xs text-inkSoft border-b border-rule">
          <tr><th className="px-4 py-2">Number</th><th className="px-4 py-2">Title</th><th className="px-4 py-2">Discipline</th><th className="px-4 py-2">Current</th><th className="px-4 py-2">Clouds</th><th className="px-4 py-2"></th></tr>
        </thead>
        <tbody className="divide-y divide-rule">
          {state.drawings.map(d => {
            const cur = d.revisions[d.revisions.length - 1];
            const clouds = state.markups.filter(m => m.drawingId === d.id && m.kind === "cloud");
            const unpriced = clouds.filter(m => !m.changeItemId).length;
            return (
              <tr key={d.id}>
                <td className="px-4 py-3 font-semibold">{d.number}</td>
                <td className="px-4 py-3">{d.title}</td>
                <td className="px-4 py-3">{d.discipline}</td>
                <td className="px-4 py-3">Rev {cur.rev} <span className="text-inkSoft">({cur.date})</span></td>
                <td className="px-4 py-3">{clouds.length}{unpriced > 0 && <span className="pill bg-cloudSoft text-cloud ml-2">{unpriced} unpriced</span>}</td>
                <td className="px-4 py-3 text-right"><Link href={`/drawings/${d.id}`} className="btn">Open</Link></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
