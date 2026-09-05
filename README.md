# SiteLayer

Construction management software with one opinion: **every dollar of change should trace back to a cloud on a drawing.**

This repository is the beta-candidate codebase. It runs as a static Next.js app (no database yet — see `docs/ARCHITECTURE.md` for the persistence plan), and deploys to Cloudflare Workers through the OpenNext adapter (see `docs/CLOUDFLARE.md`).

## What works today

- Drawing register with revision history
- Drawing review tool: pan/zoom, revision cloud, rectangle, freehand, note
- Overlay a previous revision (tinted) with adjustable opacity
- **Find differences** — pixel-compares the current sheet with the previous revision, highlights additions (red) and removals (blue), and proposes clouds you can accept with one click
- Price a cloud (trade, quantity, unit, labour and material rates) and add it to a change order request
- Change order requests with overhead/profit, status, CSV export
- RFIs pinned to drawings
- Demo data persists in the browser (localStorage); "Reset demo data" in the sidebar

## Run locally

```bash
npm install
npm run dev      # http://localhost:3000
npm run build    # production build (also run in CI)
```

## Put it on GitHub and Cloudflare

```bash
git init && git add -A && git commit -m "SiteLayer beta candidate"
gh repo create sitelayer --private --source=. --push     # or create the repo in the GitHub UI and push
```

Then add two GitHub repository secrets, `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` (see `docs/CLOUDFLARE.md`). The workflow in `.github/workflows/ci.yml` typechecks and builds every push and deploys `main` to Cloudflare Workers. Local preview in the Workers runtime: `npm run preview` (use WSL on Windows).

## Repository map

```
app/                 Next.js App Router pages (overview, drawings, drawings/[id], changes, rfis, api/health)
components/          Nav, DrawingReview (the review + change-capture tool)
lib/                 types, seed data, store (reducer + localStorage), geometry (revision-cloud path)
public/drawings/     sample sheets M-101 and E-201, Rev A and B
docs/                work plan, competitor innovation list, architecture
```

## Docs

- `docs/WORK_PLAN.md` — phases, deadlines and deliverables through beta launch
- `docs/COMPETITOR_INNOVATIONS.md` — what Procore, Autodesk Construction Cloud/Aconex, Viewpoint Vista and Trimble ProjectSight should do, and how SiteLayer does it
- `docs/ARCHITECTURE.md` — current build and the path to multi-user production
