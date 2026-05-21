import type { OrgChartDocument } from './orgchart';

const MAX_PAST_ITEMS = 50;

export interface ChartHistory {
  past: OrgChartDocument[];
  current: OrgChartDocument;
  future: OrgChartDocument[];
}

export const createHistory = (current: OrgChartDocument): ChartHistory => ({
  past: [],
  current,
  future: [],
});

export const pushHistory = (history: ChartHistory, current: OrgChartDocument): ChartHistory => ({
  past: [...history.past, history.current].slice(-MAX_PAST_ITEMS),
  current,
  future: [],
});

export const undoHistory = (history: ChartHistory): ChartHistory => {
  const previous = history.past.at(-1);

  if (!previous) {
    return history;
  }

  return {
    past: history.past.slice(0, -1),
    current: previous,
    future: [history.current, ...history.future],
  };
};
