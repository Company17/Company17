"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useStore } from "@/lib/store";

const links = [
  { href: "/", label: "Overview" },
  { href: "/drawings", label: "Drawings & review" },
  { href: "/changes", label: "Change orders" },
  { href: "/rfis", label: "RFIs" },
];

export default function Nav() {
  const path = usePathname();
  const { state, dispatch } = useStore();
  return (
    <aside className="w-56 shrink-0 border-r border-rule bg-paper flex flex-col">
      <div className="px-4 py-4 border-b border-rule">
        <div className="text-lg font-semibold tracking-tight">SiteLayer</div>
        <div className="text-xs text-inkSoft mt-1">{state.project.number}</div>
        <div className="text-sm leading-tight mt-0.5">{state.project.name}</div>
      </div>
      <nav className="flex-1 py-2">
        {links.map(l => {
          const active = l.href === "/" ? path === "/" : path.startsWith(l.href);
          return (
            <Link key={l.href} href={l.href}
              className={`block px-4 py-2 text-sm border-l-2 ${active ? "border-cloud bg-cloudSoft/60 font-medium" : "border-transparent hover:bg-ink/5"}`}>
              {l.label}
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-3 border-t border-rule text-xs text-inkSoft">
        <div>Signed in as Tom</div>
        <button className="underline mt-1" onClick={() => { if (confirm("Reset demo data?")) dispatch({ type: "reset" }); }}>Reset demo data</button>
      </div>
    </aside>
  );
}
