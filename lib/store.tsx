"use client";
import { createContext, useContext, useEffect, useReducer, type ReactNode } from "react";
import type { ChangeItem, ChangeOrderRequest, Markup, State } from "./types";
import { seed } from "./seed";

type Action =
  | { type: "hydrate"; state: State }
  | { type: "addMarkup"; markup: Markup }
  | { type: "updateMarkup"; id: string; patch: Partial<Markup> }
  | { type: "deleteMarkup"; id: string }
  | { type: "upsertChangeItem"; item: ChangeItem }
  | { type: "deleteChangeItem"; id: string }
  | { type: "addCor"; cor: ChangeOrderRequest }
  | { type: "updateCor"; id: string; patch: Partial<ChangeOrderRequest> }
  | { type: "assignToCor"; itemId: string; corId: string }
  | { type: "reset" };

function reducer(state: State, a: Action): State {
  switch (a.type) {
    case "hydrate": return a.state;
    case "reset": return seed;
    case "addMarkup": return { ...state, markups: [...state.markups, a.markup] };
    case "updateMarkup":
      return { ...state, markups: state.markups.map(m => (m.id === a.id ? { ...m, ...a.patch } : m)) };
    case "deleteMarkup":
      return {
        ...state,
        markups: state.markups.filter(m => m.id !== a.id),
        changeItems: state.changeItems.filter(c => c.markupId !== a.id),
      };
    case "upsertChangeItem": {
      const exists = state.changeItems.some(c => c.id === a.item.id);
      return {
        ...state,
        changeItems: exists ? state.changeItems.map(c => (c.id === a.item.id ? a.item : c)) : [...state.changeItems, a.item],
        markups: state.markups.map(m => (m.id === a.item.markupId ? { ...m, changeItemId: a.item.id } : m)),
      };
    }
    case "deleteChangeItem":
      return {
        ...state,
        changeItems: state.changeItems.filter(c => c.id !== a.id),
        markups: state.markups.map(m => (m.changeItemId === a.id ? { ...m, changeItemId: undefined } : m)),
      };
    case "addCor": return { ...state, cors: [...state.cors, a.cor] };
    case "updateCor": return { ...state, cors: state.cors.map(c => (c.id === a.id ? { ...c, ...a.patch } : c)) };
    case "assignToCor":
      return {
        ...state,
        changeItems: state.changeItems.map(c => (c.id === a.itemId ? { ...c, corId: a.corId, status: "in-cor" } : c)),
      };
    default: return state;
  }
}

const Ctx = createContext<{ state: State; dispatch: (a: Action) => void } | null>(null);
const KEY = "sitelayer:v1";

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, seed);
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) dispatch({ type: "hydrate", state: JSON.parse(raw) as State });
    } catch { /* ignore */ }
  }, []);
  useEffect(() => {
    try { window.localStorage.setItem(KEY, JSON.stringify(state)); } catch { /* ignore */ }
  }, [state]);
  return <Ctx.Provider value={{ state, dispatch }}>{children}</Ctx.Provider>;
}

export function useStore() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useStore must be used inside StoreProvider");
  return v;
}

export const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 8)}`;

export function itemTotal(c: ChangeItem) { return c.quantity * (c.labourRate + c.materialRate); }

export function corTotals(cor: ChangeOrderRequest, items: ChangeItem[]) {
  const subtotal = items.reduce((s, c) => s + itemTotal(c), 0);
  const overhead = subtotal * cor.overheadPct / 100;
  const profit = (subtotal + overhead) * cor.profitPct / 100;
  return { subtotal, overhead, profit, total: subtotal + overhead + profit };
}

export const money = (n: number) => n.toLocaleString("en-CA", { style: "currency", currency: "CAD", maximumFractionDigits: 0 });
