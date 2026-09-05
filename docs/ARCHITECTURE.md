# Architecture

## Now (beta candidate in this repository)

- **Next.js 14, App Router, TypeScript, Tailwind.** Static pages; only `/drawings/[id]` is dynamic (route param).
- **State:** a single reducer (`lib/store.tsx`) holding drawings, markups, change items, change order requests and RFIs. Persisted to `localStorage` so the demo survives refreshes. This is deliberately a thin seam: the reducer's action set is the shape of the future API.
- **Sheets:** SVG files in `public/drawings/`. The review tool treats them as images with a fixed 1400 × 900 coordinate system; markups are stored in sheet coordinates so they survive zoom and screen size.
- **Revision diff:** both revisions are rasterised to canvases in the browser; pixels are classified as "dark" or "light"; a pixel dark in one revision and light in the other is a change. Changed pixels are bucketed into a 20 px grid and flood-filled into components, which become cloud suggestions. The title-block region is excluded because the revision stamp always changes.
- **Deployment:** Vercel, zero config. `GET /api/health` for uptime checks.

## Next (Phase 1 onward)

```
Browser (Next.js) ──► Route handlers / server actions ──► Postgres (Neon or Vercel Postgres) via Prisma
                                        │
                                        ├──► Blob storage (Vercel Blob / S3) for PDFs and rendered pages
                                        ├──► Render worker (serverless): PDF → page images + vector extraction
                                        └──► Diff worker: vector diff (path comparison) with pixel fallback
```

- **Auth:** Auth.js with magic-link email; organisations → projects → memberships with roles. Row-level access checks in every handler.
- **Real-time:** Postgres change feed pushed over Server-Sent Events for markup presence and updates.
- **Offline:** service worker caches the current set and queues writes; conflicts resolved by last-writer-wins per markup with an audit trail.
- **Integrations:** cost-code mapping table; CSV export first, then API push to Vista, Sage and Jonas.

## Coordinate and data conventions

- Markup `points` are in sheet units. Clouds and rectangles store two corners; freehand stores the stroke; notes store one anchor.
- A `ChangeItem` references exactly one `Markup`; a `Markup` has at most one `ChangeItem`. Deleting a markup deletes its item.
- Money is stored as numbers in CAD for the demo; production will store minor units (cents) as integers with a currency field.
