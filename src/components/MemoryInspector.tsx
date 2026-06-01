import React, { useState, useEffect } from 'react';
import type { LongTermMemoryItem, DashboardLayout } from '../agents/types';
import { Orchestrator } from '../agents/Orchestrator';

interface MemoryInspectorProps {
  layout?: DashboardLayout;
  onClearMemory: () => void;
  triggerRefresh: boolean;
}

export const MemoryInspector: React.FC<MemoryInspectorProps> = ({ layout, onClearMemory, triggerRefresh }) => {
  const [ltm, setLtm] = useState<LongTermMemoryItem[]>([]);

  useEffect(() => {
    setLtm(Orchestrator.getLongTermMemory());
  }, [layout, triggerRefresh]);

  const handleClear = () => {
    Orchestrator.clearMemory();
    setLtm([]);
    onClearMemory();
  };

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-900 rounded-xl p-4 md:p-6 shadow-2xl">
      <div className="flex justify-between items-center mb-4 border-b border-slate-900 pb-3">
        <div>
          <h3 className="text-white text-xs font-bold uppercase tracking-wider">Agent Memory Logs</h3>
          <p className="text-[9px] text-slate-500 font-medium">Tracking short-term session state and long-term registry logs</p>
        </div>
        {ltm.length > 0 && (
          <button
            onClick={handleClear}
            className="text-[9px] font-extrabold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 px-2 py-1 rounded transition duration-150"
          >
            Clear Log
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 overflow-y-auto max-h-[460px]">
        {/* Short-Term Memory */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-lg p-4">
          <h4 className="text-white text-xs font-black uppercase tracking-wider mb-2.5 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 mr-2"></span>
            Short-Term Session Memory
          </h4>
          {layout ? (
            <div className="space-y-2 text-[10px]">
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span className="text-slate-550">Dashboard Focus:</span>
                <span className="text-slate-300 font-bold">{layout.title}</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span className="text-slate-550">Grid Layout:</span>
                <span className="text-slate-300 font-bold">{layout.columns} Columns</span>
              </div>
              <div className="flex justify-between border-b border-slate-900 pb-1.5">
                <span className="text-slate-550">Widgets Discovered:</span>
                <span className="text-slate-300 font-bold">{layout.widgets.length} items</span>
              </div>
              <div className="flex flex-col pt-1">
                <span className="text-slate-550 mb-1">Design Token Cache:</span>
                <div className="bg-slate-955 p-2 rounded border border-slate-900 font-mono text-[9px] text-indigo-300 whitespace-pre overflow-x-auto leading-normal">
                  {JSON.stringify({
                    theme: 'dark-maritime',
                    primary_color: layout.widgets[0]?.color || 'blue',
                    icon_library: 'lucide-react',
                    layout_gap: 'gap-5',
                    responsive_breakpoints: 'grid-cols-1 md:grid-cols-3'
                  }, null, 2)}
                </div>
              </div>
            </div>
          ) : (
            <p className="text-[10px] text-slate-500 italic py-10 text-center">No active session memory cache. Run the pipeline first.</p>
          )}
        </div>

        {/* Long-Term Memory */}
        <div className="bg-slate-900/40 border border-slate-850 rounded-lg p-4">
          <h4 className="text-white text-xs font-black uppercase tracking-wider mb-2.5 flex items-center">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mr-2"></span>
            Long-Term Registry Memory
          </h4>
          {ltm.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-[10px] text-slate-550 italic">No persistent dashboard entries registered.</p>
              <p className="text-[9px] text-slate-600 mt-1">Generated dashboards will write metadata here via localStorage.</p>
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {ltm.map((item) => (
                <div key={item.id} className="bg-slate-950/60 border border-slate-900 rounded p-2.5 flex justify-between items-center text-[10px] hover:border-slate-800 transition">
                  <div className="flex flex-col">
                    <span className="text-slate-200 font-bold truncate max-w-[150px]">{item.prdTitle}</span>
                    <span className="text-slate-550 text-[8px] font-semibold mt-0.5">{item.timestamp}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[9px] bg-slate-900 text-slate-450 font-bold border border-slate-850 px-2 py-0.5 rounded">
                      {item.widgetsCount} Widgets
                    </span>
                    <span className={`w-2 h-2 rounded-full bg-${item.primaryColor}-500 shadow-sm`}></span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
