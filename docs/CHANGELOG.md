# Changelog

## 2026-09-04 — Hosting moved from Vercel to Cloudflare
- Added `@opennextjs/cloudflare`, `wrangler.jsonc`, `open-next.config.ts`; removed `vercel.json`.
- Upgraded Next.js 14 → 15.5 and React 18 → 19 (the adapter requires Next ≥ 15.5). `app/drawings/[id]/page.tsx` now awaits `params`.
- GitHub Actions builds with OpenNext on every push and deploys `main` to Workers (needs `CLOUDFLARE_API_TOKEN` + `CLOUDFLARE_ACCOUNT_ID` secrets).
- Plans updated: PDF rendering, diffing and COR PDF generation move to the browser (no `sharp` on Workers); Vercel Blob → R2; Neon via Hyperdrive with the Prisma driver adapter.
- Test: `npm run dev` works as before; `npx opennextjs-cloudflare build` produces `.open-next/worker.js`.
