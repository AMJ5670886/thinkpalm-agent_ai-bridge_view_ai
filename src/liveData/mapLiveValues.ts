import type { WidgetSpec } from '../agents/types';
import type { OpenMeteoPayload } from './openMeteo';
import type { LiveDataDomain, LiveWidgetValue, VesselPosition } from './types';

function matches(widget: WidgetSpec, keywords: string[]): boolean {
  const text = `${widget.title} ${widget.unit || ''}`.toLowerCase();
  return keywords.some((kw) => text.includes(kw));
}

function gaugeRange(widget: WidgetSpec, fallbackMax = 100): { min: number; max: number } {
  const unit = (widget.unit || '').toLowerCase();
  if (unit.includes('knot')) return { min: 0, max: 25 };
  if (unit === 'rpm') return { min: 0, max: 120 };
  if (unit.includes('l/h')) return { min: 0, max: 1200 };
  if (unit.includes('m³')) return { min: 0, max: 200 };
  if (unit.includes('°') || unit.includes('degree')) return { min: -15, max: 15 };
  if (unit === '%') return { min: 0, max: 100 };
  if (unit.includes('aqi') || unit.includes('pm')) return { min: 0, max: 150 };
  return { min: 0, max: fallbackMax };
}

function normalizeGauge(value: number, min: number, max: number): number {
  if (max <= min) return value;
  return Math.min(max, Math.max(min, value));
}

function formatCoords(lat: number, lon: number): string {
  const latDir = lat >= 0 ? 'N' : 'S';
  const lonDir = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(2)}°${latDir}, ${Math.abs(lon).toFixed(2)}°${lonDir}`;
}

export function mapWidgetsToLiveValues(
  widgets: WidgetSpec[],
  domain: LiveDataDomain,
  meteo: OpenMeteoPayload,
  vessel?: VesselPosition
): {
  widgetValues: Record<string, LiveWidgetValue>;
  chartSeries: Record<string, number[]>;
  alerts: Array<{ id: string; text: string; severity: 'warn' | 'crit' | 'info' }>;
} {
  const widgetValues: Record<string, LiveWidgetValue> = {};
  const chartSeries: Record<string, number[]> = {};
  const alerts: Array<{ id: string; text: string; severity: 'warn' | 'crit' | 'info' }> = [];

  for (const widget of widgets) {
    if (widget.type === 'chart') {
      if (matches(widget, ['fuel', 'efficiency', 'consumption'])) {
        chartSeries[widget.id] = meteo.hourly.wind_speed_10m || meteo.hourly.temperature_2m || [];
      } else if (matches(widget, ['soil', 'moisture', 'irrigation'])) {
        chartSeries[widget.id] = meteo.hourly.soil_moisture_0_to_1cm || meteo.hourly.precipitation || [];
      } else if (matches(widget, ['air', 'aqi', 'pollution', 'pm'])) {
        chartSeries[widget.id] = meteo.hourly.european_aqi || meteo.hourly.pm2_5 || [];
      } else if (matches(widget, ['wave', 'marine', 'sea'])) {
        chartSeries[widget.id] = meteo.hourly.wave_height || meteo.hourly.wind_speed_10m || [];
      } else if (matches(widget, ['energy', 'solar', 'power'])) {
        chartSeries[widget.id] = meteo.hourly.shortwave_radiation || meteo.hourly.wind_speed_10m || [];
      } else {
        chartSeries[widget.id] = meteo.hourly.temperature_2m || meteo.hourly.wind_speed_10m || [];
      }
      continue;
    }

    if (widget.type === 'map' && vessel) {
      widgetValues[widget.id] = {
        value: formatCoords(vessel.latitude, vessel.longitude),
        source: 'aisstream'
      };
      continue;
    }

    if (widget.type === 'metric' && matches(widget, ['gps', 'position', 'lat', 'lon']) && vessel) {
      widgetValues[widget.id] = {
        value: formatCoords(vessel.latitude, vessel.longitude),
        source: 'aisstream'
      };
      continue;
    }

    if (matches(widget, ['speed', 'sog', 'knot'])) {
      const range = gaugeRange(widget);
      const speed = vessel?.speedKnots ?? meteo.current.wind_speed_10m ?? 0;
      widgetValues[widget.id] = {
        value: normalizeGauge(speed, range.min, range.max),
        min: range.min,
        max: range.max,
        unit: widget.unit || 'knots',
        source: vessel?.speedKnots !== undefined ? 'aisstream' : 'open-meteo'
      };
      continue;
    }

    if (matches(widget, ['heading', 'bearing', 'course'])) {
      const range = { min: 0, max: 360 };
      const heading = vessel?.heading ?? meteo.current.wind_direction_10m ?? 0;
      widgetValues[widget.id] = {
        value: normalizeGauge(heading, range.min, range.max),
        min: range.min,
        max: range.max,
        unit: widget.unit || '°',
        source: vessel?.heading !== undefined ? 'aisstream' : 'open-meteo'
      };
      continue;
    }

    if (matches(widget, ['wave', 'sea state'])) {
      const range = { min: 0, max: 8 };
      widgetValues[widget.id] = {
        value: normalizeGauge(meteo.current.wave_height || 0, range.min, range.max),
        min: range.min,
        max: range.max,
        unit: widget.unit || 'm',
        source: 'open-meteo'
      };
      continue;
    }

    if (matches(widget, ['wind'])) {
      const range = { min: 0, max: 60 };
      widgetValues[widget.id] = {
        value: normalizeGauge(meteo.current.wind_speed_10m || 0, range.min, range.max),
        min: range.min,
        max: range.max,
        unit: widget.unit || 'km/h',
        source: 'open-meteo'
      };
      continue;
    }

    if (matches(widget, ['aqi', 'air quality', 'pollution'])) {
      const range = { min: 0, max: 150 };
      const value = meteo.current.european_aqi || meteo.current.pm2_5 || 0;
      widgetValues[widget.id] = {
        value: normalizeGauge(value, range.min, range.max),
        min: range.min,
        max: range.max,
        unit: widget.unit || 'AQI',
        source: 'open-meteo'
      };
      if (value > 100) {
        alerts.push({
          id: `${widget.id}-aqi`,
          text: `Elevated air quality index detected (${value.toFixed(0)})`,
          severity: value > 125 ? 'crit' : 'warn'
        });
      }
      continue;
    }

    if (matches(widget, ['pm2', 'pm 2', 'particulate'])) {
      const range = { min: 0, max: 100 };
      const value = meteo.current.pm2_5 || 0;
      widgetValues[widget.id] = {
        value: normalizeGauge(value, range.min, range.max),
        min: range.min,
        max: range.max,
        unit: widget.unit || 'µg/m³',
        source: 'open-meteo'
      };
      continue;
    }

    if (matches(widget, ['soil', 'moisture'])) {
      const range = { min: 0, max: 1 };
      const value = meteo.current.soil_moisture_0_to_1cm || 0;
      widgetValues[widget.id] = {
        value: normalizeGauge(value, range.min, range.max),
        min: range.min,
        max: range.max,
        unit: widget.unit || 'm³/m³',
        source: 'open-meteo'
      };
      continue;
    }

    if (matches(widget, ['temp', 'temperature', 'reefer', 'cargo'])) {
      const range = { min: -25, max: 40 };
      const value = meteo.current.temperature_2m || meteo.current.soil_temperature_0cm || 0;
      widgetValues[widget.id] = {
        value: normalizeGauge(value, range.min, range.max),
        min: range.min,
        max: range.max,
        unit: widget.unit || '°C',
        source: 'open-meteo'
      };
      if (widget.threshold !== undefined && value > widget.threshold) {
        alerts.push({
          id: `${widget.id}-temp`,
          text: `${widget.title} threshold exceeded (${value.toFixed(1)}${widget.unit || '°C'})`,
          severity: 'warn'
        });
      }
      continue;
    }

    if (matches(widget, ['humidity', 'water'])) {
      const range = { min: 0, max: 100 };
      const value = meteo.current.relative_humidity_2m || 0;
      widgetValues[widget.id] = {
        value: normalizeGauge(value, range.min, range.max),
        min: range.min,
        max: range.max,
        unit: widget.unit || '%',
        source: 'open-meteo'
      };
      continue;
    }

    if (matches(widget, ['fuel', 'flow', 'consumption', 'rpm', 'engine'])) {
      const range = gaugeRange(widget);
      const seed = (meteo.current.wind_speed_10m || 10) * (domain === 'maritime' ? 8 : 4);
      widgetValues[widget.id] = {
        value: normalizeGauge(seed, range.min, range.max),
        min: range.min,
        max: range.max,
        unit: widget.unit,
        source: 'open-meteo'
      };
      if (widget.threshold !== undefined && seed > widget.threshold) {
        alerts.push({
          id: `${widget.id}-threshold`,
          text: `${widget.title} threshold exceeded (${seed.toFixed(0)} ${widget.unit || ''})`.trim(),
          severity: 'crit'
        });
      }
      continue;
    }

    if (matches(widget, ['solar', 'radiation', 'energy', 'power'])) {
      const range = { min: 0, max: 1000 };
      const value = meteo.current.shortwave_radiation || meteo.current.wind_speed_10m || 0;
      widgetValues[widget.id] = {
        value: normalizeGauge(value, range.min, range.max),
        min: range.min,
        max: range.max,
        unit: widget.unit || 'W/m²',
        source: 'open-meteo'
      };
      continue;
    }

    if (matches(widget, ['precipitation', 'rain'])) {
      const range = { min: 0, max: 50 };
      const value = meteo.current.precipitation || 0;
      widgetValues[widget.id] = {
        value: normalizeGauge(value, range.min, range.max),
        min: range.min,
        max: range.max,
        unit: widget.unit || 'mm',
        source: 'open-meteo'
      };
      continue;
    }

    if (widget.type === 'gauge' || widget.type === 'metric') {
      const range = gaugeRange(widget);
      const fallback = typeof widget.value === 'number' ? widget.value : parseFloat(String(widget.value)) || 0;
      widgetValues[widget.id] = {
        value: normalizeGauge(fallback, range.min, range.max),
        min: range.min,
        max: range.max,
        unit: widget.unit,
        source: 'simulated'
      };
    }
  }

  if (vessel && domain === 'maritime') {
    alerts.unshift({
      id: 'ais-live',
      text: `Live AIS contact${vessel.name ? ` "${vessel.name}"` : ''} at ${formatCoords(vessel.latitude, vessel.longitude)}`,
      severity: 'info'
    });
  }

  return { widgetValues, chartSeries, alerts };
}
