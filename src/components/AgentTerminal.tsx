import React, { useEffect, useRef } from 'react';
import type { AgentMessage } from '../agents/types';

interface AgentTerminalProps {
  logs: AgentMessage[];
  currentStep: string;
  status: string;
}

export const AgentTerminal: React.FC<AgentTerminalProps> = ({ logs, currentStep, status }) => {
  const terminalEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    terminalEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getAgentColor = (agent: string) => {
    switch (agent) {
      case 'Architect': return 'bg-cyan-500/10 text-cyan-400 border-cyan-500/25';
      case 'Coder': return 'bg-purple-500/10 text-purple-400 border-purple-500/25';
      case 'Inspector': return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/25';
      case 'System': return 'bg-slate-500/10 text-slate-400 border-slate-500/25';
      default: return 'bg-slate-500/10 text-slate-400 border-slate-500/25';
    }
  };

  const getLogStyle = (type: string) => {
    switch (type) {
      case 'tool_call': return 'text-amber-300 font-mono border-l-2 border-amber-500/50 pl-3 my-1 bg-amber-500/5 py-1 pr-2 rounded-r';
      case 'tool_response': return 'text-sky-300 font-mono border-l-2 border-sky-500/50 pl-3 my-1 bg-sky-500/5 py-1 pr-2 rounded-r';
      case 'error': return 'text-rose-400 font-medium border-l-2 border-rose-500 pl-3 bg-rose-500/5 py-1';
      case 'success': return 'text-emerald-400 font-bold border-l-2 border-emerald-500 pl-3 bg-emerald-500/5 py-1';
      default: return 'text-slate-300';
    }
  };

  return (
    <div className="bg-slate-900/40 border border-slate-880 rounded-xl p-5 flex flex-col h-full shadow-xl">
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-white text-base font-bold flex items-center">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 mr-2.5 inline-block animate-pulse"></span>
          2. Agent Pipeline Monitor
        </h2>
        {status !== 'idle' && (
          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded border ${
            status === 'completed' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
            status === 'failed' ? 'bg-rose-500/15 border-rose-500/30 text-rose-400' :
            'bg-indigo-500/15 border-indigo-500/30 text-indigo-400 animate-pulse'
          }`}>
            {status}
          </span>
        )}
      </div>

      {/* Active Stage Indicator */}
      <div className="bg-slate-950/80 border border-slate-850 p-3 rounded-lg mb-4 flex items-center justify-between text-xs">
        <span className="text-slate-400 font-medium">Pipeline Stage:</span>
        <span className="text-white font-bold text-right truncate pl-4">{currentStep}</span>
      </div>

      {/* Terminal Output Console */}
      <div className="flex-1 bg-slate-950 border border-slate-850 rounded-lg p-4 font-mono text-xs overflow-y-auto min-h-64 max-h-[500px] flex flex-col space-y-3.5 relative shadow-inner">
        {logs.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-slate-650 h-full py-20 text-center">
            <span className="text-3xl mb-2">⚓</span>
            <p>Wait for user triggers...</p>
            <p className="text-[10px] mt-1">Press "Run Agent Pipeline" to initiate agent collaboration.</p>
          </div>
        ) : (
          logs.map((log) => (
            <div key={log.id} className="flex flex-col space-y-1.5 border-b border-slate-900/60 pb-2.5 last:border-0 last:pb-0">
              <div className="flex justify-between items-center text-[10px]">
                <div className="flex items-center space-x-2">
                  <span className={`px-1.5 py-0.5 text-[9px] rounded font-bold border ${getAgentColor(log.agent)}`}>
                    {log.agent}
                  </span>
                  <span className="text-slate-600 font-semibold uppercase">{log.type.replace('_', ' ')}</span>
                </div>
                <span className="text-slate-600 font-medium">{log.timestamp}</span>
              </div>
              <div className={`text-xs leading-relaxed whitespace-pre-wrap ${getLogStyle(log.type)}`}>
                {log.content}
              </div>
            </div>
          ))
        )}
        <div ref={terminalEndRef} />
      </div>
    </div>
  );
};
