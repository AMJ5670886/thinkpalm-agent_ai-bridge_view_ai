import type { DashboardLayout, WidgetSpec } from '../agents/types';

export type LiveDataDomain =
  | 'maritime'
  | 'environmental'
  | 'agriculture'
  | 'energy'
  | 'general';

export interface GeoLocation {
  latitude: number;
  longitude: number;
  label: string;
}

export interface LiveWidgetValue {
  value: number | string;
  min?: number;
  max?: number;
  unit?: string;
  source: 'open-meteo' | 'aisstream' | 'simulated';
}

export interface VesselPosition {
  mmsi?: string;
  name?: string;
  latitude: number;
  longitude: number;
  speedKnots?: number;
  heading?: number;
  timestamp?: string;
}

export interface LiveDataSnapshot {
  domain: LiveDataDomain;
  sources: string[];
  lastUpdated: string;
  widgetValues: Record<string, LiveWidgetValue>;
  chartSeries: Record<string, number[]>;
  vessel?: VesselPosition;
  alerts: Array<{ id: string; text: string; severity: 'warn' | 'crit' | 'info' }>;
}

export interface LiveDataContext {
  layout: DashboardLayout;
  domain: LiveDataDomain;
  location: GeoLocation;
}

export type WidgetMatcher = (widget: WidgetSpec) => boolean;
