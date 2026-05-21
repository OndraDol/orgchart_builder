import type { ChartLayoutMode, OrgChartDocument } from '../domain/orgchart';
import { parseChartDocument } from '../domain/chartValidation';

const STORAGE_KEY = 'orgchart-builder.chart.v1';
const LAYOUT_MODE_STORAGE_KEY = 'orgchart-builder.layout-mode.v1';

export const chartToJson = (chart: OrgChartDocument): string => JSON.stringify(chart, null, 2);

export const loadLocalChart = (): OrgChartDocument | null => {
  let stored: string | null;

  try {
    stored = localStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }

  if (stored === null) {
    return null;
  }

  try {
    return parseChartDocument(stored);
  } catch {
    return null;
  }
};

export const saveLocalChart = (chart: OrgChartDocument): void => {
  localStorage.setItem(STORAGE_KEY, chartToJson(chart));
};

export const clearLocalChart = (): void => {
  localStorage.removeItem(STORAGE_KEY);
};

export const loadLocalLayoutMode = (): ChartLayoutMode => {
  try {
    const value = localStorage.getItem(LAYOUT_MODE_STORAGE_KEY);
    return value === 'source' || value === 'tree' ? value : 'tree';
  } catch {
    return 'tree';
  }
};

export const saveLocalLayoutMode = (layoutMode: ChartLayoutMode): void => {
  localStorage.setItem(LAYOUT_MODE_STORAGE_KEY, layoutMode);
};
