# Hosting on Cloudflare

SiteLayer runs on **Cloudflare Workers** using the OpenNext adapter (`@opennextjs/cloudflare`). Not Cloudflare Pages, and not the older `@cloudflare/next-on-pages` — do not mix the two.

## Services used

| Need | Cloudflare service | Binding in `wrangler.jsonc` |
|------|--------------------|-----------------------------|
| App runtime | Workers (Paid plan recommended: 10 MiB worker size limit vs 3 MiB on Free) | — |
| Sheet PDFs and page PNGs | R2 bucket `sitelayer-sheets` | `SHEETS` |
| Next.js cache (optional) | R2 bucket `sitelayer-cache` | `NEXT_INC_CACHE_R2_BUCKET` |
| Postgres connection pooling | Hyperdrive → Neon | `HYPERDRIVE` |
| Login emails | Resend (external) | env var `AUTH_RESEND_KEY` |

## One-time setup

1. Cloudflare dashboard → Workers & Pages → create nothing yet; the first deploy creates the worker named `sitelayer`.
2. R2 → Create bucket `sitelayer-sheets` (and `sitelayer-cache` if enabling the Next cache). Uncomment the `r2_buckets` block in `wrangler.jsonc`.
3. Hyperdrive → Create configuration → paste the Neon **pooled** connection string. Copy the Hyperdrive ID into `wrangler.jsonc`.
4. My Profile → API Tokens → Create Token → template **Edit Cloudflare Workers**; also add R2 edit. Copy the token.
5. GitHub repo → Settings → Secrets → Actions: add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (Account ID is on the Workers overview page).
6. Push to `main`. The workflow builds with OpenNext and runs `wrangler deploy --keep-vars`. The URL is `https://sitelayer.<account>.workers.dev`; add a custom domain under the worker's Settings → Domains when ready.
7. Runtime secrets (`AUTH_SECRET`, `AUTH_RESEND_KEY`, `DATABASE_URL`…): Worker → Settings → Variables and Secrets. `--keep-vars` in the deploy step stops deploys from wiping them.

## Developing on Windows

Day-to-day `npm run dev` is plain Next.js and works fine on Windows. `npm run preview` / `npm run deploy` run the OpenNext build, which is only reliably supported on Linux/macOS. Either use WSL for those commands or just push and let GitHub Actions deploy — that is the intended path.

## What changed in the plan because of Workers

- **No `sharp`, no native modules, 128 MB memory per request.** PDF page rendering (pdf.js) and revision diffing happen in the browser; the worker only stores and serves. Diff runs in a web worker so the UI stays responsive.
- **Worker size limit.** Keep `pdfjs-dist` and `@react-pdf/renderer` in client bundles only; never import them in a server action or route handler.
- **Prisma** must use a driver adapter (`@prisma/adapter-pg` with the Hyperdrive connection string) — the default Prisma engine does not run in Workers. Migrations run from your machine or CI against `DIRECT_URL`, never from the worker.
- **Uploads to R2** go through a route handler that streams the request body to the `SHEETS` binding; page images are served back through a route handler with cache headers. Keep individual PNGs under ~4 MB (150 dpi, 4000 px long edge).
- **Cron/queues** (later: nightly ball-in-court digest) use Workers Cron Triggers and Queues, both in `wrangler.jsonc`.
