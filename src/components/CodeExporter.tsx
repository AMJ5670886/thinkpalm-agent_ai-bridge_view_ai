import React, { useState } from 'react';
import { exportToStackBlitz } from './StackBlitzExport';

interface CodeExporterProps {
  code?: string;
  title: string;
  description: string;
}

export const CodeExporter: React.FC<CodeExporterProps> = ({ code, title, description }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (code) {
      try {
        await navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Failed to copy code: ', err);
      }
    }
  };

  const handleStackBlitz = () => {
    if (code) {
      exportToStackBlitz(title, description, code);
    }
  };

  if (!code) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 h-full py-32 text-center min-h-[300px]">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-880 flex items-center justify-center text-slate-400 mb-4">
          💾
        </div>
        <h3 className="text-white text-sm font-bold">No Generated Code</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1 leading-normal">
          Once the Coder and Inspector agents compile the component tree, the raw production React code will be reviewable and exportable here.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-slate-950 border border-slate-900 rounded-xl p-4 md:p-6 shadow-2xl relative">
      <div className="flex justify-between items-center mb-4 border-b border-slate-900 pb-3">
        <div>
          <h3 className="text-white text-xs font-bold uppercase tracking-wider">Export Production React Code</h3>
          <p className="text-[9px] text-slate-500 font-medium">Deploy to StackBlitz browser sandbox or copy file</p>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleCopy}
            className={`text-[10px] font-extrabold px-3 py-1.5 rounded transition duration-150 ${
              copied
                ? 'bg-emerald-500/10 border border-emerald-500/35 text-emerald-400'
                : 'bg-slate-800 hover:bg-slate-750 border border-slate-700 hover:border-slate-600 text-slate-300'
            }`}
          >
            {copied ? '✓ Copied' : '📋 Copy'}
          </button>
          
          <button
            onClick={handleStackBlitz}
            className="text-[10px] font-extrabold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white px-3.5 py-1.5 rounded transition duration-150 shadow shadow-indigo-600/15 flex items-center"
          >
            ⚡ Open in StackBlitz
          </button>
        </div>
      </div>

      {/* Code Viewer Panel */}
      <div className="flex-1 bg-slate-955 border border-slate-850 rounded-lg p-4 font-mono text-[10px] overflow-auto max-h-[460px] text-slate-300 leading-normal select-text">
        <pre className="whitespace-pre">{code}</pre>
      </div>
    </div>
  );
};
