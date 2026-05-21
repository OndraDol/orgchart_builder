import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import type { OrgChartDocument } from '../domain/orgchart';
import {
  clearLocalChart,
  loadLocalChart,
  loadLocalLayoutMode,
  saveLocalChart,
  saveLocalLayoutMode,
} from './storage';

const validChart = (): OrgChartDocument => ({
  schemaVersion: 5,
  name: 'Stored chart',
  updatedAt: '2026-05-21T00:00:00.000Z',
  nodes: [
    {
      id: 'root',
      parentId: null,
      title: 'Root',
      person: '',
      levelType: 'B-0',
      country: '',
      regio: '',
      color: 'executive',
      status: 'active',
      order: 10,
    },
  ],
});

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('loads a saved local chart', () => {
    const chart = validChart();

    saveLocalChart(chart);

    expect(loadLocalChart()).toEqual(chart);
  });

  it('returns null when local chart state is missing', () => {
    expect(loadLocalChart()).toBeNull();
  });

  it('returns null when stored JSON is invalid', () => {
    localStorage.setItem('orgchart-builder.chart.v1', '{');

    expect(loadLocalChart()).toBeNull();
  });

  it('returns null when local storage cannot be read', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('SecurityError');
    });

    expect(loadLocalChart()).toBeNull();
  });

  it('clears a saved local chart', () => {
    saveLocalChart(validChart());
    clearLocalChart();

    expect(loadLocalChart()).toBeNull();
  });

  it('saves and loads a remembered layout mode', () => {
    saveLocalLayoutMode('source');

    expect(loadLocalLayoutMode()).toBe('source');
  });

  it('falls back to Auto strom when remembered layout mode is missing or invalid', () => {
    expect(loadLocalLayoutMode()).toBe('tree');

    localStorage.setItem('orgchart-builder.layout-mode.v1', 'invalid');

    expect(loadLocalLayoutMode()).toBe('tree');
  });
});
