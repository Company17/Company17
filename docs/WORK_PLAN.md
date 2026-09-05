# SiteLayer — work plan to beta

Owner: Tom (product owner). Builder: Claude (project management + development).
Plan date: 3 September 2026. Beta launch target: **Monday 18 January 2027**.

Cadence: one-week sprints, Monday planning, Friday demo. Each phase ends with a gate review; a phase does not close until its exit criteria are met.

## Phase 0 — Discovery and definition (3–11 Sept 2026)

| # | Deliverable | Due |
|---|-------------|-----|
| 0.1 | Competitor teardown and innovation list (`docs/COMPETITOR_INNOVATIONS.md`) | 4 Sept |
| 0.2 | Beta scope frozen: drawing review, change capture, change order requests (COR), RFIs (requests for information) | 8 Sept |
| 0.3 | Walking skeleton deployed to Vercel (this repository) | 8 Sept |
| 0.4 | Beta tester shortlist: 3 project teams, 2 subcontractors, 1 consultant | 11 Sept |

Exit: Tom signs off scope and can open the Vercel URL on a phone and cloud a change.

## Phase 1 — Foundation (14 Sept – 2 Oct 2026)

| # | Deliverable | Due |
|---|-------------|-----|
| 1.1 | Postgres schema (projects, drawings, revisions, markups, change items, CORs, RFIs, users) with Prisma migrations | 18 Sept |
| 1.2 | Authentication (magic-link email via Auth.js), organisations, project membership, roles: owner / contractor / subcontractor / consultant / viewer | 25 Sept |
| 1.3 | File storage for sheets (Vercel Blob or S3-compatible), PDF → per-page image render pipeline (pdf.js in a serverless function) | 2 Oct |
| 1.4 | Audit log on every write (who, what, when, from which revision) | 2 Oct |

Exit: two users on two devices see the same markups within 2 seconds; a 200-sheet PDF set uploads and pages render in under 5 minutes.

## Phase 2 — Drawing review and change capture (5 – 30 Oct 2026)

| # | Deliverable | Due |
|---|-------------|-----|
| 2.1 | Revision diff moved server-side (rasterise both revisions, cluster differences, store suggestions) so it works on 36" x 48" sheets and phones | 9 Oct |
| 2.2 | Vector-aware diff for PDFs with live text/geometry (compare paths, not pixels) — beats pixel diff on scaled or shifted sheets | 16 Oct |
| 2.3 | Measurement tools: calibrate scale from a known dimension; measure length, area, count; quantities flow straight into the price form | 23 Oct |
| 2.4 | Hyperlinked sheets: detect callouts/section markers and link between sheets | 23 Oct |
| 2.5 | Offline mode: current set cached on device (service worker), markups queue and sync | 30 Oct |
| 2.6 | Markup layers by author/role; consultant markups locked; "issued to trade" snapshot of a marked-up sheet | 30 Oct |

Exit: a superintendent can find every change between two revisions of a real set in under 10 minutes with no manual cloud drawing.

## Phase 3 — Change management and pricing (2 – 20 Nov 2026)

| # | Deliverable | Due |
|---|-------------|-----|
| 3.1 | Rate library per project (labour by trade, material unit rates, equipment) with import from spreadsheet | 6 Nov |
| 3.2 | Change item → quotation request to subcontractor with their own portal view of the cloud; sub prices in place | 13 Nov |
| 3.3 | COR builder: bundle items, apply overhead/profit/bond, generate PDF with the clouded sheet extracts embedded as backup | 13 Nov |
| 3.4 | Schedule impact field per COR and a simple day-impact roll-up | 20 Nov |
| 3.5 | Approval workflow: draft → submitted → consultant review → owner decision, with e-signature capture | 20 Nov |

Exit: a full COR with three items, two sub quotes and drawing backup goes from cloud to signed PDF without leaving the app.

## Phase 4 — Coordination, RFIs and daily operations (23 Nov – 11 Dec 2026)

| # | Deliverable | Due |
|---|-------------|-----|
| 4.1 | RFIs pinned to sheet locations; answer can be converted to a markup or a change item in one click | 27 Nov |
| 4.2 | Daily log (weather auto-filled, manpower by trade, delays) linkable to change items as delay evidence | 4 Dec |
| 4.3 | Site photos geotagged and pinned to sheets; photo-to-change linking | 4 Dec |
| 4.4 | Notifications: email + push, "ball in court" digest each morning | 11 Dec |
| 4.5 | Export to accounting: cost codes on every item; CSV/API push to Vista, Sage, Jonas | 11 Dec |

Exit: a week of real site data entered by a field engineer without training beyond a 15-minute walkthrough.

## Phase 5 — Hardening and beta readiness (14 Dec 2026 – 15 Jan 2027)

| # | Deliverable | Due |
|---|-------------|-----|
| 5.1 | Security review: row-level access tests, rate limiting, dependency audit, backups and restore drill | 18 Dec |
| 5.2 | Performance: 1,000-sheet set, 10,000 markups, p95 page load under 1.5 s | 18 Dec |
| 5.3 | Accessibility pass (keyboard, contrast, screen-reader labels on tools) | 8 Jan |
| 5.4 | Beta documentation: 5 two-minute videos, in-app tour, feedback widget, support inbox | 12 Jan |
| 5.5 | Beta agreement, data handling notice, tester onboarding sessions booked | 15 Jan |

Exit: Go/no-go review on Friday 15 January 2027.

## Beta (18 Jan – 12 Mar 2027)

- Weeks 1–2: onboarding, one project per team
- Weeks 3–6: weekly feedback calls, fixes shipped within 48 hours for blockers
- Week 8: beta retrospective, decision on general availability scope

## Risks and responses

| Risk | Response |
|------|----------|
| Pixel diff produces noise on scanned or re-plotted sheets | Vector diff (2.2) as primary; pixel diff with alignment correction as fallback; user-adjustable sensitivity |
| Large PDF sets slow to render | Pre-render on upload, tile images, lazy load |
| Subcontractors will not adopt another portal | Sub pricing works from an emailed link with no account required |
| Scope creep toward "all of Procore" | Beta scope is frozen at Phase 0; new asks go to a post-beta backlog |
| Single developer (Claude) dependency | Every phase leaves the main branch deployable; CI blocks broken builds |

## Definition of done (every item)

Typecheck and build pass in CI · deployed to a preview URL · demo recorded · acceptance criteria checked by Tom · audit-logged where it writes data.
