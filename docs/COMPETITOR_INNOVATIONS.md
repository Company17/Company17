# What the incumbents should do — and how SiteLayer does it

Competitors reviewed: Procore, Autodesk Construction Cloud (including Aconex and BIM 360), Viewpoint Vista (Trimble), Trimble ProjectSight / Viewpoint Team, Oracle Primavera Unifier. These platforms are broad and mature; the gaps below are about the *seams* between their modules, which is where money leaks on real projects.

| # | Gap in current tools | Improvement they should make | SiteLayer status |
|---|----------------------|------------------------------|------------------|
| 1 | Revision comparison is a visual overlay; the user still hunts for changes | Automatically detect additions/removals between revisions and propose clouds | **Built** (pixel diff + clustering, one-click accept). Vector diff planned Phase 2 |
| 2 | Markups live in the drawing module; pricing lives in change management. Re-keying in between | A cloud *is* a change item: price it where you drew it | **Built** — price form attached to every cloud, item flows to a COR |
| 3 | Change order backup is assembled by hand (screenshots into Word) | Generate the COR PDF with the clouded sheet extracts as backup automatically | Phase 3.3 |
| 4 | Quantities are typed by hand | Calibrated on-sheet measurement that writes quantity into the change item | Phase 2.3 |
| 5 | Subcontractors must adopt the whole platform to price a change | Send a sub one link showing the cloud and a price form; no account needed | Phase 3.2 |
| 6 | RFI answers rarely become tracked changes | "Convert answer to change item" from the RFI itself | Phase 4.1 |
| 7 | Daily logs and delays are disconnected from CORs | Link daily-log delay entries as evidence on a change item | Phase 4.2 |
| 8 | Project overview dashboards show counts, not risk | Lead with money-at-risk: unpriced clouds, priced-but-unsubmitted items, exposure by status | **Built** on the overview page |
| 9 | Offline is partial and unreliable in the field | Whole current set cached on device; markups queue and sync | Phase 2.5 |
| 10 | Pricing is cost-code-agnostic until export | Cost codes on every change item from day one, so accounting export is a push, not a reconciliation | Phase 4.5 |
| 11 | Markup ownership is unclear: consultant, contractor and trade clouds all look alike | Layers by author/role, locked consultant layers, "issued to trade" snapshots | Phase 2.6 |
| 12 | Per-seat pricing pushes subs and consultants off the platform | Unlimited external viewers; charge the general contractor per project | Commercial model for beta |
| 13 | Search is per module | Cross-module search: a grid reference or equipment tag returns sheets, RFIs, changes and photos | Post-beta |
| 14 | Interfaces are dense and desktop-first | One tool palette, sheet-first layout, phone-usable review | **Built** — review tool works with touch and pointer |
| 15 | Schedule impact is a text box | Structured day impact per COR, rolled up per project | Phase 3.4 |

## Innovations already in this build

1. **Find differences** — compares the sheet against the previous revision, colours additions red and removals blue, clusters them into candidate clouds, ignores the title-block stamp, and lets the reviewer accept each with one click.
2. **Cloud-to-cost** — every cloud carries a price form (trade, quantity, unit, labour and material per unit). Saving turns it green; adding it to a change order request marks it "in-cor". The change order table links each line back to its drawing and revision.
3. **Money-at-risk overview** — the first thing a project manager sees is how many clouds have no price and how much is sitting in draft or submitted change order requests.
4. **RFIs pinned to sheets** — each request for information links to the drawing it questions so the answer lands where the change will be priced.
