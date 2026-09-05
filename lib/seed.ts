import type { State } from "./types";

export const seed: State = {
  project: { name: "Harbourside Machine Shop", client: "Coastal Marine Works", number: "P-2026-0417" },
  drawings: [
    {
      id: "d-m101",
      number: "M-101",
      title: "Mechanical room — plan & compressed air layout",
      discipline: "Mechanical",
      revisions: [
        { id: "r-m101-a", rev: "A", date: "2026-07-14", description: "Issued for tender", src: "/drawings/M-101-A.svg" },
        { id: "r-m101-b", rev: "B", date: "2026-08-28", description: "Issued for construction — pump added, air main rerouted", src: "/drawings/M-101-B.svg" },
      ],
    },
    {
      id: "d-e201",
      number: "E-201",
      title: "Substation — single line & panel schedule",
      discipline: "Electrical",
      revisions: [
        { id: "r-e201-a", rev: "A", date: "2026-07-14", description: "Issued for tender", src: "/drawings/E-201-A.svg" },
        { id: "r-e201-b", rev: "B", date: "2026-08-30", description: "Issued for construction — feeder upsized, MCC-2 added", src: "/drawings/E-201-B.svg" },
      ],
    },
  ],
  markups: [
    {
      id: "mk-1",
      drawingId: "d-m101",
      revisionId: "r-m101-b",
      kind: "cloud",
      points: [{ x: 640, y: 300 }, { x: 900, y: 470 }],
      text: "Pump P-3 added, not in tender set",
      author: "Tom",
      createdAt: "2026-09-01T16:10:00Z",
      changeItemId: "ci-1",
    },
  ],
  changeItems: [
    {
      id: "ci-1",
      markupId: "mk-1",
      drawingId: "d-m101",
      revisionId: "r-m101-b",
      description: "Supply and install pump P-3 c/w base, isolation valves and connections",
      trade: "Mechanical",
      quantity: 1,
      unit: "ea",
      labourRate: 4200,
      materialRate: 11800,
      status: "in-cor",
      corId: "cor-1",
      createdAt: "2026-09-01T16:20:00Z",
    },
  ],
  cors: [
    {
      id: "cor-1",
      number: "COR-004",
      title: "M-101 Rev B design changes",
      reason: "Design revision",
      overheadPct: 10,
      profitPct: 5,
      status: "draft",
      createdAt: "2026-09-01T16:25:00Z",
    },
  ],
  rfis: [
    { id: "rfi-1", number: "RFI-012", subject: "Confirm air main routing clearance at grid C/4", drawingId: "d-m101", status: "open", due: "2026-09-10", ballInCourt: "Consultant" },
    { id: "rfi-2", number: "RFI-013", subject: "MCC-2 feeder breaker rating", drawingId: "d-e201", status: "answered", due: "2026-09-05", ballInCourt: "Contractor" },
  ],
};
