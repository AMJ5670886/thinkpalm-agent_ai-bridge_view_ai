import React, { useState, useEffect } from 'react';
import type { DashboardLayout } from '../agents/types';
import * as Icons from 'lucide-react';

interface DashboardPreviewProps {
  layout?: DashboardLayout;
}

export const DashboardPreview: React.FC<DashboardPreviewProps> = ({ layout }) => {
  const [time, setTime] = useState<string>('');
  const [widgetStates, setWidgetStates] = useState<{ [id: string]: any }>({});
  const [activeAlerts, setActiveAlerts] = useState<Array<{ id: string; text: string; severity: 'warn' | 'crit' | 'info'; active: boolean }>>([
    { id: '1', text: 'Ballast pump vibration warning', severity: 'warn', active: true },
    { id: '2', text: 'Main Engine oil pressure sensor telemetry lag', severity: 'info', active: true },
    { id: '3', text: 'Secondary cooling duct low pressure flow alert', severity: 'crit', active: true }
  ]);

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      setTime(now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (layout) {
      const states: { [id: string]: any } = {};
      layout.widgets.forEach(w => {
        if (w.type === 'gauge') {
          states[w.id] = typeof w.value === 'number' ? w.value : parseFloat(w.value as string) || 50;
        } else if (w.type === 'control_panel') {
          states[w.id] = w.options?.[0] || 'Eco Speed';
        } else if (w.type === 'metric') {
          states[w.id] = w.value;
        }
      });
      setWidgetStates(states);
    }
  }, [layout]);

  if (!layout) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-slate-500 h-full py-32 text-center min-h-[300px]">
        <div className="w-16 h-16 rounded-full bg-slate-900 border border-slate-880 flex items-center justify-center text-slate-400 mb-4 animate-pulse">
          🧭
        </div>
        <h3 className="text-white text-sm font-bold">No Layout Previews Yet</h3>
        <p className="text-xs text-slate-500 max-w-xs mt-1 leading-normal">
          Run the agent pipeline on your maritime spec to construct layout widget definitions and render components here.
        </p>
      </div>
    );
  }

  const handleStateChange = (id: string, value: any) => {
    setWidgetStates(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const getIcon = (iconName: string) => {
    const LucideIcon = (Icons as any)[iconName];
    if (LucideIcon) {
      return <LucideIcon className="w-5 h-5" />;
    }
    return <Icons.Gauge className="w-5 h-5" />;
  };

  const colorStyles = {
    blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', progress: 'bg-blue-500', bar: '#3b82f6' },
    emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', progress: 'bg-emerald-500', bar: '#10b981' },
    amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', progress: 'bg-amber-500', bar: '#f59e0b' },
    rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', progress: 'bg-rose-500', bar: '#f43f5e' },
    indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400', progress: 'bg-indigo-500', bar: '#6366f1' },
    cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', progress: 'bg-cyan-500', bar: '#06b6d4' }
  };

  return (
    <div className="w-full bg-slate-950 text-slate-100 flex flex-col p-4 md:p-6 border border-slate-900 rounded-xl overflow-hidden shadow-2xl">
      {/* Dashboard Top Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-900 pb-4 mb-6 space-y-3 md:space-y-0">
        <div>
          <div className="flex items-center space-x-2.5 mb-1">
            <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 p-2 rounded-lg">
              <Icons.Anchor className="w-5 h-5 animate-pulse" />
            </span>
            <div>
              <h1 className="text-lg font-bold tracking-tight text-white">{layout.title}</h1>
              <p className="text-[10px] text-slate-400 font-medium">{layout.description}</p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3.5 bg-slate-900/40 border border-slate-850 p-2.5 rounded-lg text-[10px]">
          <div className="flex flex-col items-end">
            <span className="text-[9px] text-slate-500 font-bold uppercase">Telemetry Watchdog</span>
            <span className="font-bold text-emerald-400 flex items-center">
              <span className="w-1 h-1 rounded-full bg-emerald-400 mr-1 inline-block animate-ping"></span>
              ONLINE
            </span>
          </div>
          <div className="border-l border-slate-800 h-6"></div>
          <div className="flex flex-col">
            <span className="text-[9px] text-slate-500 font-bold uppercase">Time Logs</span>
            <span className="text-slate-300 font-mono font-semibold">{time || '---'}</span>
          </div>
        </div>
      </header>

      {/* Main Grid View */}
      <main className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {layout.widgets.map((w) => {
          const style = colorStyles[w.color] || colorStyles.blue;
          
          if (w.type === 'gauge') {
            const currentVal = widgetStates[w.id] !== undefined ? widgetStates[w.id] : 50;
            const isAlarm = w.threshold ? currentVal > w.threshold : false;

            return (
              <div key={w.id} className={`bg-slate-900/50 border rounded-xl p-5 flex flex-col justify-between shadow transition duration-300 relative group ${
                isAlarm ? 'border-rose-500/30 bg-rose-955/5' : 'border-slate-850 hover:border-slate-700'
              }`}>
                <div className="flex justify-between items-center mb-3">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{w.title}</span>
                  <div className={`p-1.5 rounded-lg ${isAlarm ? 'bg-rose-500/20 text-rose-400' : `${style.bg} ${style.text}`}`}>
                    {getIcon(w.icon)}
                  </div>
                </div>

                <div className="flex flex-col items-center my-1 relative">
                  <div className="relative flex items-center justify-center">
                    <svg className="w-24 h-24 transform -rotate-90">
                      <circle cx="48" cy="48" r="40" stroke="#1e293b" strokeWidth="6" fill="transparent" />
                      <circle cx="48" cy="48" r="40" 
                        stroke={isAlarm ? '#f43f5e' : style.bar} 
                        strokeWidth="6" 
                        fill="transparent" 
                        strokeDasharray="251"
                        strokeDashoffset={251 - (251 * currentVal) / 100}
                        className="transition-all duration-300 ease-out"
                      />
                    </svg>
                    <div className="absolute flex flex-col items-center">
                      <span className={`text-xl font-black ${isAlarm ? 'text-rose-400' : 'text-white'}`}>
                        {currentVal.toFixed(0)}
                      </span>
                      <span className="text-[9px] text-slate-500 font-bold uppercase">{w.unit || ''}</span>
                    </div>
                  </div>
                  {isAlarm && (
                    <span className="absolute -bottom-1 bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[8px] font-bold px-1.5 py-0.5 rounded tracking-wide animate-pulse">
                      THRESHOLD EXCEEDED
                    </span>
                  )}
                </div>

                <div className="mt-3">
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={currentVal}
                    onChange={(e) => handleStateChange(w.id, Number(e.target.value))}
                    className={`w-full bg-slate-800 rounded-lg cursor-pointer h-1.5 ${
                      isAlarm ? 'accent-rose-500' : `accent-${w.color}-500`
                    }`}
                  />
                </div>
              </div>
            );
          }

          if (w.type === 'metric') {
            const currentVal = widgetStates[w.id] !== undefined ? widgetStates[w.id] : w.value;
            return (
              <div key={w.id} className="bg-slate-900/50 border border-slate-850 hover:border-slate-700 rounded-xl p-5 flex items-center justify-between shadow transition duration-300">
                <div className="flex flex-col">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider mb-1">{w.title}</span>
                  <div className="flex items-baseline space-x-1">
                    <span className="text-2xl font-black text-white">{currentVal}</span>
                    {w.unit && <span className="text-[10px] text-slate-500 font-bold uppercase">{w.unit}</span>}
                  </div>
                </div>
                <div className={`p-2.5 rounded-lg border ${style.bg} ${style.text} ${style.border}`}>
                  {getIcon(w.icon)}
                </div>
              </div>
            );
          }

          if (w.type === 'control_panel') {
            const selectedOpt = widgetStates[w.id] || w.options?.[0] || 'Eco Speed';
            return (
              <div key={w.id} className="bg-slate-900/50 border border-slate-850 hover:border-slate-700 rounded-xl p-5 flex flex-col justify-between shadow transition duration-300">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-slate-400 text-xs font-bold uppercase tracking-wider">{w.title}</span>
                  <div className={`p-1.5 rounded-lg ${style.bg} ${style.text}`}>
                    {getIcon(w.icon)}
                  </div>
                </div>
                <div className="flex flex-col space-y-2 my-1">
                  {(w.options || []).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleStateChange(w.id, opt)}
                      className={`text-left px-3 py-2 rounded-lg border text-xs font-bold tracking-wide transition duration-150 ${
                        selectedOpt === opt
                          ? 'bg-indigo-500/10 border-indigo-500/40 text-indigo-300'
                          : 'bg-slate-950/60 border-slate-850 text-slate-550 hover:border-slate-750'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{opt}</span>
                        {selectedOpt === opt && <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shadow"></span>}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          }

          if (w.type === 'chart') {
            return (
              <div key={w.id} className="bg-slate-900/50 border border-slate-850 hover:border-slate-700 rounded-xl p-5 flex flex-col shadow md:col-span-2 transition duration-300">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-slate-200 text-xs font-bold uppercase tracking-wider">{w.title}</h3>
                    <p className="text-[9px] text-slate-550 font-medium">Auto-sampled data telemetry</p>
                  </div>
                  <div className={`p-1.5 rounded-lg ${style.bg} ${style.text}`}>
                    {getIcon(w.icon)}
                  </div>
                </div>
                <div className="h-32 w-full flex items-end justify-between space-x-1.5 pt-3">
                  {[45, 60, 52, 70, 85, 90, 78, 62, 88, 94, 85, 92].map((val, idx) => (
                    <div key={idx} className="flex-1 flex flex-col items-center group">
                      <div
                        style={{ height: `${val}%` }}
                        className={`w-full rounded-t-sm ${style.progress} opacity-60 group-hover:opacity-100 transition duration-150 relative`}
                      >
                        <div className="absolute -top-7 left-1/2 transform -translate-x-1/2 bg-slate-900 border border-slate-850 text-[8px] font-bold text-white px-1 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition duration-150 pointer-events-none">
                          {val}{w.unit || ''}
                        </div>
                      </div>
                      <span className="text-[8px] font-bold text-slate-650 mt-1.5">H{idx}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (w.type === 'alert_list') {
            const unacknowledged = activeAlerts.filter(a => a.active);
            return (
              <div key={w.id} className="bg-slate-900/50 border border-slate-850 hover:border-slate-700 rounded-xl p-5 flex flex-col shadow md:col-span-2 transition duration-300">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-slate-200 text-xs font-bold uppercase tracking-wider">{w.title}</h3>
                    <p className="text-[9px] text-slate-550 font-medium">Critical warning system logs</p>
                  </div>
                  <span className={`text-[8px] font-extrabold px-2 py-0.5 rounded-full ${
                    unacknowledged.length > 0 ? 'bg-rose-500/10 border border-rose-500/35 text-rose-400 animate-pulse' : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                  }`}>
                    {unacknowledged.length} Alarms Active
                  </span>
                </div>
                
                <div className="space-y-2 max-h-36 overflow-y-auto pr-1">
                  {activeAlerts.map(a => (
                    <div
                      key={a.id}
                      className={`flex items-start justify-between p-2.5 rounded border text-[10px] leading-relaxed transition ${
                        !a.active
                          ? 'opacity-30 border-slate-905 bg-slate-950/10 text-slate-500'
                          : a.severity === 'crit'
                          ? 'bg-rose-500/5 border-rose-500/15 text-rose-300'
                          : a.severity === 'warn'
                          ? 'bg-amber-500/5 border-amber-500/15 text-amber-300'
                          : 'bg-sky-500/5 border-sky-500/15 text-sky-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2">
                        <Icons.ShieldAlert className="w-3.5 h-3.5 text-slate-400" />
                        <span className="font-semibold">{a.text}</span>
                      </div>
                      {a.active && (
                        <button
                          onClick={() => setActiveAlerts(activeAlerts.map(al => al.id === a.id ? { ...al, active: false } : al))}
                          className="bg-slate-900 border border-slate-800 text-[8px] font-bold text-slate-300 hover:text-white px-2 py-0.5 rounded transition duration-150"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          }

          if (w.type === 'map') {
            return (
              <div key={w.id} className="bg-slate-900/50 border border-slate-850 hover:border-slate-700 rounded-xl p-5 flex flex-col shadow md:col-span-3 transition duration-300 min-h-60">
                <div className="flex justify-between items-center mb-3">
                  <div>
                    <h3 className="text-slate-200 text-xs font-bold uppercase tracking-wider">{w.title}</h3>
                    <p className="text-[9px] text-slate-550 font-medium">AIS Voyage Mapping Grid</p>
                  </div>
                  <div className={`p-1.5 rounded-lg ${style.bg} ${style.text}`}>
                    {getIcon(w.icon)}
                  </div>
                </div>
                <div className="flex-1 bg-slate-955 rounded-lg relative overflow-hidden border border-slate-900 min-h-44">
                  <div className="absolute inset-0 opacity-10" style={{
                    backgroundImage: 'radial-gradient(circle, #334155 1.5px, transparent 1.5px)',
                    backgroundSize: '18px 18px'
                  }} />
                  
                  <svg className="absolute inset-0 w-full h-full">
                    <path d="M 40 120 Q 180 60, 310 90 T 560 50" stroke="#1e293b" strokeWidth="2.5" strokeDasharray="5" fill="transparent" />
                    <path d="M 40 120 Q 180 60, 240 76" stroke="#10b981" strokeWidth="2.5" fill="transparent" />
                    
                    <circle cx="240" cy="76" r="4.5" fill="#10b981" className="animate-ping" />
                    <circle cx="240" cy="76" r="3.5" fill="#10b981" />
                  </svg>
                  
                  <div className="absolute bottom-2.5 left-2.5 bg-slate-900/90 border border-slate-850 p-2 rounded flex flex-col space-y-0.5 text-[9px]">
                    <span className="text-slate-550 font-bold">SHIP ID: <strong className="text-white">TP-CONTAINER</strong></span>
                    <span className="text-slate-550 font-bold">ROUTE: <strong className="text-indigo-400">SINGAPORE → PORT SAID</strong></span>
                    <span className="text-slate-550 font-bold">POSITION: <strong className="text-emerald-400">24°48'N, 056°22'E</strong></span>
                  </div>
                  
                  <div className="absolute top-2.5 right-2.5 flex items-center space-x-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                    <span className="text-slate-400 font-bold text-[8px] tracking-widest">GPS ACCURATE</span>
                  </div>
                </div>
              </div>
            );
          }

          return null;
        })}
      </main>

      <footer className="mt-8 border-t border-slate-900 pt-4 flex justify-between items-center text-[10px] text-slate-655 font-semibold tracking-wider">
        <span>ThinkPalm Technologies</span>
        <span>BridgeView Engine Stable</span>
      </footer>
    </div>
  );
};
