import type { WidgetSpec } from './types';
import { searchIcons } from './tools';

const COLOR_KEYWORDS: WidgetSpec['color'][] = ['emerald', 'amber', 'rose', 'indigo', 'cyan', 'blue'];

function detectWidgetType(line: string): WidgetSpec['type'] {
  const lower = line.toLowerCase();
  if (lower.includes('control panel') || lower.includes('selector') || /options\s*:/i.test(line)) {
    return 'control_panel';
  }
  if (lower.includes('alert') || lower.includes('alarm') || lower.includes('log list') || lower.includes('incident')) {
    return 'alert_list';
  }
  if (lower.includes('chart') || lower.includes('tracking') || lower.includes('trend')) {
    return 'chart';
  }
  if (lower.includes('gauge')) {
    return 'gauge';
  }
  if (lower.includes('map') || lower.includes('gps') || lower.includes('position') || lower.includes('ais')) {
    return 'map';
  }
  if (lower.includes('summary card') || lower.includes('metric') || lower.includes('telemetry')) {
    return 'metric';
  }
  return 'metric';
}

function parseColor(text: string): WidgetSpec['color'] {
  const lower = text.toLowerCase();
  for (const color of COLOR_KEYWORDS) {
    if (lower.includes(color)) return color;
  }
  return 'blue';
}

function extractTitle(line: string): string {
  let text = line.replace(/^[\s\-•*]+/, '').trim();
  const parenIdx = text.indexOf('(');
  if (parenIdx > 0) {
    text = text.slice(0, parenIdx).trim();
  }

  const typeKeywords = [
    'control panel',
    'metric panel',
    'summary card',
    'alert list',
    'log list',
    'gauge',
    'chart',
    'map'
  ];

  for (const kw of typeKeywords) {
    const idx = text.toLowerCase().lastIndexOf(kw);
    if (idx > 0) {
      return text.slice(0, idx).trim();
    }
  }

  return text;
}

function extractUnit(text: string): string | undefined {
  const parenMatch = text.match(/\(([^)]+)\)/);
  if (!parenMatch) return undefined;

  const inner = parenMatch[1];
  const firstPart = inner.split(',')[0].trim();
  if (/^(RPM|L\/h|m³|°|knots|kPa|kW|g\/kWh|%|pax|m|lat\/lon|alerts)$/i.test(firstPart)) {
    return firstPart;
  }

  const unitMatch = inner.match(/\b(in\s+)?(RPM|L\/h|m³|knots|kPa|kW|g\/kWh|%|pax|degrees?)\b/i);
  return unitMatch?.[2];
}

function extractRange(text: string): { min: number; max: number } | undefined {
  const match = text.match(/range\s+(-?\d+(?:\.\d+)?)\s*(?:to|-)\s*(-?\d+(?:\.\d+)?)/i);
  if (match) {
    return { min: parseFloat(match[1]), max: parseFloat(match[2]) };
  }
  return undefined;
}

function extractThreshold(text: string): number | undefined {
  const match = text.match(/(?:threshold|alert|warning).*?(?:at|above|below)\s+(-?\d+(?:\.\d+)?)/i);
  return match ? parseFloat(match[1]) : undefined;
}

function extractOptions(text: string): string[] | undefined {
  const match = text.match(/options?\s*:\s*(.+?)(?:\)|$)/i);
  if (!match) return undefined;
  return match[1].split(',').map((o) => o.trim()).filter(Boolean);
}

function defaultGaugeValue(min: number, max: number, threshold?: number): number {
  if (threshold !== undefined) {
    return Math.round((min + threshold) / 2);
  }
  return Math.round((min + max) / 2);
}

function defaultMetricValue(unit?: string): string | number {
  if (!unit) return '—';
  const u = unit.toLowerCase();
  if (u === 'knots') return 14.2;
  if (u === '°' || u.includes('degree')) return 184;
  if (u === 'pax') return 18;
  if (u === 'm') return 0.8;
  if (u === '%') return 72;
  if (u.includes('lat')) return "24°48'N, 56°22'E";
  return '—';
}

function widgetSize(type: WidgetSpec['type']): WidgetSpec['size'] {
  switch (type) {
    case 'map':
    case 'chart':
      return 'large';
    case 'gauge':
    case 'alert_list':
      return 'medium';
    default:
      return 'small';
  }
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
}

function extractTitleFromPRD(prdText: string): string {
  const systemMatch = prdText.match(/System:\s*(.+?)(?:\(|$)/im);
  if (systemMatch) return systemMatch[1].trim();

  const headingMatch = prdText.match(/^#\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();

  const firstLine = prdText.split('\n').map((l) => l.trim()).find(Boolean);
  return firstLine || 'Custom Maritime Dashboard';
}

function extractDescription(prdText: string): string {
  const purposeMatch = prdText.match(
    /(?:purpose|objective|overview)\s*\n([\s\S]*?)(?=\n\s*\d+\.|\n\s*(?:UI|widgets|components)|$)/i
  );
  if (purposeMatch) {
    const line = purposeMatch[1]
      .split('\n')
      .map((l) => l.replace(/^[\s\-•*]+/, '').trim())
      .find(Boolean);
    if (line) return line;
  }
  return 'Dashboard generated from user-entered PRD requirements.';
}

function extractWidgetLines(prdText: string): string[] {
  const sectionMatch = prdText.match(
    /(?:UI\s*Widgets?\s*Required|widgets?\s*required|components?\s*required|dashboard\s*components?)[:\s]*\n([\s\S]*?)(?=\n\s*\d+\.\s|$)/i
  );

  const section = sectionMatch ? sectionMatch[1] : prdText;
  const lines = section
    .split('\n')
    .map((l) => l.trim())
    .filter((l) => /^[\-•*]/.test(l) || /^\d+[\.\)]/.test(l));

  return lines.length > 0 ? lines : [];
}

function parseWidgetLine(line: string, index: number): WidgetSpec {
  const type = detectWidgetType(line);
  const title = extractTitle(line);
  const unit = extractUnit(line);
  const range = extractRange(line);
  const threshold = extractThreshold(line);
  const options = extractOptions(line);
  const color = parseColor(line);
  const icons = searchIcons(title);
  const icon = icons[0]?.iconName || 'Gauge';

  let value: string | number | undefined;
  if (type === 'gauge' && range) {
    value = defaultGaugeValue(range.min, range.max, threshold);
  } else if (type === 'metric') {
    value = defaultMetricValue(unit);
  } else if (type === 'control_panel') {
    value = options?.[0] || 'Default';
  } else if (type === 'alert_list') {
    value = 'System Normal';
  }

  return {
    id: `widget_${slugify(title) || index}`,
    type,
    title,
    icon,
    color,
    size: widgetSize(type),
    unit,
    value,
    threshold,
    options
  };
}

export function parsePRD(prdText: string): { title: string; description: string; widgets: WidgetSpec[] } {
  const title = extractTitleFromPRD(prdText);
  const description = extractDescription(prdText);
  const lines = extractWidgetLines(prdText);
  const widgets = lines.map((line, index) => parseWidgetLine(line, index));

  return { title, description, widgets };
}

export type PrdCheckStatus = 'pass' | 'warn' | 'fail';

export interface PrdValidationCheck {
  id: string;
  label: string;
  status: PrdCheckStatus;
  hint?: string;
}

export interface PrdValidationResult {
  isValid: boolean;
  widgetCount: number;
  dashboardTitle: string;
  widgets: Pick<WidgetSpec, 'title' | 'type'>[];
  checks: PrdValidationCheck[];
}

const WIDGET_TYPE_KEYWORDS =
  /gauge|chart|metric|control panel|selector|alert|alarm|log list|map|gps|position|summary card|telemetry/i;

function hasSystemTitle(prdText: string): boolean {
  return /System:\s*.+/im.test(prdText);
}

function hasPurposeSection(prdText: string): boolean {
  return /(?:purpose|objective|overview)\s*\n/i.test(prdText);
}

function hasWidgetsSection(prdText: string): boolean {
  return /(?:UI\s*Widgets?\s*Required|widgets?\s*required|components?\s*required)/i.test(prdText);
}

export function validatePRD(prdText: string): PrdValidationResult {
  const trimmed = prdText.trim();
  const parsed = trimmed ? parsePRD(prdText) : { title: '', description: '', widgets: [] as WidgetSpec[] };
  const widgetLines = trimmed ? extractWidgetLines(prdText) : [];
  const checks: PrdValidationCheck[] = [];

  if (!trimmed) {
    checks.push({
      id: 'content',
      label: 'PRD content',
      status: 'fail',
      hint: 'Enter your product requirements in the editor.'
    });
  } else {
    checks.push({ id: 'content', label: 'PRD content', status: 'pass' });
  }

  if (hasSystemTitle(prdText)) {
    checks.push({ id: 'system', label: 'System title', status: 'pass' });
  } else {
    checks.push({
      id: 'system',
      label: 'System title',
      status: 'warn',
      hint: 'Add a line like "System: Vessel Fuel Dashboard".'
    });
  }

  if (hasPurposeSection(prdText)) {
    checks.push({ id: 'purpose', label: 'Purpose section', status: 'pass' });
  } else {
    checks.push({
      id: 'purpose',
      label: 'Purpose section',
      status: 'warn',
      hint: 'Add a "1. Purpose" section describing the dashboard goal.'
    });
  }

  if (hasWidgetsSection(prdText)) {
    checks.push({ id: 'widgets_section', label: 'Widgets section', status: 'pass' });
  } else {
    checks.push({
      id: 'widgets_section',
      label: 'Widgets section',
      status: 'warn',
      hint: 'Add a "UI Widgets Required:" heading before widget bullets.'
    });
  }

  if (parsed.widgets.length > 0) {
    checks.push({
      id: 'widget_count',
      label: 'Widget bullets',
      status: 'pass',
      hint: `${parsed.widgets.length} widget${parsed.widgets.length === 1 ? '' : 's'} detected.`
    });
  } else if (widgetLines.length > 0) {
    checks.push({
      id: 'widget_count',
      label: 'Widget bullets',
      status: 'fail',
      hint: 'Bullets found but none could be parsed. Include type keywords (gauge, chart, control panel, etc.).'
    });
  } else {
    checks.push({
      id: 'widget_count',
      label: 'Widget bullets',
      status: 'fail',
      hint: 'Add bullet points such as "- Speed gauge (knots, range 0-30, cyan)".'
    });
  }

  const untypedLines = widgetLines.filter((line) => !WIDGET_TYPE_KEYWORDS.test(line));
  if (parsed.widgets.length > 0 && untypedLines.length > 0) {
    checks.push({
      id: 'widget_types',
      label: 'Widget type keywords',
      status: 'warn',
      hint: `${untypedLines.length} bullet${untypedLines.length === 1 ? '' : 's'} missing a type keyword (gauge, chart, metric, etc.).`
    });
  } else if (parsed.widgets.length > 0) {
    checks.push({ id: 'widget_types', label: 'Widget type keywords', status: 'pass' });
  }

  const isValid = parsed.widgets.length > 0;

  return {
    isValid,
    widgetCount: parsed.widgets.length,
    dashboardTitle: parsed.title,
    widgets: parsed.widgets.map((w) => ({ title: w.title, type: w.type })),
    checks
  };
}
