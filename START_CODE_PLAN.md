# SiteLayer — start code plan

Repository: `git@github.com:Company17/Company17.git`
This file is the first thing to read when opening the repo. It says what exists, what order to build in, and how each piece gets committed.

## 1. What is in the repo on day zero

```
README.md                         how to run and deploy
START_CODE_PLAN.md                this file
SITELAYER_ONE_WEEK_BUILD.md       day-by-day scope for the week
docs/WORK_PLAN.md                 phases through beta (18 Jan 2027)
docs/COMPETITOR_INNOVATIONS.md    what incumbents miss and what SiteLayer does about it
docs/ARCHITECTURE.md              current build and production path
app/                              Next.js pages: overview, drawings, drawings/[id], changes, rfis, api/health
components/                       Nav, DrawingReview (review + change-capture tool)
lib/                              types, seed, store (reducer), geometry (revision cloud)
public/drawings/                  sample sheets M-101, E-201 (Rev A and B)
.github/workflows/ci.yml          typecheck + build on every push
```

State is in-browser only. The whole point of the week is to replace `lib/store.tsx` with a database and server actions without changing the page code more than necessary.

## 2. Repo setup (do once)

```bash
git clone git@github.com:Company17/Company17.git sitelayer && cd sitelayer
npm install
cp .env.example .env.local      # fill in after step 3
npm run dev
```

Branch rules:
- `main` is always deployable; GitHub Actions deploys it to Cloudflare Workers.
- One branch per task below, named `feat/<task-id>`; open a PR, CI must be green, squash-merge.
- Commit messages: `feat(area): what changed` / `fix(area): …` / `chore: …`.

Accounts needed before the first task: Neon (Postgres), Cloudflare (Workers, R2, Hyperdrive), Resend (email for login links). Put the keys in Cloudflare → Workers → sitelayer → Settings → Variables and in `.env.local`; add `CLOUDFLARE_API_TOKEN` and `CLOUDFLARE_ACCOUNT_ID` as GitHub repository secrets.

## 3. Build order

Each task is one PR. Do them in this order; each one depends on the previous.

| ID | Task | Files touched | Done when |
|----|------|---------------|-----------|
| T01 | Prisma + Neon | `prisma/schema.prisma`, `lib/db.ts`, `prisma/seed.ts`, `.env.example` | `npx prisma migrate dev` creates tables; `npx prisma db seed` recreates the demo data |
| T02 | Auth.js magic link | `auth.ts`, `app/login/page.tsx`, `middleware.ts`, `app/layout.tsx` | Unauthenticated users land on `/login`; login email arrives; session shows user email in sidebar |
| T03 | Server actions replace reducer | `app/actions/{markups,changeItems,cors,rfis}.ts`, `lib/store.tsx` deleted, pages read from Prisma | Every action from the old reducer exists as a server action with the same name; all pages work with no `localStorage` |
| T04 | Audit log | `app/actions/_audit.ts`, called by every action | Every write creates an `AuditEvent` row; `/audit` page lists the last 100 |
| T05 | Organisations, projects, members, roles | `app/actions/members.ts`, `app/projects/*`, `components/ProjectSwitcher.tsx` | Invite by email works; VIEWER cannot see the price form; SUBCONTRACTOR sees only their clouds |
| T06 | PDF upload → page images | `app/actions/upload.ts`, `components/PdfUploader.tsx` (browser render), `app/api/sheets/route.ts` (R2 write) | A 40-page PDF becomes 40 revisions with stored width/height in under 5 min |
| T07 | Sheet-number detection | `lib/titleblock.ts` | Sheet numbers read from title block text; unmatched pages go to a manual assign screen |
| T08 | Review tool on variable page sizes | `components/DrawingReview.tsx` | The 1400 × 900 constant is gone; any page size renders and markups land where drawn |
| T09 | Diff in a web worker | `lib/diff.ts` (browser canvas, web worker) | Suggestions computed off the main thread; cached per revision pair in IndexedDB; title-block region excluded; translation offset applied |
| T10 | Markup layers by role | `components/DrawingReview.tsx`, `app/actions/markups.ts` | Colour per role; consultant markups locked to contractors |
| T11 | Rate library | `app/projects/[id]/rates/*`, CSV import | Price form pre-fills labour and material from the library |
| T12 | Subcontractor quote link | `app/quote/[token]/page.tsx`, `app/actions/quotes.ts` | Sub prices a cloud from an emailed link with no login; token expires after 14 days |
| T13 | COR PDF export | `lib/pdf/cor.tsx` (`@react-pdf/renderer`, browser), `lib/crop.ts` (canvas) | PDF has cover, items, totals, one page per cloud with the sheet crop and the cloud drawn on it |
| T14 | COR status flow | `app/actions/cors.ts` | draft → submitted → approved/rejected with who/when, audited |
| T15 | RFIs with sheet pins | `app/rfis/*`, `app/actions/rfis.ts` | RFI pin is a `note` markup; answered RFI has "Convert to change item" |
| T16 | Overview from real data | `app/page.tsx` | Unpriced clouds, priced-not-in-COR, exposure by status, overdue RFIs, per project |
| T17 | Access tests | `tests/access.test.ts` (Vitest) | Every action is refused for non-members and wrong roles |
| T18 | Hardening | `zod` on all inputs, rate limit on login, lazy images | Lighthouse mobile performance ≥ 80 on the review page |
| T19 | Docs and tester guide | `README.md`, `docs/ARCHITECTURE.md`, `docs/BETA_TESTER_GUIDE.md` | Tom completes the tester guide without asking a question |

Mapping to the week: T01–T04 Day 1, T05 Day 2, T06–T07 Day 3, T08–T10 Day 4, T11–T14 Day 5, T15–T16 Day 6, T17–T19 Day 7.

## 4. Conventions the code must follow

- TypeScript strict, no `any`.
- Prisma is only imported in `lib/db.ts` and `app/actions/*`.
- Every server action: check membership and role → write → audit. No exceptions.
- Money in integer cents. Markup points in the page's pixel space at stored width/height.
- User-facing errors say what happened and what to do next.
- Spell out COR (change order request), RFI (request for information) and IFC (issued for construction) on first use in any screen.

## 5. What "start" means today

1. Push the current code to `main` (commands in README).
2. Add the Cloudflare secrets to GitHub and let the Actions workflow deploy; confirm the workers.dev URL opens and the review tool works.
3. Create the Neon project and Resend account; add keys to Cloudflare Worker variables and `.env.local`.
4. Open a branch `feat/T01` and begin.
