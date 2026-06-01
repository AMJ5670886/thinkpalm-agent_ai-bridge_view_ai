import type { DashboardLayout } from './types';
import { searchIcons } from './tools';

export class ClaudeCoder {
  /**
   * Generates Tailwind-styled React component code from the dashboard layout using Claude.
   */
  async generateCode(
    layout: DashboardLayout,
    apiKey: string | undefined,
    log: (msg: string, type?: 'info' | 'tool_call' | 'tool_response') => void
  ): Promise<string> {
    log('Initiating React component code generation...', 'info');
    await new Promise(resolve => setTimeout(resolve, 800));

    if (apiKey && apiKey.trim() !== '') {
      log('Delegating React code generation to Claude 3.5 Sonnet...', 'info');
      try {
        const code = await this.queryClaudeAPI(layout, apiKey, log);
        log('Claude completed code generation successfully.', 'info');
        return code;
      } catch (err) {
        log(`Claude code generator failed (${err instanceof Error ? err.message : String(err)}). Falling back to local generation.`, 'info');
      }
    }

    log('Running local React component compiler (Claude Mode)...', 'info');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const resolvedIcons: { [key: string]: string } = {};
    for (const w of layout.widgets) {
      log(`Resolving icon for widget: "${w.title}"...`, 'info');
      log(`Calling Tool: Icon Selector for keyword "${w.icon}"...`, 'tool_call');
      const iconMatches = searchIcons(w.icon);
      const icon = iconMatches[0]?.iconName || 'Gauge';
      log(`Icon Selector Tool returned: "${icon}"`, 'tool_response');
      resolvedIcons[w.id] = icon;
    }

    log('Assembling React dashboard template with Tailwind CSS...', 'info');
    const generatedCode = this.assembleLocalCode(layout, resolvedIcons);
    log('React dashboard component generated successfully.', 'info');
    
    return generatedCode;
  }

  private assembleLocalCode(layout: DashboardLayout, icons: { [key: string]: string }): string {
    const importIcons = Array.from(
      new Set([...Object.values(icons), 'Anchor', 'AlertCircle', 'CheckCircle2', 'ShieldAlert', 'Settings'])
    );
    let stateInitializers = '';
    let widgetRenders = '';

    layout.widgets.forEach(w => {
      const iconName = icons[w.id] || 'Gauge';
      const colorMap = {
        blue: { bg: 'bg-blue-500/10', border: 'border-blue-500/20', text: 'text-blue-400', progress: 'bg-blue-500', glow: 'shadow-blue-500/20' },
        emerald: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-400', progress: 'bg-emerald-500', glow: 'shadow-emerald-500/20' },
        amber: { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-400', progress: 'bg-amber-500', glow: 'shadow-amber-500/20' },
        rose: { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-400', progress: 'bg-rose-500', glow: 'shadow-rose-500/20' },
        indigo: { bg: 'bg-indigo-500/10', border: 'border-indigo-500/20', text: 'text-indigo-400', progress: 'bg-indigo-500', glow: 'shadow-indigo-500/20' },
        cyan: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-400', progress: 'bg-cyan-500', glow: 'shadow-cyan-500/20' }
      };

      const c = colorMap[w.color] || colorMap.blue;

      if (w.type === 'gauge') {
        const valName = `val_${w.id}`;
        stateInitializers += `  const [${valName}, set_${valName}] = useState<number>(${w.value || 50});\n`;
        
        widgetRenders += `
        {/* Gauge Widget: ${w.title} */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-880 rounded-xl p-6 flex flex-col justify-between shadow-lg relative overflow-hidden group hover:border-slate-700 transition duration-300">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-400 text-sm font-medium">${w.title}</span>
            <div className="p-2 rounded-lg ${c.bg} ${c.text}">
              <${iconName} className="w-5 h-5" />
            </div>
          </div>
          <div className="flex flex-col items-center my-2">
            <div className="relative flex items-center justify-center">
              <svg className="w-32 h-32 transform -rotate-90">
                <circle cx="64" cy="64" r="52" stroke="#1e293b" strokeWidth="8" fill="transparent" />
                <circle cx="64" cy="64" r="52" stroke="${w.color === 'blue' ? '#3b82f6' : w.color === 'emerald' ? '#10b981' : w.color === 'amber' ? '#f59e0b' : w.color === 'rose' ? '#f43f5e' : w.color === 'indigo' ? '#6366f1' : '#06b6d4'}" strokeWidth="8" fill="transparent" 
                  strokeDasharray="326"
                  strokeDashoffset={326 - (326 * ${valName}) / 100}
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-2xl font-bold text-white">{${valName}.toFixed(1)}</span>
                <span className="text-xs text-slate-400">${w.unit || ''}</span>
              </div>
            </div>
          </div>
          <div className="mt-4">
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={${valName}}
              onChange={(e) => set_${valName}(Number(e.target.value))}
              className="w-full accent-${w.color}-500 bg-slate-800 rounded-lg cursor-pointer h-1.5" 
            />
          </div>
        </div>
        `;
      } 
      else if (w.type === 'metric') {
        const valName = `val_${w.id}`;
        const defaultValStr = typeof w.value === 'number' ? w.value : `"${w.value || ''}"`;
        stateInitializers += `  const [${valName}, set_${valName}] = useState<any>(${defaultValStr});\n`;
        
        widgetRenders += `
        {/* Metric Widget: ${w.title} */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-6 flex items-center justify-between shadow-lg hover:border-slate-700 transition duration-300">
          <div className="flex flex-col">
            <span className="text-slate-400 text-sm font-medium mb-1">${w.title}</span>
            <div className="flex items-baseline space-x-1">
              <span className="text-3xl font-bold text-white">{${valName}}</span>
              {${valName} !== '' && <span className="text-sm text-slate-400 font-semibold">${w.unit || ''}</span>}
            </div>
          </div>
          <div className="p-3 rounded-xl ${c.bg} ${c.text} shadow-inner">
            <${iconName} className="w-6 h-6" />
          </div>
        </div>
        `;
      }
      else if (w.type === 'chart') {
        widgetRenders += `
        {/* Chart Widget: ${w.title} */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-6 flex flex-col shadow-lg md:col-span-2 hover:border-slate-700 transition duration-300">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-white text-base font-semibold">${w.title}</h3>
              <p className="text-xs text-slate-400">Historical efficiency logs</p>
            </div>
            <div className="p-2 rounded-lg ${c.bg} ${c.text}">
              <${iconName} className="w-5 h-5" />
            </div>
          </div>
          <div className="h-40 w-full flex items-end justify-between space-x-1.5 pt-4">
            {[45, 60, 52, 70, 85, 90, 78, 62, 88, 94, 85, 92].map((val, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center group">
                <div 
                  style={{ height: \`\${val}%\` }} 
                  className="w-full rounded-t-sm ${c.progress} opacity-75 group-hover:opacity-100 transition duration-200 relative"
                >
                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-slate-800 text-[10px] text-white px-1.5 py-0.5 rounded shadow opacity-0 group-hover:opacity-100 transition duration-200 pointer-events-none">
                    {val}${w.unit || ''}
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 mt-2">H{idx}</span>
              </div>
            ))}
          </div>
        </div>
        `;
      }
      else if (w.type === 'alert_list') {
        stateInitializers += `  const [alerts, setAlerts] = useState<Array<{id: string, text: string, severity: 'warn' | 'crit' | 'info', active: boolean}>>([
    { id: '1', text: 'Ballast pump vibration warning', severity: 'warn', active: true },
    { id: '2', text: 'Main Engine oil pressure sensor telemetry lag', severity: 'info', active: true },
    { id: '3', text: 'Secondary cooling duct low pressure flow alert', severity: 'crit', active: true }
  ]);\n`;
        
        widgetRenders += `
        {/* Alert List Widget: ${w.title} */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-6 flex flex-col shadow-lg md:col-span-2 hover:border-slate-700 transition duration-300">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-white text-base font-semibold">${w.title}</h3>
              <p className="text-xs text-slate-400">Active marine watch notifications</p>
            </div>
            <span className="bg-rose-500/10 text-rose-400 text-xs px-2.5 py-1 rounded-full border border-rose-500/20 font-semibold animate-pulse">
              {alerts.filter(a => a.active).length} Alerts
            </span>
          </div>
          <div className="space-y-3 max-h-48 overflow-y-auto pr-1">
            {alerts.map(a => (
              <div 
                key={a.id} 
                className={\`flex items-start justify-between p-3 rounded-lg border \${
                  !a.active ? 'opacity-40 border-slate-800 bg-slate-950/20' :
                  a.severity === 'crit' ? 'bg-rose-500/5 border-rose-500/10 text-rose-300' :
                  a.severity === 'warn' ? 'bg-amber-500/5 border-amber-500/10 text-amber-300' :
                  'bg-blue-500/5 border-blue-500/10 text-blue-300'
                }\`}
              >
                <div className="flex space-x-3">
                  <ShieldAlert className="w-5 h-5 shrink-0 text-slate-400 mt-0.5" />
                  <span className="text-sm font-medium">{a.text}</span>
                </div>
                {a.active && (
                  <button 
                    onClick={() => setAlerts(alerts.map(al => al.id === a.id ? {...al, active: false} : al))}
                    className="text-xs font-semibold hover:text-slate-200 bg-slate-800 hover:bg-slate-700 px-2 py-1 rounded transition"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
        `;
      }
      else if (w.type === 'control_panel') {
        const selectedOpt = `opt_${w.id}`;
        stateInitializers += `  const [${selectedOpt}, set_${selectedOpt}] = useState<string>('${w.options?.[0] || 'Eco Speed'}');\n`;
        
        widgetRenders += `
        {/* Control Panel Widget: ${w.title} */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-6 flex flex-col justify-between shadow-lg hover:border-slate-700 transition duration-300">
          <div className="flex justify-between items-center mb-4">
            <span className="text-slate-400 text-sm font-medium">${w.title}</span>
            <div className="p-2 rounded-lg ${c.bg} ${c.text}">
              <${iconName} className="w-5 h-5" />
            </div>
          </div>
          <div className="flex flex-col space-y-2.5 my-2">
            {${JSON.stringify(w.options || [])}.map((opt) => (
              <button
                key={opt}
                onClick={() => set_${selectedOpt}(opt)}
                className={\`w-full text-left px-4 py-2.5 rounded-lg border text-sm font-medium transition duration-200 \${
                  ${selectedOpt} === opt 
                    ? 'bg-indigo-500/20 border-indigo-500/50 text-indigo-200' 
                    : 'bg-slate-950/40 border-slate-850 text-slate-450 hover:border-slate-700'
                }\`}
              >
                <div className="flex items-center justify-between">
                  <span>{opt}</span>
                  {${selectedOpt} === opt && <span className="w-2 h-2 rounded-full bg-indigo-400 shadow-md"></span>}
                </div>
              </button>
            ))}
          </div>
          <div className="mt-3 text-center">
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">COMMAND TELEMETRY LOGGED</span>
          </div>
        </div>
        `;
      }
      else if (w.type === 'map') {
        widgetRenders += `
        {/* Map Tracker Widget: ${w.title} */}
        <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800 rounded-xl p-6 flex flex-col shadow-lg md:col-span-3 hover:border-slate-700 transition duration-300 min-h-64">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-white text-base font-semibold">${w.title}</h3>
              <p className="text-xs text-slate-400">AIS Navigation Plotting</p>
            </div>
            <div className="p-2 rounded-lg ${c.bg} ${c.text}">
              <${iconName} className="w-5 h-5" />
            </div>
          </div>
          <div className="flex-1 bg-slate-950 rounded-lg relative overflow-hidden border border-slate-800 min-h-48">
            <div className="absolute inset-0 opacity-15 pointer-events-none" style={{
              backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)',
              backgroundSize: '16px 16px'
            }} />
            
            <svg className="absolute inset-0 w-full h-full">
              <path d="M 50 150 Q 200 80, 350 120 T 600 70" stroke="#1e293b" strokeWidth="3" strokeDasharray="6" fill="transparent" />
              <path d="M 50 150 Q 200 80, 280 102" stroke="#10b981" strokeWidth="3" fill="transparent" />
              
              <circle cx="280" cy="102" r="5" fill="#10b981" className="animate-ping" />
              <circle cx="280" cy="102" r="4" fill="#10b981" />
            </svg>
            
            <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 px-3 py-2 rounded-lg flex flex-col space-y-1">
              <span className="text-[10px] text-slate-400 font-medium">VESSEL: <strong className="text-white font-semibold">T-900 OIL CARRIER</strong></span>
              <span className="text-[10px] text-slate-400 font-medium">HEADING: <strong className="text-white font-semibold">184° SSE</strong></span>
              <span className="text-[10px] text-slate-400 font-medium">GPS: <strong className="text-emerald-400 font-semibold">24°48'N, 056°22'E</strong></span>
            </div>
            
            <div className="absolute top-3 right-3 flex items-center space-x-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-slate-300 font-semibold text-xs tracking-wider uppercase">GPS ACTIVE</span>
            </div>
          </div>
        </div>
        `;
      }
    });

    const importsString = `import React, { useState, useEffect } from 'react';\nimport {\n  ${importIcons.join(',\n  ')}\n} from 'lucide-react';`;

    return `${importsString}

/**
 * BridgeView AI Generated Dashboard Component
 * Track Domain: Maritime Engineering (ThinkPalm)
 * Component: ${layout.title}
 * Generated: ${new Date().toISOString()}
 */
export default function ShipDashboard() {
${stateInitializers}
  const [time, setTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTime(now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      {/* Top Navigation Bar */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center border-b border-slate-800 pb-5 mb-8 space-y-4 md:space-y-0">
        <div>
          <div className="flex items-center space-x-3 mb-1.5">
            <span className="bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 p-2 rounded-xl">
              <Anchor className="w-6 h-6 animate-pulse" />
            </span>
            <div>
              <h1 className="text-xl md:text-2xl font-bold tracking-tight text-white">${layout.title}</h1>
              <p className="text-xs text-slate-400 font-medium">${layout.description}</p>
            </div>
          </div>
        </div>
        
        <div className="flex items-center space-x-4 bg-slate-900/80 border border-slate-800/60 p-3 rounded-xl">
          <div className="flex flex-col items-end">
            <span className="text-xs text-slate-500 font-medium">TELEMETRY LINK STATUS</span>
            <span className="text-xs font-semibold text-emerald-400 tracking-wide flex items-center space-x-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block mr-1"></span>
              CONNECTED
            </span>
          </div>
          <div className="border-l border-slate-800 h-8"></div>
          <div className="flex flex-col">
            <span className="text-xs text-slate-500 font-medium">TIMESTAMP</span>
            <span className="text-xs text-slate-300 font-mono">{time || '---'}</span>
          </div>
        </div>
      </header>

      {/* Widget Grid Layout */}
      <main className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-7xl mx-auto w-full">
        ${widgetRenders.trim().replace(/\n/g, '\n        ')}
      </main>

      {/* Footer / System Status */}
      <footer className="mt-12 border-t border-slate-800/60 pt-6 flex justify-between items-center text-slate-500 text-xs tracking-wide">
        <span className="font-semibold text-indigo-400">BridgeView AI // ThinkPalm</span>
        <span className="font-medium text-slate-600">SYSTEM STABLE // AUTO WATCHDOG v4.2</span>
      </footer>
    </div>
  );
}
`;
  }

  private async queryClaudeAPI(layout: DashboardLayout, apiKey: string, _log: (msg: string) => void): Promise<string> {
    const prompt = `You are a Principal React & Tailwind Code Generator Agent.
Create a complete, single-file React component representing the following maritime dashboard layout.
The component must be written in TypeScript, compile cleanly, and use Tailwind CSS styles.

Layout details:
Title: ${layout.title}
Description: ${layout.description}
Widgets to include:
${JSON.stringify(layout.widgets, null, 2)}

Requirements for the generated code:
1. Include imports from "react" (useState, useEffect, etc.) and "lucide-react" icons.
2. The component name must be default exported, e.g. "export default function Dashboard()".
3. Use a gorgeous dark maritime color theme (bg-slate-950, deep slate cards, neon blue/emerald/amber borders and text glow effects).
4. Implement actual dynamic states for all "gauge" sliders, "control_panel" toggle options, and alert items (allow user to toggle/interact with sliders and check/clear alerts).
5. Build an elegant, professional grid matching the column requirement. Use responsive grid layout (e.g. grid-cols-1 md:grid-cols-3) so it scales on mobile and desktop.
6. The layout must feel extremely premium: use modern typography, subtle borders (border-slate-800 hover:border-slate-700), glassmorphic backdrops (backdrop-blur-md), and animations.

Return ONLY raw TSX code. Do NOT wrap in markdown block quotes.`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
        'dangerously-allow-browser': 'true'
      } as any,
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 4000,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Claude API HTTP ${response.status}: ${errText}`);
    }

    const data = await response.json();
    let text = data.content?.[0]?.text;
    if (!text) {
      throw new Error('Empty response from Claude API');
    }

    text = text.replace(/```typescript/g, '')
               .replace(/```tsx/g, '')
               .replace(/```javascript/g, '')
               .replace(/```jsx/g, '')
               .replace(/```/g, '')
               .trim();

    return text;
  }
}
