export function GET() {
  return Response.json({ ok: true, service: "sitelayer", time: new Date().toISOString() });
}
