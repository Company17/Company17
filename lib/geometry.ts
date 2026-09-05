/** Revision-cloud path around a rectangle: scalloped arcs on all four edges. */
export function cloudPath(x1: number, y1: number, x2: number, y2: number, r = 18): string {
  const minX = Math.min(x1, x2), maxX = Math.max(x1, x2);
  const minY = Math.min(y1, y2), maxY = Math.max(y1, y2);
  const w = maxX - minX, h = maxY - minY;
  if (w < 4 || h < 4) return "";
  const nx = Math.max(1, Math.round(w / (r * 2)));
  const ny = Math.max(1, Math.round(h / (r * 2)));
  const sx = w / nx, sy = h / ny;
  let d = `M ${minX} ${minY}`;
  for (let i = 1; i <= nx; i++) d += ` A ${sx / 2} ${sx / 2} 0 0 1 ${minX + i * sx} ${minY}`;
  for (let i = 1; i <= ny; i++) d += ` A ${sy / 2} ${sy / 2} 0 0 1 ${maxX} ${minY + i * sy}`;
  for (let i = 1; i <= nx; i++) d += ` A ${sx / 2} ${sx / 2} 0 0 1 ${maxX - i * sx} ${maxY}`;
  for (let i = 1; i <= ny; i++) d += ` A ${sy / 2} ${sy / 2} 0 0 1 ${minX} ${maxY - i * sy}`;
  return d + " Z";
}

export function bounds(points: { x: number; y: number }[]) {
  const xs = points.map(p => p.x), ys = points.map(p => p.y);
  return { minX: Math.min(...xs), minY: Math.min(...ys), maxX: Math.max(...xs), maxY: Math.max(...ys) };
}
