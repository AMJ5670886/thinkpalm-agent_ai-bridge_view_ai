import { useEffect, useState } from 'react';
import { PrdEditor } from './components/PrdEditor';
import {
  loadAisKey,
  loadGroqKey,
  loadLiveConfig,
  saveAisKey,
  saveGroqKey,
  saveLiveConfig,
  type LiveDataConfig
} from './liveData/apiConfig';
import { AgentTerminal } from './components/AgentTerminal';
import { DashboardPreview } from './components/DashboardPreview';
import { CodeExporter } from './components/CodeExporter';
import { MemoryInspector } from './components/MemoryInspector';
import { Orchestrator } from './agents/Orchestrator';
import type { PipelineSession } from './agents/types';
import { Anchor, Cpu, RefreshCw } from 'lucide-react';
import './App.css';

function App() {
  const [prdText, setPrdText] = useState<string>('');
  const [apiKey, setApiKey] = useState<string>(() => loadGroqKey());
  const [aisApiKey, setAisApiKey] = useState<string>(() => loadAisKey());
  const [liveConfig, setLiveConfig] = useState<LiveDataConfig>(() => loadLiveConfig());

  useEffect(() => {
    saveGroqKey(apiKey);
  }, [apiKey]);

  useEffect(() => {
    saveAisKey(aisApiKey);
  }, [aisApiKey]);

  useEffect(() => {
    saveLiveConfig(liveConfig);
  }, [liveConfig]);
  const [activeTab, setActiveTab] = useState<'preview' | 'code' | 'memory'>('preview');
  const [refreshToggle, setRefreshToggle] = useState<boolean>(false);
  const [session, setSession] = useState<PipelineSession>({
    status: 'idle',
    currentStep: 'Idle - Ready for requirements spec',
    logs: []
  });

  const orchestrator = new Orchestrator();

  const handleGenerate = async () => {
    setActiveTab('preview');
    await orchestrator.runPipeline(prdText, apiKey, (updatedSession) => {
      setSession(updatedSession);
    });
  };

  const handleClearMemory = () => {
    setRefreshToggle(!refreshToggle);
  };

  const isLoading = session.status === 'analyzing' || session.status === 'coding' || session.status === 'verifying';

  return (
    <div className="w-full min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none">
      {/* Top Application Bar */}
      <header className="bg-slate-900/60 backdrop-blur-md border-b border-slate-900 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="bg-indigo-600/10 border border-indigo-500/30 text-indigo-400 p-2.5 rounded-xl shadow-inner">
            <Anchor className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-widest text-white uppercase flex items-center">
              BridgeView AI
              <span className="ml-2.5 bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 text-[8px] font-extrabold px-1.5 py-0.5 rounded uppercase tracking-widest">
                Mini Project
              </span>
            </h1>
            <p className="text-[10px] text-slate-400 font-medium">ThinkPalm Maritime Groq Agent Pipeline</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center space-x-2 border px-3 py-1.5 rounded-lg text-[9px] font-extrabold tracking-wider uppercase ${
            liveConfig.enabled
              ? 'bg-emerald-500/10 border-emerald-500/25 text-emerald-400'
              : 'bg-slate-950 border-slate-850 text-slate-500'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${liveConfig.enabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'}`} />
            <span>{liveConfig.enabled ? `Live Telemetry · ${liveConfig.pollIntervalSec}s` : 'Simulation Mode'}</span>
          </div>
          <div className="flex items-center space-x-2 bg-slate-950 border border-slate-850 px-3 py-1.5 rounded-lg text-[9px] text-slate-500 font-extrabold tracking-wider uppercase">
            <Cpu className="w-3.5 h-3.5 text-indigo-400" />
            <span>{apiKey.trim() ? 'Groq Connected' : 'Local Pipeline'}</span>
          </div>
        </div>
      </header>

      {/* Main Grid Panels Workspace */}
      <div className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full flex flex-col gap-6">

        {/* Top row: Requirements + Pipeline Monitor */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-stretch">
          <div className="flex flex-col min-h-0">
            <PrdEditor
              prdText={prdText}
              setPrdText={setPrdText}
              apiKey={apiKey}
              setApiKey={setApiKey}
              aisApiKey={aisApiKey}
              setAisApiKey={setAisApiKey}
              liveConfig={liveConfig}
              setLiveConfig={setLiveConfig}
              onGenerate={handleGenerate}
              isLoading={isLoading}
            />
          </div>

          <div className="flex flex-col min-h-0">
            <AgentTerminal
              logs={session.logs}
              currentStep={session.currentStep}
              status={session.status}
            />
          </div>
        </div>

        {/* Bottom row: Tabbed Output Panel (Preview, Code, Memory) */}
        <div className="flex flex-col flex-1 min-h-[420px]">
          <div className="bg-slate-900/40 border border-slate-880 rounded-xl p-5 flex flex-col h-full shadow-xl">
            {/* Tabs Header Navigation */}
            <div className="flex justify-between items-center mb-4 border-b border-slate-850 pb-2.5">
              <h2 className="text-white text-base font-bold flex items-center">
                <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 mr-2.5 inline-block"></span>
                3. Output Terminal
              </h2>
              <div className="flex bg-slate-955 border border-slate-850 p-1 rounded-lg">
                <button
                  onClick={() => setActiveTab('preview')}
                  className={`text-[9px] font-bold px-2 py-1 rounded transition ${
                    activeTab === 'preview'
                      ? 'bg-indigo-600 text-white font-black'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Live Preview
                </button>
                <button
                  onClick={() => setActiveTab('code')}
                  className={`text-[9px] font-bold px-2 py-1 rounded transition ${
                    activeTab === 'code'
                      ? 'bg-indigo-600 text-white font-black'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Source Code
                </button>
                <button
                  onClick={() => setActiveTab('memory')}
                  className={`text-[9px] font-bold px-2 py-1 rounded transition ${
                    activeTab === 'memory'
                      ? 'bg-indigo-600 text-white font-black'
                      : 'text-slate-500 hover:text-slate-300'
                  }`}
                >
                  Memory Log
                </button>
              </div>
            </div>

            {/* Tab Contents Frame */}
            <div className="flex-1 flex flex-col min-h-64">
              {activeTab === 'preview' && (
                <div className="flex-1 flex flex-col">
                  {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center py-20">
                      <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                      <h4 className="text-white text-xs font-bold uppercase tracking-wider">Compiling Components...</h4>
                      <p className="text-[10px] text-slate-550 mt-1 max-w-xs leading-normal">
                        Please wait. The AI agents are currently mapping properties and generating component code tree styles.
                      </p>
                    </div>
                  ) : (
                    <DashboardPreview
                      layout={session.layout}
                      aisApiKey={aisApiKey}
                      liveConfig={liveConfig}
                    />
                  )}
                </div>
              )}

              {activeTab === 'code' && (
                <div className="flex-1 flex flex-col">
                  {isLoading ? (
                    <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-center py-20">
                      <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin mb-3" />
                      <h4 className="text-white text-xs font-bold">Coding Components...</h4>
                    </div>
                  ) : (
                    <CodeExporter 
                      code={session.code} 
                      title={session.layout?.title || 'Maritime Dashboard'} 
                      description={session.layout?.description || 'Vessel Monitoring Spec'}
                    />
                  )}
                </div>
              )}

              {activeTab === 'memory' && (
                <div className="flex-1 flex flex-col">
                  <MemoryInspector
                    layout={session.layout}
                    onClearMemory={handleClearMemory}
                    triggerRefresh={refreshToggle}
                  />
                </div>
              )}
            </div>

          </div>
        </div>

      </div>

      {/* Workspace Footer Bar */}
      <footer className="bg-slate-950 border-t border-slate-900 px-6 py-4 flex flex-col md:flex-row justify-between items-center text-[10px] text-slate-650 font-semibold tracking-wider">
        <span>© 2026 BridgeView AI | THINKPALM TECHNOLOGIES</span>
        <span className="mt-2 md:mt-0 flex items-center space-x-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block mr-1"></span>
          AGENT PIPELINE SYSTEM STABLE
        </span>
      </footer>
    </div>
  );
}

export default App;
