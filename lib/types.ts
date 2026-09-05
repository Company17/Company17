export type Discipline = "Mechanical" | "Electrical" | "Structural" | "Architectural" | "Civil" | "Marine";

export type Revision = {
  id: string;
  rev: string;          // "A", "B", "1"…
  date: string;         // ISO
  description: string;
  src: string;          // path to sheet image (SVG/PNG)
};

export type Drawing = {
  id: string;
  number: string;       // "M-101"
  title: string;
  discipline: Discipline;
  revisions: Revision[]; // oldest → newest
};

export type MarkupKind = "cloud" | "rect" | "pen" | "note";

export type Markup = {
  id: string;
  drawingId: string;
  revisionId: string;
  kind: MarkupKind;
  points: { x: number; y: number }[]; // sheet coordinates (SVG viewBox units)
  text?: string;
  author: string;
  createdAt: string;
  changeItemId?: string;
};

export type ChangeStatus = "captured" | "priced" | "in-cor" | "approved" | "rejected";

export type ChangeItem = {
  id: string;
  markupId: string;
  drawingId: string;
  revisionId: string;
  description: string;
  trade: string;
  quantity: number;
  unit: string;
  labourRate: number;    // per unit
  materialRate: number;  // per unit
  status: ChangeStatus;
  corId?: string;
  createdAt: string;
};

export type CorStatus = "draft" | "submitted" | "approved" | "rejected";

export type ChangeOrderRequest = {
  id: string;
  number: string;   // "COR-004"
  title: string;
  reason: string;   // "Design revision", "Site condition", "Owner request"
  overheadPct: number;
  profitPct: number;
  status: CorStatus;
  createdAt: string;
};

export type Rfi = {
  id: string;
  number: string;
  subject: string;
  drawingId?: string;
  status: "open" | "answered" | "closed";
  due: string;
  ballInCourt: string;
};

export type State = {
  project: { name: string; client: string; number: string };
  drawings: Drawing[];
  markups: Markup[];
  changeItems: ChangeItem[];
  cors: ChangeOrderRequest[];
  rfis: Rfi[];
};
