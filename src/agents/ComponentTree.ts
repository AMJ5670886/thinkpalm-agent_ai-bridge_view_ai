import type { DashboardLayout, WidgetSpec } from './types';

export interface ComponentTreeNode {
  id: string;
  name: string;
  kind: 'root' | 'section' | 'widget' | 'prop';
  badge?: string;
  meta?: string;
  children?: ComponentTreeNode[];
}

const WIDGET_COMPONENT_NAMES: Record<WidgetSpec['type'], string> = {
  gauge: 'TelemetryGauge',
  metric: 'KpiMetricTile',
  chart: 'EfficiencyChartPanel',
  alert_list: 'SafetyAlertPanel',
  control_panel: 'PropulsionControlPanel',
  map: 'VoyageMapTracker',
};

const SIZE_GRID_HINT: Record<WidgetSpec['size'], string> = {
  small: 'col-span-1',
  medium: 'col-span-1 md:col-span-2',
  large: 'col-span-1 md:col-span-2',
  full: 'col-span-full',
};

function widgetPropsNodes(widget: WidgetSpec): ComponentTreeNode[] {
  const nodes: ComponentTreeNode[] = [
    {
      id: `${widget.id}-type`,
      name: 'type',
      kind: 'prop',
      meta: widget.type,
    },
    {
      id: `${widget.id}-icon`,
      name: 'icon',
      kind: 'prop',
      meta: widget.icon,
    },
    {
      id: `${widget.id}-color`,
      name: 'color',
      kind: 'prop',
      meta: widget.color,
    },
    {
      id: `${widget.id}-size`,
      name: 'gridSpan',
      kind: 'prop',
      meta: SIZE_GRID_HINT[widget.size],
    },
  ];

  if (widget.unit) {
    nodes.push({
      id: `${widget.id}-unit`,
      name: 'unit',
      kind: 'prop',
      meta: widget.unit,
    });
  }

  if (widget.value !== undefined) {
    nodes.push({
      id: `${widget.id}-value`,
      name: 'defaultValue',
      kind: 'prop',
      meta: String(widget.value),
    });
  }

  if (widget.threshold !== undefined) {
    nodes.push({
      id: `${widget.id}-threshold`,
      name: 'threshold',
      kind: 'prop',
      meta: String(widget.threshold),
    });
  }

  if (widget.options?.length) {
    nodes.push({
      id: `${widget.id}-options`,
      name: 'options',
      kind: 'prop',
      meta: widget.options.join(' | '),
    });
  }

  return nodes;
}

function widgetTreeNode(widget: WidgetSpec, index: number): ComponentTreeNode {
  const componentName = WIDGET_COMPONENT_NAMES[widget.type];
  return {
    id: widget.id,
    name: componentName,
    kind: 'widget',
    badge: widget.type,
    meta: widget.title,
    children: [
      {
        id: `${widget.id}-label`,
        name: 'title',
        kind: 'prop',
        meta: widget.title,
      },
      ...widgetPropsNodes(widget),
      {
        id: `${widget.id}-state`,
        name: 'useState',
        kind: 'prop',
        meta: `val_${widget.id}`,
      },
      {
        id: `${widget.id}-order`,
        name: 'renderOrder',
        kind: 'prop',
        meta: String(index + 1),
      },
    ],
  };
}

/**
 * Builds a React component hierarchy from the Architect agent's dashboard layout.
 */
export function buildComponentTree(layout: DashboardLayout): ComponentTreeNode {
  const rootName = 'ShipDashboard';

  return {
    id: 'root',
    name: rootName,
    kind: 'root',
    badge: 'default export',
    meta: layout.title,
    children: [
      {
        id: 'header',
        name: 'DashboardHeader',
        kind: 'section',
        meta: 'Navigation + telemetry status',
        children: [
          {
            id: 'header-brand',
            name: 'BrandBlock',
            kind: 'section',
            children: [
              { id: 'header-anchor', name: 'Anchor', kind: 'prop', meta: 'lucide-react' },
              { id: 'header-title', name: 'title', kind: 'prop', meta: layout.title },
              { id: 'header-desc', name: 'description', kind: 'prop', meta: layout.description },
            ],
          },
          {
            id: 'header-status',
            name: 'TelemetryStatusBar',
            kind: 'section',
            children: [
              { id: 'header-link', name: 'connectionBadge', kind: 'prop', meta: 'CONNECTED' },
              { id: 'header-time', name: 'timestamp', kind: 'prop', meta: 'useState + useEffect' },
            ],
          },
        ],
      },
      {
        id: 'main',
        name: 'DashboardMain',
        kind: 'section',
        badge: `${layout.widgets.length} widgets`,
        meta: `grid-cols-1 md:grid-cols-${layout.columns}`,
        children: layout.widgets.map((w, i) => widgetTreeNode(w, i)),
      },
      {
        id: 'footer',
        name: 'DashboardFooter',
        kind: 'section',
        meta: 'System status strip',
        children: [
          { id: 'footer-brand', name: 'footerLabel', kind: 'prop', meta: 'BridgeView AI // ThinkPalm' },
          { id: 'footer-status', name: 'watchdog', kind: 'prop', meta: 'AUTO WATCHDOG v4.2' },
        ],
      },
    ],
  };
}

/** Flat text outline for copy/export (demo scripts, README samples). */
export function formatComponentTreeOutline(layout: DashboardLayout): string {
  const lines: string[] = [];
  const indent = (depth: number) => '  '.repeat(depth);

  const walk = (node: ComponentTreeNode, depth: number) => {
    const badge = node.badge ? ` [${node.badge}]` : '';
    const meta = node.meta ? ` — ${node.meta}` : '';
    lines.push(`${indent(depth)}${node.kind === 'prop' ? `${node.name}=${node.meta}` : `${node.name}${badge}${meta}`}`);
    node.children?.forEach((child) => walk(child, depth + 1));
  };

  walk(buildComponentTree(layout), 0);
  return lines.join('\n');
}
