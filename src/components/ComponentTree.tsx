import React, { useMemo, useState } from 'react';
import type { DashboardLayout } from '../agents/types';
import {
  buildComponentTree,
  formatComponentTreeOutline,
  type ComponentTreeNode,
} from '../agents/componentTree';
import {
  ChevronDown,
  ChevronRight,
  Copy,
  Check,
  GitBranch,
  Box,
  Layers,
  Gauge,
  LayoutGrid,
} from 'lucide-react';

interface ComponentTreeProps {
  layout?: DashboardLayout;
}

const KIND_STYLES: Record<ComponentTreeNode['kind'], { dot: string; text: string }> = {
  root: { dot: 'bg-indigo-400', text: 'text-indigo-300' },
  section: { dot: 'bg-cyan-400', text: 'text-cyan-300' },
  widget: { dot: 'bg-amber-400', text: 'text-amber-200' },
  prop: { dot: 'bg-slate-600', text: 'text-slate-500' },
};

function countNodes(node: ComponentTreeNode): number {
  return 1 + (node.children?.reduce((sum, c) => sum + countNodes(c), 0) ?? 0);
}

interface TreeRowProps {
  node: ComponentTreeNode;
  depth: number;
  defaultExpanded?: boolean;
}

const TreeRow: React.FC<TreeRowProps> = ({ node, depth, defaultExpanded = depth < 2 }) => {
  const hasChildren = Boolean(node.children?.length);
  const [expanded, setExpanded] = useState(defaultExpanded);
  const style = KIND_STYLES[node.kind];

  return (
    <div className="select-text">
      <div
        className={`flex items-start gap-1 py-0.5 rounded hover:bg-slate-900/60 group ${
          node.kind === 'prop' ? 'opacity-90' : ''
        }`}
        style={{ paddingLeft: `${depth * 14}px` }}
      >
        <button
          type="button"
          onClick={() => hasChildren && setExpanded((e) => !e)}
          className={`w-4 h-4 mt-0.5 shrink-0 flex items-center justify-center rounded ${
            hasChildren ? 'text-slate-500 hover:text-slate-300' : 'invisible'
          }`}
          aria-label={expanded ? 'Collapse' : 'Expand'}
        >
          {hasChildren &&
            (expanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />)}
        </button>

        <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${style.dot}`} />

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-1.5 gap-y-0">
            {node.kind === 'prop' ? (
              <span className="font-mono text-[10px] text-slate-500">
                <span className="text-slate-600">{node.name}</span>
                <span className="text-slate-700 mx-0.5">:</span>
                <span className="text-slate-400">{node.meta}</span>
              </span>
            ) : (
              <>
                <span className={`text-[11px] font-bold tracking-wide ${style.text}`}>{node.name}</span>
                {node.badge && (
                  <span className="text-[8px] font-extrabold uppercase tracking-wider px-1 py-px rounded bg-slate-950 border border-slate-800 text-slate-500">
                    {node.badge}
                  </span>
                )}
                {node.meta && (
                  <span className="text-[9px] text-slate-550 truncate max-w-[180px]" title={node.meta}>
                    {node.meta}
                  </span>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <TreeRow
              key={child.id}
              node={child}
              depth={depth + 1}
              defaultExpanded={child.kind === 'widget' || child.kind === 'section'}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const ComponentTree: React.FC<ComponentTreeProps> = ({ layout }) => {
  const [copied, setCopied] = useState(false);

  const tree = useMemo(() => (layout ? buildComponentTree(layout) : null), [layout]);
  const nodeCount = tree ? countNodes(tree) : 0;
  const widgetTypes = layout
    ? layout.widgets.reduce<Record<string, number>>((acc, w) => {
        acc[w.type] = (acc[w.type] ?? 0) + 1;
        return acc;
      }, {})
    : {};

  const handleCopy = async () => {
    if (!layout) return;
    await navigator.clipboard.writeText(formatComponentTreeOutline(layout));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!layout) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center py-16 px-4">
        <GitBranch className="w-10 h-10 text-slate-700 mb-3" />
        <h4 className="text-white text-xs font-bold uppercase tracking-wider">No Component Tree Yet</h4>
        <p className="text-[10px] text-slate-550 mt-1.5 max-w-xs leading-relaxed">
          Run the agent pipeline. The Architect agent will propose a widget hierarchy here before code
          generation.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex justify-between items-start gap-2 mb-3 shrink-0">
        <div>
          <p className="text-[9px] text-slate-500 font-medium leading-snug">
            Proposed React hierarchy from PRD analysis
          </p>
        </div>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 text-[9px] font-bold text-slate-400 hover:text-white bg-slate-950 border border-slate-850 hover:border-slate-700 px-2 py-1 rounded transition shrink-0"
        >
          {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
          {copied ? 'Copied' : 'Copy tree'}
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2 mb-3 shrink-0">
        <div className="bg-slate-950/80 border border-slate-900 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
          <Layers className="w-3 h-3 text-indigo-400" />
          <div>
            <span className="text-[8px] text-slate-600 font-bold uppercase block">Nodes</span>
            <span className="text-[10px] text-white font-black">{nodeCount}</span>
          </div>
        </div>
        <div className="bg-slate-950/80 border border-slate-900 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
          <Box className="w-3 h-3 text-amber-400" />
          <div>
            <span className="text-[8px] text-slate-600 font-bold uppercase block">Widgets</span>
            <span className="text-[10px] text-white font-black">{layout.widgets.length}</span>
          </div>
        </div>
        <div className="bg-slate-950/80 border border-slate-900 rounded-lg px-2 py-1.5 flex items-center gap-1.5">
          <LayoutGrid className="w-3 h-3 text-cyan-400" />
          <div>
            <span className="text-[8px] text-slate-600 font-bold uppercase block">Grid</span>
            <span className="text-[10px] text-white font-black">{layout.columns} col</span>
          </div>
        </div>
      </div>

      {Object.keys(widgetTypes).length > 0 && (
        <div className="flex flex-wrap gap-1 mb-3 shrink-0">
          {Object.entries(widgetTypes).map(([type, count]) => (
            <span
              key={type}
              className="text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded bg-slate-950 border border-slate-850 text-slate-500"
            >
              {type.replace('_', ' ')} ×{count}
            </span>
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-y-auto rounded-lg border border-slate-900 bg-slate-955/80 p-2 pr-1">
        {tree && <TreeRow node={tree} depth={0} defaultExpanded />}
      </div>

      <div className="mt-3 pt-2 border-t border-slate-900 shrink-0 flex items-center gap-1.5 text-[9px] text-slate-600">
        <Gauge className="w-3 h-3 text-indigo-500/70" />
        <span>
          Maps to <span className="text-slate-500 font-mono">ShipDashboard</span> in exported{' '}
          <span className="text-slate-500 font-mono">App.tsx</span>
        </span>
      </div>
    </div>
  );
};
