# SiteLayer — one-week build brief

Hand this file to Claude Fable at the start of each session. Read it fully before writing code.

## Context

You are building **SiteLayer**, construction management software whose core idea is: *every dollar of change traces back to a cloud on a drawing.* A working beta-candidate repo already exists (`sitelayer.zip`: Next.js 14, TypeScript, Tailwind, in-browser state, sample sheets, revision-diff tool, change order requests, RFIs). Your job this week is to turn it into a multi-user app that a real project team can use.

Product owner: Tom (Project Manager, Bird Construction). He will test each day's build on a phone and a laptop.

## Fixed decisions (do not relitigate)

| Area | Decision |
|------|----------|
| Framework | Next.js 14 App Router, TypeScript strict, Tailwind |
| Hosting | Vercel (production = `main`, previews = PRs) |
| Database | Postgres on Neon, accessed with Prisma |
| Files | Vercel Blob for uploaded PDFs and rendered page images |
| Auth | Auth.js with email magic link (Resend for email) |
| Real-time | Not this week. Polling every 10 s on the review page is fine |
| Currency | CAD, stored as integer cents |
| Sheet coordinates | Every markup stores points in the page's own pixel space at render size; store page width/height on the revision |

## Scope for the week

**In:** projects, members, drawing register, PDF upload → page images, revision compare and auto-diff, markups, price-a-cloud, change order requests (COR) with PDF export, RFIs, audit log.
**Out (say no):** daily logs, photos, schedule, accounting integrations, offline, vector diff, measurement tools, notifications beyond magic-link email.

If a feature is not in the "In" list, add it to `docs/BACKLOG.md` and move on.

## Data model (Prisma)

```prisma
model Organisation { id String @id @default(cuid()); name String; members Membership[]; projects Project[] }
model User         { id String @id @default(cuid()); email String @unique; name String?; memberships Membership[] }
model Membership   { id String @id @default(cuid()); userId String; orgId String; projectId String?; role Role; user User @relation(...); org Organisation @relation(...) }
enum Role { OWNER CONTRACTOR SUBCONTRACTOR CONSULTANT VIEWER }

model Project      { id String @id @default(cuid()); orgId String; number String; name String; client String; drawings Drawing[]; cors ChangeOrderRequest[]; rfis Rfi[] }
model Drawing      { id String @id @default(cuid()); projectId String; number String; title String; discipline String; revisions Revision[] }
model Revision     { id String @id @default(cuid()); drawingId String; rev String; date DateTime; description String; imageUrl String; width Int; height Int; markups Markup[] }
model Markup       { id String @id @default(cuid()); revisionId String; kind String; points Json; text String?; authorId String; createdAt DateTime @default(now()); changeItem ChangeItem? }
model ChangeItem   { id String @id @default(cuid()); markupId String @unique; description String; trade String; quantity Decimal; unit String; labourCents Int; materialCents Int; status String; corId String?; costCode String? }
model ChangeOrderRequest { id String @id @default(cuid()); projectId String; number String; title String; reason String; overheadPct Decimal; profitPct Decimal; status String; items ChangeItem[]; createdAt DateTime @default(now()) }
model Rfi          { id String @id @default(cuid()); projectId String; number String; subject String; question String; answer String?; drawingId String?; status String; due DateTime; ballInCourt String }
model AuditEvent   { id String @id @default(cuid()); projectId String; userId String; entity String; entityId String; action String; before Json?; after Json?; at DateTime @default(now()) }
```

Every write goes through a server action that (1) checks project membership and role, (2) writes the row, (3) writes an `AuditEvent`. No exceptions.

## Day-by-day plan

Each day ends with: `npm run typecheck && npm run build` green, merged to `main`, deployed, and a 3-line note in `docs/CHANGELOG.md` saying what to test.

### Day 1 — Foundation
- Add Prisma, Neon connection, schema above, first migration, seed script that recreates the current demo (two drawings, one cloud, one COR, two RFIs).
- Auth.js magic link; `/login`; session in layout; redirect unauthenticated users.
- Replace the in-browser reducer with server actions + `revalidatePath`. Keep the action names the same as the current reducer (`addMarkup`, `upsertChangeItem`, `assignToCor` …) so pages change minimally.
- Test: Tom logs in on two devices; a cloud drawn on one appears on the other after refresh.

### Day 2 — Projects and members
- Organisation + project creation, member invite by email (creates a pending membership; magic link on first login activates it), role dropdown.
- Role gates: VIEWER read-only; CONSULTANT can mark up and answer RFIs but not price; SUBCONTRACTOR sees only clouds assigned to them and can enter their price; CONTRACTOR/OWNER everything.
- Project switcher in the sidebar.
- Test: a consultant account cannot see the price form.

### Day 3 — PDF upload and rendering
- Upload a multi-page PDF to Vercel Blob. Serverless route renders each page to PNG with `pdfjs-dist` at 150 dpi (cap 4000 px on the long edge), stores width/height, creates a `Revision` per page under the matching `Drawing` (match by sheet number read from the title block text with `pdfjs` text extraction; fall back to a review screen where Tom assigns numbers manually).
- Progress UI for the upload; re-run rendering if a page fails.
- Test: a 40-page IFC set uploads and every page opens in the review tool in under 5 minutes.

### Day 4 — Review tool on real sheets
- Make the review tool work with variable page sizes (use `width`/`height` from the revision, not the 1400 × 900 constant).
- Move **Find differences** to a server route: fetch both PNGs, diff with `sharp` (threshold, downsample to a 20 px grid, flood-fill clusters), return suggestion boxes. Cache results per revision pair.
- Alignment: before diffing, estimate a translation offset by cross-correlating the two title blocks; apply it. This removes most false positives from re-plotted sheets.
- Markup layers: colour by author role; consultant markups not editable by contractor.
- Test: Tom runs diff on a real Rev A → Rev B pair and the top five suggestions are genuine changes.

### Day 5 — Change orders
- Rate library per project (trade → labour cents/hr, common material items) with CSV import; price form pulls defaults from it.
- Subcontractor quote link: `/quote/[token]` shows the clouded sheet extract and a price form; no login required; token expires in 14 days; submission writes the sub's price onto the change item and audits it.
- COR PDF export (`@react-pdf/renderer`): cover, line items, totals, then one page per cloud with a cropped image of the sheet around the cloud (crop from the PNG with `sharp`, cloud drawn on top).
- Status flow: draft → submitted → approved/rejected, with who/when.
- Test: build a COR with three clouds, get one sub price via the link, download the PDF, and the drawing backup pages are readable.

### Day 6 — RFIs and overview
- RFI create/answer with a pin location on a sheet (store as a `note` markup linked to the RFI).
- "Convert answer to change item" button on an answered RFI: creates a cloud at the pin and opens the price form.
- Overview page reads real numbers: unpriced clouds, priced-not-in-COR, exposure by status, open/overdue RFIs, all per project.
- Test: answer an RFI, convert it, and it shows up in exposure.

### Day 7 — Hardening and handover
- Row-level access tests (Vitest): each server action refused for a user outside the project and for the wrong role.
- Rate limit magic-link requests; validate all inputs with `zod`.
- Lighthouse on the review page ≥ 80 performance on mobile; image `loading="lazy"` on lists.
- Backup: document Neon point-in-time restore; run one restore into a branch and confirm data.
- Update `README.md`, `docs/ARCHITECTURE.md`, write `docs/BETA_TESTER_GUIDE.md` (one page, five tasks a tester should try).
- Test: Tom follows the tester guide start to finish without asking a question.

## Engineering rules

- Small PRs, one per feature; never push a red build to `main`.
- Server actions in `app/actions/*.ts`; one file per entity. Prisma only in `lib/db.ts` and actions.
- No `any`. No client-side secrets. Environment variables documented in `.env.example`.
- Errors shown to users say what happened and what to do next ("Upload failed on page 12 — retry rendering").
- Spell out acronyms in UI copy the first time they appear (COR, RFI, IFC).
- If a day's scope is not going to fit, cut the last item on that day's list and note it in `docs/BACKLOG.md`. Do not slip the day.

## Environment variables

```
DATABASE_URL=            # Neon pooled connection
DIRECT_URL=              # Neon direct connection (migrations)
AUTH_SECRET=
AUTH_RESEND_KEY=
AUTH_EMAIL_FROM=
BLOB_READ_WRITE_TOKEN=
NEXT_PUBLIC_APP_URL=
```

## Definition of done for the week

A new project team can: log in, upload a drawing set, compare two revisions with automatic change detection, cloud and price changes, get a subcontractor price through a link, produce a change order request PDF with drawing backup, and raise and answer RFIs — on a phone or a laptop, with every action audit-logged.

## How to start each session

1. `git pull`, read `docs/CHANGELOG.md` and `docs/BACKLOG.md`.
2. State which day you are on and list that day's items.
3. Build, test, ship, write the changelog note.
