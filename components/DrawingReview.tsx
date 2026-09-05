"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useStore, uid, itemTotal, money } from "@/lib/store";
import { cloudPath, bounds } from "@/lib/geometry";
import type { ChangeItem, Markup, MarkupKind } from "@/lib/types";

const SHEET_W = 1400, SHEET_H = 900;
type Tool = "select" | MarkupKind;
type Pt = { x: number; y: number };
type Suggestion = { id: string; kind: "added" | "removed"; p1: Pt; p2: Pt };

export default function DrawingReview({ drawingId }: { drawingId: string }) {
  const { state, dispatch } = useStore();
  const drawing = state.drawings.find(d => d.id === drawingId);

  const [revIdx, setRevIdx] = useState<number>(() => (drawing ? drawing.revisions.length - 1 : 0));
  const [tool, setTool] = useState<Tool>("select");
  const [compare, setCompare] = useState(false);
  const [compareOpacity, setCompareOpacity] = useState(0.45);
  const [showDiff, setShowDiff] = useState(false);
  const [diffBusy, setDiffBusy] = useState(false);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Pt[] | null>(null);
  const [view, setView] = useState({ scale: 0.55, tx: 0, ty: 0 });
  const [panning, setPanning] = useState<{ x: number; y: number; tx: number; ty: number } | null>(null);

  const svgRef = useRef<SVGSVGElement>(null);
  const diffCanvasRef = useRef<HTMLCanvasElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  const rev = drawing?.revisions[revIdx];
  const prevRev = drawing && revIdx > 0 ? drawing.revisions[revIdx - 1] : undefined;
  const markups = useMemo(() => state.markups.filter(m => m.drawingId === drawingId && m.revisionId === rev?.id), [state.markups, drawingId, rev?.id]);
  const selected = markups.find(m => m.id === selectedId) ?? null;

  // Fit sheet to viewport on mount
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const s = Math.min(el.clientWidth / SHEET_W, el.clientHeight / SHEET_H) * 0.96;
    setView({ scale: s, tx: (el.clientWidth - SHEET_W * s) / 2, ty: (el.clientHeight - SHEET_H * s) / 2 });
  }, []);

  // Reset diff artefacts when revision changes
  useEffect(() => { setShowDiff(false); setSuggestions([]); }, [revIdx]);

  const toSheet = useCallback((e: { clientX: number; clientY: number }): Pt => {
    const svg = svgRef.current!;
    const r = svg.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * SHEET_W, y: ((e.clientY - r.top) / r.height) * SHEET_H };
  }, []);

  // ---- pointer handling -------------------------------------------------
  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (tool === "select") {
      setPanning({ x: e.clientX, y: e.clientY, tx: view.tx, ty: view.ty });
      return;
    }
    const p = toSheet(e);
    if (tool === "note") {
      const text = prompt("Note text");
      if (text) commitMarkup("note", [p], text);
      return;
    }
    setDraft([p, p]);
    (e.target as Element).setPointerCapture?.(e.pointerId);
  };
  const onPointerMove = (e: React.PointerEvent) => {
    if (panning) { setView(v => ({ ...v, tx: panning.tx + (e.clientX - panning.x), ty: panning.ty + (e.clientY - panning.y) })); return; }
    if (!draft) return;
    const p = toSheet(e);
    setDraft(d => (tool === "pen" ? [...(d ?? []), p] : [d![0], p]));
  };
  const onPointerUp = () => {
    if (panning) { setPanning(null); return; }
    if (!draft) return;
    const d = draft; setDraft(null);
    if (tool === "pen") { if (d.length > 2) commitMarkup("pen", d); return; }
    const b = bounds(d);
    if (b.maxX - b.minX < 8 || b.maxY - b.minY < 8) return;
    commitMarkup(tool as MarkupKind, d);
  };
  const onWheel = (e: React.WheelEvent) => {
    const el = viewportRef.current!; const r = el.getBoundingClientRect();
    const mx = e.clientX - r.left, my = e.clientY - r.top;
    const factor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
    setView(v => {
      const scale = Math.min(6, Math.max(0.15, v.scale * factor));
      const k = scale / v.scale;
      return { scale, tx: mx - (mx - v.tx) * k, ty: my - (my - v.ty) * k };
    });
  };

  function commitMarkup(kind: MarkupKind, points: Pt[], text?: string) {
    if (!rev) return;
    const m: Markup = { id: uid("mk"), drawingId, revisionId: rev.id, kind, points, text, author: "Tom", createdAt: new Date().toISOString() };
    dispatch({ type: "addMarkup", markup: m });
    setSelectedId(m.id);
    if (kind === "cloud" || kind === "rect") setTool("select");
  }

  // ---- revision diff ----------------------------------------------------
  async function runDiff() {
    if (!rev || !prevRev) return;
    setDiffBusy(true);
    try {
      const [a, b] = await Promise.all([loadImage(prevRev.src), loadImage(rev.src)]);
      const ca = rasterise(a), cb = rasterise(b);
      const da = ca.getImageData(0, 0, SHEET_W, SHEET_H).data;
      const db = cb.getImageData(0, 0, SHEET_W, SHEET_H).data;
      const out = diffCanvasRef.current!.getContext("2d")!;
      const img = out.createImageData(SHEET_W, SHEET_H);
      const CELL = 20, gw = Math.ceil(SHEET_W / CELL), gh = Math.ceil(SHEET_H / CELL);
      const grid = new Int8Array(gw * gh); // 0 none, 1 added, -1 removed, 2 mixed
      for (let i = 0; i < da.length; i += 4) {
        const darkA = da[i] + da[i + 1] + da[i + 2] < 600 && da[i + 3] > 0;
        const darkB = db[i] + db[i + 1] + db[i + 2] < 600 && db[i + 3] > 0;
        if (darkA === darkB) continue;
        const px = (i / 4) % SHEET_W, py = Math.floor(i / 4 / SHEET_W);
        const g = Math.floor(py / CELL) * gw + Math.floor(px / CELL);
        if (darkB) { img.data[i] = 200; img.data[i + 1] = 50; img.data[i + 2] = 43; img.data[i + 3] = 230; grid[g] = grid[g] === -1 ? 2 : grid[g] === 2 ? 2 : 1; }
        else { img.data[i] = 30; img.data[i + 1] = 90; img.data[i + 2] = 200; img.data[i + 3] = 230; grid[g] = grid[g] === 1 ? 2 : grid[g] === 2 ? 2 : -1; }
      }
      out.clearRect(0, 0, SHEET_W, SHEET_H);
      out.putImageData(img, 0, 0);
      setSuggestions(clusters(grid, gw, gh, CELL));
      setShowDiff(true);
      setCompare(false);
    } finally { setDiffBusy(false); }
  }

  function acceptSuggestion(s: Suggestion) {
    commitMarkup("cloud", [s.p1, s.p2], s.kind === "added" ? "Added in this revision" : "Removed in this revision");
    setSuggestions(list => list.filter(x => x.id !== s.id));
  }

  if (!drawing || !rev) return <div className="p-6">Drawing not found. <Link className="underline" href="/drawings">Back to drawings</Link></div>;

  const cursor = tool === "select" ? (panning ? "grabbing" : "grab") : "crosshair";

  return (
    <div className="flex flex-col h-screen">
      {/* Title block */}
      <header className="border-b border-rule bg-paper px-4 py-2 flex flex-wrap items-center gap-x-6 gap-y-2">
        <div className="flex items-baseline gap-3">
          <span className="text-2xl font-bold tracking-tight">{drawing.number}</span>
          <span className="text-sm text-inkSoft max-w-md truncate">{drawing.title}</span>
        </div>
        <label className="text-sm flex items-center gap-2">
          Revision
          <select className="field w-auto" value={revIdx} onChange={e => setRevIdx(Number(e.target.value))}>
            {drawing.revisions.map((r, i) => <option key={r.id} value={i}>Rev {r.rev} — {r.date}</option>)}
          </select>
        </label>
        {prevRev && (
          <div className="flex items-center gap-2 text-sm">
            <button className={`btn ${compare ? "bg-ink text-paper" : ""}`} onClick={() => { setCompare(c => !c); setShowDiff(false); }}>Overlay Rev {prevRev.rev}</button>
            {compare && <input aria-label="Overlay opacity" type="range" min={0.1} max={0.9} step={0.05} value={compareOpacity} onChange={e => setCompareOpacity(Number(e.target.value))} />}
            <button className={`btn ${showDiff ? "bg-ink text-paper" : ""}`} disabled={diffBusy} onClick={() => (showDiff ? setShowDiff(false) : runDiff())}>
              {diffBusy ? "Comparing…" : showDiff ? "Hide differences" : `Find differences vs Rev ${prevRev.rev}`}
            </button>
          </div>
        )}
        <div className="ml-auto text-xs text-inkSoft">{rev.description}</div>
      </header>

      <div className="flex flex-1 min-h-0">
        {/* Toolbar */}
        <div className="w-14 border-r border-rule bg-paper flex flex-col items-center py-2 gap-1">
          {([["select", "Select / pan", "↖"], ["cloud", "Revision cloud", "☁"], ["rect", "Rectangle", "▭"], ["pen", "Freehand", "✎"], ["note", "Note", "T"]] as [Tool, string, string][]).map(([t, title, glyph]) => (
            <button key={t} title={title} aria-label={title} onClick={() => setTool(t)}
              className={`w-10 h-10 rounded text-lg ${tool === t ? "bg-cloud text-paper" : "hover:bg-ink/5"}`}>{glyph}</button>
          ))}
          <div className="border-t border-rule w-8 my-2" />
          <button className="w-10 h-10 rounded hover:bg-ink/5" aria-label="Zoom in" onClick={() => setView(v => ({ ...v, scale: v.scale * 1.25 }))}>+</button>
          <button className="w-10 h-10 rounded hover:bg-ink/5" aria-label="Zoom out" onClick={() => setView(v => ({ ...v, scale: v.scale / 1.25 }))}>−</button>
        </div>

        {/* Viewport */}
        <div ref={viewportRef} className="flex-1 relative overflow-hidden bg-[#E9ECEF]" onWheel={onWheel}>
          <div style={{ transform: `translate(${view.tx}px, ${view.ty}px) scale(${view.scale})`, transformOrigin: "0 0", width: SHEET_W, height: SHEET_H }} className="absolute shadow-lg bg-paper">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={rev.src} alt={`${drawing.number} Rev ${rev.rev}`} width={SHEET_W} height={SHEET_H} draggable={false} className="absolute inset-0 select-none" />
            {compare && prevRev && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={prevRev.src} alt="" width={SHEET_W} height={SHEET_H} draggable={false} className="absolute inset-0 select-none pointer-events-none" style={{ opacity: compareOpacity, filter: "sepia(1) hue-rotate(180deg) saturate(3)" }} />
            )}
            <canvas ref={diffCanvasRef} width={SHEET_W} height={SHEET_H} className="absolute inset-0 pointer-events-none" style={{ display: showDiff ? "block" : "none" }} />
            <svg ref={svgRef} viewBox={`0 0 ${SHEET_W} ${SHEET_H}`} width={SHEET_W} height={SHEET_H} className="absolute inset-0 touch-none" style={{ cursor }}
              onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerLeave={onPointerUp}>
              {showDiff && suggestions.map(s => (
                <g key={s.id} className="cursor-pointer" onPointerDown={e => { e.stopPropagation(); acceptSuggestion(s); }}>
                  <rect x={s.p1.x} y={s.p1.y} width={s.p2.x - s.p1.x} height={s.p2.y - s.p1.y} fill={s.kind === "added" ? "rgba(200,50,43,0.08)" : "rgba(30,90,200,0.08)"} stroke={s.kind === "added" ? "#C8322B" : "#1E5AC8"} strokeDasharray="8 6" strokeWidth={2} />
                  <text x={s.p1.x + 6} y={s.p1.y - 6} fontSize={14} fill={s.kind === "added" ? "#C8322B" : "#1E5AC8"}>{s.kind === "added" ? "Added" : "Removed"} — click to cloud</text>
                </g>
              ))}
              {markups.map(m => <MarkupShape key={m.id} m={m} selected={m.id === selectedId} onSelect={() => { if (tool === "select") setSelectedId(m.id); }} />)}
              {draft && (tool === "cloud" ? <path d={cloudPath(draft[0].x, draft[0].y, draft[1].x, draft[1].y)} fill="none" stroke="#C8322B" strokeWidth={3} />
                : tool === "rect" ? <rect {...rectAttrs(draft)} fill="none" stroke="#C8322B" strokeWidth={3} />
                : <polyline points={draft.map(p => `${p.x},${p.y}`).join(" ")} fill="none" stroke="#C8322B" strokeWidth={3} />)}
            </svg>
          </div>
          <div className="absolute bottom-2 left-2 text-xs text-inkSoft bg-paper/80 rounded px-2 py-1">
            {Math.round(view.scale * 100)}% · scroll to zoom · {tool === "select" ? "drag to pan, click a markup to select" : `drag to draw a ${tool}`}
          </div>
        </div>

        {/* Side panel */}
        <aside className="w-80 shrink-0 border-l border-rule bg-paper overflow-y-auto">
          {selected ? (
            <MarkupPanel m={selected} onClose={() => setSelectedId(null)} />
          ) : (
            <div className="p-4">
              <h2 className="font-semibold">Markups on Rev {rev.rev}</h2>
              {markups.length === 0 && <p className="text-sm text-inkSoft mt-2">Nothing captured yet. Use <b>Find differences</b> to let SiteLayer propose clouds, or draw a cloud around what changed.</p>}
              <ul className="mt-2 divide-y divide-rule">
                {markups.map(m => {
                  const ci = state.changeItems.find(c => c.id === m.changeItemId);
                  return (
                    <li key={m.id}>
                      <button className="w-full text-left py-2 text-sm hover:bg-ink/5 rounded px-1" onClick={() => setSelectedId(m.id)}>
                        <div className="flex justify-between">
                          <span className="capitalize">{m.kind}{m.text ? ` — ${m.text}` : ""}</span>
                          {ci ? <span className="text-approve">{money(itemTotal(ci))}</span> : (m.kind === "cloud" || m.kind === "rect") && <span className="pill bg-cloudSoft text-cloud">unpriced</span>}
                        </div>
                        <div className="text-xs text-inkSoft">{m.author} · {new Date(m.createdAt).toLocaleDateString()}</div>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

// ---- helpers --------------------------------------------------------------

function rectAttrs(pts: Pt[]) {
  const b = bounds(pts);
  return { x: b.minX, y: b.minY, width: b.maxX - b.minX, height: b.maxY - b.minY };
}

function MarkupShape({ m, selected, onSelect }: { m: Markup; selected: boolean; onSelect: () => void }) {
  const stroke = m.changeItemId ? "#2F7D5B" : "#C8322B";
  const common = { fill: "none", stroke, strokeWidth: selected ? 5 : 3, style: { cursor: "pointer" }, onPointerDown: (e: React.PointerEvent) => { e.stopPropagation(); onSelect(); } };
  const b = bounds(m.points);
  return (
    <g>
      {m.kind === "cloud" && <path d={cloudPath(m.points[0].x, m.points[0].y, m.points[1].x, m.points[1].y)} {...common} />}
      {m.kind === "rect" && <rect {...rectAttrs(m.points)} {...common} />}
      {m.kind === "pen" && <polyline points={m.points.map(p => `${p.x},${p.y}`).join(" ")} {...common} strokeLinejoin="round" />}
      {m.kind === "note" && (
        <g onPointerDown={common.onPointerDown} style={{ cursor: "pointer" }}>
          <rect x={m.points[0].x} y={m.points[0].y - 22} width={Math.max(60, (m.text?.length ?? 0) * 8 + 16)} height={28} fill="#FBE9E7" stroke={stroke} strokeWidth={selected ? 3 : 1.5} />
          <text x={m.points[0].x + 8} y={m.points[0].y - 3} fontSize={14} fill="#1B2A41">{m.text}</text>
        </g>
      )}
      {(m.kind === "cloud" || m.kind === "rect") && m.text && (
        <text x={b.minX} y={b.minY - 8} fontSize={14} fill={stroke} fontWeight={600}>{m.text}</text>
      )}
    </g>
  );
}

function MarkupPanel({ m, onClose }: { m: Markup; onClose: () => void }) {
  const { state, dispatch } = useStore();
  const existing = state.changeItems.find(c => c.id === m.changeItemId);
  const [item, setItem] = useState<ChangeItem>(() => existing ?? {
    id: uid("ci"), markupId: m.id, drawingId: m.drawingId, revisionId: m.revisionId,
    description: m.text ?? "", trade: "Mechanical", quantity: 1, unit: "ea", labourRate: 0, materialRate: 0,
    status: "captured", createdAt: new Date().toISOString(),
  });
  const [text, setText] = useState(m.text ?? "");
  const cor = state.cors.find(c => c.id === item.corId);
  const canPrice = m.kind === "cloud" || m.kind === "rect";

  function save() {
    dispatch({ type: "updateMarkup", id: m.id, patch: { text } });
    if (canPrice) dispatch({ type: "upsertChangeItem", item: { ...item, status: item.corId ? "in-cor" : "priced" } });
  }
  function addToCor(corId: string) {
    let id = corId;
    if (corId === "__new") {
      const n = state.cors.length + 4;
      id = uid("cor");
      dispatch({ type: "addCor", cor: { id, number: `COR-${String(n).padStart(3, "0")}`, title: `${state.drawings.find(d => d.id === m.drawingId)?.number} revision changes`, reason: "Design revision", overheadPct: 10, profitPct: 5, status: "draft", createdAt: new Date().toISOString() } });
    }
    const next = { ...item, corId: id, status: "in-cor" as const };
    setItem(next);
    dispatch({ type: "upsertChangeItem", item: next });
  }

  return (
    <div className="p-4 text-sm">
      <div className="flex justify-between items-start">
        <h2 className="font-semibold capitalize">{m.kind} markup</h2>
        <button className="btn btn-ghost" onClick={onClose}>Close</button>
      </div>
      <div className="text-xs text-inkSoft">{m.author} · {new Date(m.createdAt).toLocaleString()}</div>

      <label className="label mt-3">What changed</label>
      <input className="field" value={text} onChange={e => setText(e.target.value)} placeholder="e.g. Pump P-3 added, not in tender set" />

      {canPrice && (
        <fieldset className="mt-4 border-t border-rule pt-3">
          <legend className="font-semibold">Price this change</legend>
          <label className="label mt-2">Scope description</label>
          <textarea className="field" rows={2} value={item.description} onChange={e => setItem({ ...item, description: e.target.value })} />
          <div className="grid grid-cols-2 gap-2 mt-2">
            <div><label className="label">Trade</label>
              <select className="field" value={item.trade} onChange={e => setItem({ ...item, trade: e.target.value })}>
                {["Mechanical", "Electrical", "Structural", "Civil", "Architectural", "Marine"].map(t => <option key={t}>{t}</option>)}
              </select></div>
            <div><label className="label">Unit</label>
              <select className="field" value={item.unit} onChange={e => setItem({ ...item, unit: e.target.value })}>
                {["ea", "m", "m²", "m³", "kg", "hr", "LS"].map(u => <option key={u}>{u}</option>)}
              </select></div>
            <div><label className="label">Quantity</label><input type="number" className="field" value={item.quantity} onChange={e => setItem({ ...item, quantity: Number(e.target.value) })} /></div>
            <div><label className="label">Labour / unit (CAD)</label><input type="number" className="field" value={item.labourRate} onChange={e => setItem({ ...item, labourRate: Number(e.target.value) })} /></div>
            <div><label className="label">Material / unit (CAD)</label><input type="number" className="field" value={item.materialRate} onChange={e => setItem({ ...item, materialRate: Number(e.target.value) })} /></div>
            <div><label className="label">Line total</label><div className="py-1.5 font-semibold">{money(itemTotal(item))}</div></div>
          </div>
          <div className="mt-3 flex gap-2">
            <button className="btn btn-primary" onClick={save}>Save price</button>
            {existing && <button className="btn" onClick={() => dispatch({ type: "deleteChangeItem", id: existing.id })}>Remove price</button>}
          </div>

          <div className="mt-4">
            <label className="label">Change order request</label>
            {cor ? (
              <div className="flex items-center justify-between">
                <span>{cor.number} <span className="text-inkSoft">({cor.status})</span></span>
                <Link className="underline" href="/changes">Open</Link>
              </div>
            ) : (
              <select className="field" value="" onChange={e => e.target.value && addToCor(e.target.value)}>
                <option value="">Add to…</option>
                {state.cors.filter(c => c.status === "draft").map(c => <option key={c.id} value={c.id}>{c.number} — {c.title}</option>)}
                <option value="__new">New change order request</option>
              </select>
            )}
          </div>
        </fieldset>
      )}

      {!canPrice && <button className="btn btn-primary mt-3" onClick={save}>Save</button>}
      <button className="btn btn-ghost text-cloud mt-6" onClick={() => { if (confirm("Delete this markup and any price attached to it?")) { dispatch({ type: "deleteMarkup", id: m.id }); onClose(); } }}>Delete markup</button>
    </div>
  );
}

function loadImage(src: string) {
  return new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = src; });
}
function rasterise(img: HTMLImageElement) {
  const c = document.createElement("canvas"); c.width = SHEET_W; c.height = SHEET_H;
  const ctx = c.getContext("2d", { willReadFrequently: true })!;
  ctx.fillStyle = "#fff"; ctx.fillRect(0, 0, SHEET_W, SHEET_H);
  ctx.drawImage(img, 0, 0, SHEET_W, SHEET_H);
  return ctx;
}
/** Group changed grid cells into bounding boxes (8-connected flood fill). */
function clusters(grid: Int8Array, gw: number, gh: number, cell: number): Suggestion[] {
  const seen = new Uint8Array(gw * gh);
  const out: Suggestion[] = [];
  for (let start = 0; start < grid.length; start++) {
    if (!grid[start] || seen[start]) continue;
    const stack = [start]; seen[start] = 1;
    let minX = gw, minY = gh, maxX = 0, maxY = 0, added = 0, removed = 0, n = 0;
    while (stack.length) {
      const i = stack.pop()!; n++;
      const x = i % gw, y = Math.floor(i / gw);
      minX = Math.min(minX, x); maxX = Math.max(maxX, x); minY = Math.min(minY, y); maxY = Math.max(maxY, y);
      if (grid[i] === 1) added++; else if (grid[i] === -1) removed++; else { added++; removed++; }
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= gw || ny >= gh) continue;
        const j = ny * gw + nx;
        if (grid[j] && !seen[j]) { seen[j] = 1; stack.push(j); }
      }
    }
    if (n < 2) continue;
    // ignore the title-block revision stamp region (bottom-right) — it always changes
    if (minX * cell > 960 && minY * cell > 740) continue;
    out.push({ id: uid("sg"), kind: added >= removed ? "added" : "removed", p1: { x: minX * cell - 12, y: minY * cell - 12 }, p2: { x: (maxX + 1) * cell + 12, y: (maxY + 1) * cell + 12 } });
  }
  return out;
}
