import React, { useState } from 'react';

export const TEMPLATES = {
  fuel_optimizer: {
    title: 'Vessel Fuel & Speed Optimizer',
    text: `ThinkPalm - Product Requirements Document
System: Vessel Fuel & Speed Optimization Dashboard (Model: VFO-200)

1. Purpose
Monitor propulsion efficiency by linking main engine speed commands (RPM) with fuel oil flow rates. Highlight eco-speeds.

2. UI Widgets Required:
- Main Engine Speed gauge (RPM, range 0-120)
- Fuel Oil Flow Rate gauge (L/h, range 0-1200, amber color, threshold alert at 1000 L/h)
- Telemetry summary card (vessel speed in knots, heading in degrees, GPS position)
- Propulsion Mode Selector control panel (Options: Eco Speed, Full Speed, Dynamic Positioning, Manual Helm)
- Safety & System Alarms log list
- Operational Fuel Efficiency chart (tracking Specific Fuel Consumption over the last 12 hours)`
  },
  crew_welfare: {
    title: 'Crew Welfare & Watch Portal',
    text: `ThinkPalm - Product Requirements Document
System: Crew Welfare & Watch Safety Portal (Model: CWW-Alpha)

1. Purpose
Monitor crew watch compliance, active personnel status, safety violations, and fresh water storage levels on passenger ferries.

2. UI Widgets Required:
- Crew On Duty metric panel (number of pax active, emerald color)
- Crew Rest Hours Compliance chart (percent, tracking rest schedules over 12 hours)
- Fresh Water Level gauge (m³ volume, range 0-200, cyan color, warning alert if below 25 m³)
- Safety Incidents Alert List panel (tracking compliance warnings)
- Watch Duty Mode Selector control panel (Options: Normal Voyage, Harbor Watch, Emergency Stations, Port Stay)`
  },
  ballast_indicator: {
    title: 'Ballast Water & Tank Level Indicator',
    text: `ThinkPalm - Product Requirements Document
System: Ballast Water Level indicator Dashboard (Model: BWM-900)

1. Purpose
Display current ballast water levels and pump states across the cargo hold to maintain vessel trim and stability.

2. UI Widgets Required:
- Ballast Water Level gauge (%, range 0-100, blue color)
- Vessel Roll Angle gauge (°, range -15 to 15, indigo color)
- Vessel Trim metric panel (m, range -5 to 5)
- Ballast Pump Control panel (Options: AUTO, MANUAL, SHUTDOWN)
- Alarm logs for tank overflow and structural listing`
  }
};

interface PrdEditorProps {
  prdText: string;
  setPrdText: (text: string) => void;
  apiKey: string;
  setApiKey: (key: string) => void;
  onGenerate: () => void;
  isLoading: boolean;
}

export const PrdEditor: React.FC<PrdEditorProps> = ({
  prdText,
  setPrdText,
  apiKey,
  setApiKey,
  onGenerate,
  isLoading
}) => {
  const [showSettings, setShowSettings] = useState(false);

  const applyTemplate = (key: keyof typeof TEMPLATES) => {
    setPrdText(TEMPLATES[key].text);
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
          ⚙️ Claude Settings
        </button>
      </div>

      {showSettings && (
        <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 mb-4 animate-fadeIn">
          <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
            Claude API Key (Optional)
          </label>
          <input
            type="password"
            placeholder="sk-ant-api03..."
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono transition"
          />
          <p className="text-[10px] text-slate-500 mt-1.5 leading-normal">
            Uses Claude 3.5 Sonnet if provided. If blank, it runs in a high-fidelity interactive simulation mode.
          </p>
        </div>
      )}

      {/* Templates Selector */}
      <div className="mb-4">
        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
          Load Predefined Specs
        </label>
        <div className="grid grid-cols-3 gap-2">
          {Object.entries(TEMPLATES).map(([key, t]) => (
            <button
              key={key}
              onClick={() => applyTemplate(key as keyof typeof TEMPLATES)}
              className="text-[10px] bg-slate-800/80 hover:bg-slate-800 border border-slate-850 hover:border-slate-700 text-slate-300 px-2 py-1.5 rounded font-medium transition text-center truncate"
            >
              {t.title}
            </button>
          ))}
        </div>
      </div>

      {/* PRD Text Editor */}
      <div className="flex-1 flex flex-col min-h-64">
        <label className="block text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1.5">
          Requirements Document Spec (PRD)
        </label>
        <textarea
          value={prdText}
          onChange={(e) => setPrdText(e.target.value)}
          className="flex-1 w-full bg-slate-950/80 border border-slate-850 rounded-lg p-3 text-xs text-slate-300 placeholder-slate-750 focus:outline-none focus:border-indigo-500 font-mono resize-none leading-relaxed transition"
          placeholder="Paste or write your maritime product requirements here..."
        />
      </div>

      <button
        onClick={onGenerate}
        disabled={isLoading || !prdText.trim()}
        className="w-full mt-4 bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 text-white font-bold text-xs py-3 rounded-lg shadow-lg shadow-indigo-600/10 disabled:opacity-40 disabled:pointer-events-none hover:shadow-indigo-500/20 active:scale-[0.98] transition duration-200"
      >
        {isLoading ? '🤖 running Claude agents...' : '⚓ Run Agent Pipeline'}
      </button>
    </div>
  );
};
