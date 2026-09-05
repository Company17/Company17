"use client";
import Link from "next/link";
import { corTotals, money, useStore } from "@/lib/store";

export default function Overview() {
  const { state } = useStore();
  const captured = state.changeItems.filter(c => c.status === "captured").length;
  const unpriced = state.markups.filter(m => m.kind === "cloud" && !m.changeItemId).length;
  const exposure = state.cors.reduce((s, cor) => s + corTotals(cor, state.changeItems.filter(c => c.corId === cor.id)).total, 0);
  const openRfis = state.rfis.filter(r => r.status === "open").length;

  return (
    <div className="p-6 max-w-5xl">
      <h1 className="text-2xl font-semibold">Project overview</h1>
      <p className="text-inkSoft text-sm mt-1">{state.project.client} — {state.project.name}</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
        <Stat label="Clouded changes without a price" value={unpriced} href="/drawings" warn={unpriced > 0} />
        <Stat label="Priced items not yet in a change order" value={captured} href="/changes" />
        <Stat label="Change-order exposure (draft + submitted)" value={money(exposure)} href="/changes" />
        <Stat label="Open RFIs" value={openRfis} href="/rfis" />
      </div>

      <section className="mt-8">
        <h2 className="text-lg font-semibold">Latest revisions</h2>
        <ul className="mt-2 divide-y divide-rule border border-rule rounded bg-paper">
          {state.drawings.map(d => {
            const r = d.revisions[d.revisions.length - 1];
            return (
              <li key={d.id} className="flex items-center gap-4 px-4 py-3 text-sm">
                <span className="font-semibold w-16">{d.number}</span>
                <span className="flex-1 truncate">{d.title}</span>
                <span className="text-inkSoft">Rev {r.rev} · {r.date}</span>
                <Link className="btn" href={`/drawings/${d.id}`}>Review</Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className="mt-8 text-sm text-inkSoft max-w-2xl">
        <h2 className="text-lg font-semibold text-ink">How the change loop works</h2>
        <p className="mt-2">Open a drawing, compare the new revision against the last one, cloud what changed, price the cloud, and drop it straight into a change order request. Every dollar in a change order traces back to a cloud on a sheet.</p>
      </section>
    </div>
  );
}

function Stat({ label, value, href, warn }: { label: string; value: string | number; href: string; warn?: boolean }) {
  return (
    <Link href={href} className={`block rounded border bg-paper p-4 hover:border-ink ${warn ? "border-cloud" : "border-rule"}`}>
      <div className={`text-3xl font-semibold ${warn ? "text-cloud" : ""}`}>{value}</div>
      <div className="text-xs text-inkSoft mt-1 leading-snug">{label}</div>
    </Link>
  );
}
