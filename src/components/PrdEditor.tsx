import React, { useMemo, useState } from 'react';
import { validatePRD, type PrdCheckStatus } from '../agents/PrdParser';
import type { LiveDataConfig } from '../liveData/apiConfig';
import { ApiSettingsPanel, detectDomainFromValidation } from './ApiSettingsPanel';

const PRD_PLACEHOLDER = `ThinkPalm - Product Requirements Document
System: Your Dashboard Name Here

1. Purpose
Describe what this dashboard should monitor or control.

2. UI Widgets Required:
- Widget Name gauge (unit, range 0-100, color, threshold alert at 80)
- Another Widget metric panel (unit, color)
- Mode Selector control panel (Options: Option A, Option B, Option C)
- Safety Alarms log list
- Performance chart (tracking metric over time)`;

interface PrdEditorProps {
  prdText: string;
  setPrdText: (text: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  aisApiKey: string;
  setAisApiKey: (key: string) => void;
  liveConfig: LiveDataConfig;
  setLiveConfig: (config: LiveDataConfig) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export const PrdEditor: React.FC<PrdEditorProps> = ({
  prdText,
  setPrdText,
  apiKey,
  setApiKey,
  aisApiKey,
  setAisApiKey,
  liveConfig,
  setLiveConfig,
  onGenerate,
  isLoading
}) => {
  const [showSettings, setShowSettings] = useState(false);
  const validation = useMemo(() => validatePRD(prdText), [prdText]);
  const liveDomain = useMemo(() => {
    if (!validation.isValid) return null;
    return detectDomainFromValidation(validation.dashboardTitle, validation.widgets);
  }, [validation]);

  const statusIcon: Record<PrdCheckStatus, string> = {
    pass: '✓',
    warn: '!',
    fail: '✕'
  };

  const statusStyles: Record<PrdCheckStatus, string> = {
    pass: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
    warn: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    fail: 'text-rose-400 bg-rose-500/10 border-rose-500/20'
  };

  const widgetTypeStyles: Record<string, string> = {
    gauge: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
    chart: 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
    metric: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
    alert_list: 'text-rose-400 bg-rose-500/10 border-rose-500/20',
    control_panel: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
    map: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
  };

  return (
    <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 flex flex-col h-full shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-white text-base font-bold flex items-center">
          <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2.5 inline-block"></span>
          1. Maritime Requirements
        </h2>
        <button
          onClick={() => setShowSettings(!showSettings)}
          className={`text-xs px-2.5 py-1.5 rounded-lg border font-semibold transition ${
            showSettings 
              ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300' 
              : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
          }`}
        >
          ⚙️ API Settings
        </button>
      </div>

      {showSettings && (
        <ApiSettingsPanel
          groqKey={apiKey}
          setGroqKey={setApiKey}
          aisKey={aisApiKey}
          setAisKey={setAisApiKey}
          liveConfig={liveConfig}
          setLiveConfig={setLiveConfig}
          detectedDomain={liveDomain}
        />
      )}

      {/* PRD Text Editor */}
      <div className="flex-1 flex flex-col min-h-64">
        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
          Requirements Document Spec (PRD)
        </label>
        <textarea
          value={prdText}
          onChange={(e) => setPrdText(e.target.value)}
          className="flex-1 w-full bg-slate-950/80 border border-slate-850 rounded-lg p-3 text-xs text-slate-300 placeholder-slate-750 focus:outline-none focus:border-indigo-500 font-mono resize-none leading-relaxed transition"
          placeholder={PRD_PLACEHOLDER}
        />
      </div>

      {/* PRD Validator & Widget Indicator */}
      <div className="mt-3 bg-slate-950/80 border border-slate-850 rounded-lg p-3 space-y-2.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`text-[9px] font-black uppercase tracking-wider px-2 py-1 rounded border shrink-0 ${
                validation.isValid
                  ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
                  : prdText.trim()
                    ? 'text-amber-400 bg-amber-500/10 border-amber-500/25'
                    : 'text-slate-500 bg-slate-900 border-slate-800'
              }`}
            >
              {validation.isValid ? 'PRD Ready' : prdText.trim() ? 'Needs Fixes' : 'Awaiting PRD'}
            </span>
            {prdText.trim() && (
              <span className="text-[10px] text-slate-400 truncate">
                {validation.dashboardTitle}
              </span>
            )}
          </div>
          <span
            className={`text-[10px] font-bold px-2 py-1 rounded border shrink-0 ${
              validation.widgetCount > 0
                ? 'text-indigo-300 bg-indigo-500/15 border-indigo-500/30'
                : 'text-slate-500 bg-slate-900 border-slate-800'
            }`}
          >
            {validation.widgetCount} widget{validation.widgetCount === 1 ? '' : 's'} detected
          </span>
        </div>

        {prdText.trim() && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1">
            {validation.checks.map((check) => (
              <div
                key={check.id}
                className={`flex items-start gap-1.5 text-[10px] px-2 py-1 rounded border ${statusStyles[check.status]}`}
                title={check.hint}
              >
                <span className="font-black shrink-0">{statusIcon[check.status]}</span>
                <span className="font-semibold leading-tight">{check.label}</span>
              </div>
            ))}
          </div>
        )}

        {validation.widgets.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-0.5">
            {validation.widgets.map((widget, index) => (
              <span
                key={`${widget.type}-${widget.title}-${index}`}
                className={`text-[9px] font-semibold px-2 py-0.5 rounded border ${widgetTypeStyles[widget.type] || widgetTypeStyles.metric}`}
              >
                {widget.type.replace('_', ' ')} · {widget.title}
              </span>
            ))}
          </div>
        )}

        {validation.isValid && liveDomain && (
          <p className="text-[10px] text-cyan-400/90 leading-normal">
            {liveConfig.enabled ? 'Live mode ON' : 'Live mode OFF (simulation)'} · domain:{' '}
            <span className="font-semibold">{liveDomain}</span> · refresh:{' '}
            <span className="font-semibold">{liveConfig.pollIntervalSec}s</span>
            {liveDomain === 'maritime' && !aisApiKey.trim() && (
              <> · <span className="text-amber-400/90">add AIS key for vessel tracking</span></>
            )}
          </p>
        )}

        {prdText.trim() && !validation.isValid && (
          <p className="text-[10px] text-slate-500 leading-normal">
            Add bullet points under <span className="text-slate-400 font-semibold">UI Widgets Required</span> with
            type keywords like <span className="text-slate-400">gauge</span>,{' '}
            <span className="text-slate-400">chart</span>, or <span className="text-slate-400">control panel</span>.
          </p>
        )}
      </div>

      <button
        onClick={onGenerate}
        disabled={isLoading || !validation.isValid}
        className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs py-3 rounded-lg shadow-lg shadow-indigo-600/10 disabled:opacity-40 disabled:pointer-events-none hover:shadow-indigo-500/20 active:scale-[0.98] transition duration-200"
      >
        {isLoading ? '🤖 running Groq agents...' : '⚓ Run Agent Pipeline'}
      </button>
    </div>
  );
};
