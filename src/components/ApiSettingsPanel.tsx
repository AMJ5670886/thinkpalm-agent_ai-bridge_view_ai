import React, { useEffect, useMemo, useState } from 'react';
import { detectDomain } from '../liveData/detectDomain';
import {
  getFeedsForDomain,
  REGION_PRESETS,
  suggestedRegionForDomain,
  resolveLocation,
  type ConnectionStatus,
  type LiveDataConfig,
  type PollIntervalSec
} from '../liveData/apiConfig';
import { testAisStream, testGroq, testOpenMeteo } from '../liveData/testConnections';
import type { LiveDataDomain } from '../liveData/types';

interface ApiSettingsPanelProps {
  groqKey: string;
  setGroqKey: (key: string) => void;
  aisKey: string;
  setAisKey: (key: string) => void;
  liveConfig: LiveDataConfig;
  setLiveConfig: (config: LiveDataConfig) => void;
  detectedDomain?: LiveDataDomain | null;
}

function StatusDot({ status }: { status: ConnectionStatus }) {
  const styles: Record<ConnectionStatus, string> = {
    idle: 'bg-slate-500',
    testing: 'bg-amber-400 animate-pulse',
    connected: 'bg-emerald-400 animate-pulse',
    error: 'bg-rose-400',
    disabled: 'bg-slate-700'
  };
  return <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles[status]}`} />;
}

export const ApiSettingsPanel: React.FC<ApiSettingsPanelProps> = ({
  groqKey,
  setGroqKey,
  aisKey,
  setAisKey,
  liveConfig,
  setLiveConfig,
  detectedDomain
}) => {
  const [groqStatus, setGroqStatus] = useState<ConnectionStatus>('idle');
  const [meteoStatus, setMeteoStatus] = useState<ConnectionStatus>('idle');
  const [aisStatus, setAisStatus] = useState<ConnectionStatus>('idle');
  const [statusMessages, setStatusMessages] = useState<Record<string, string>>({});

  const domain = detectedDomain || 'maritime';
  const location = useMemo(
    () => resolveLocation(domain, liveConfig),
    [domain, liveConfig]
  );
  const feeds = useMemo(() => getFeedsForDomain(domain, aisKey), [domain, aisKey]);

  useEffect(() => {
    setAisStatus(aisKey.trim() && domain === 'maritime' ? 'idle' : 'disabled');
  }, [aisKey, domain]);

  const updateConfig = (patch: Partial<LiveDataConfig>) => {
    setLiveConfig({ ...liveConfig, ...patch });
  };

  const setMessage = (id: string, message: string) => {
    setStatusMessages((prev) => ({ ...prev, [id]: message }));
  };

  const handleTestGroq = async () => {
    setGroqStatus('testing');
    const result = await testGroq(groqKey);
    setGroqStatus(result.ok ? 'connected' : 'error');
    setMessage('groq', result.latencyMs ? `${result.message} (${result.latencyMs}ms)` : result.message);
  };

  const handleTestMeteo = async () => {
    setMeteoStatus('testing');
    const result = await testOpenMeteo(location.latitude, location.longitude);
    setMeteoStatus(result.ok ? 'connected' : 'error');
    setMessage('meteo', result.latencyMs ? `${result.message} (${result.latencyMs}ms)` : result.message);
  };

  const handleTestAis = async () => {
    if (!aisKey.trim()) {
      setAisStatus('error');
      setMessage('ais', 'Add AISstream key from aisstream.io');
      return;
    }
    setAisStatus('testing');
    const result = await testAisStream(aisKey, location.latitude, location.longitude);
    setAisStatus(result.ok ? 'connected' : 'error');
    setMessage('ais', result.latencyMs ? `${result.message} (${result.latencyMs}ms)` : result.message);
  };

  const applySuggestedRegion = () => {
    const regionId = suggestedRegionForDomain(domain);
    const preset = REGION_PRESETS.find((r) => r.id === regionId);
    updateConfig({
      regionId,
      customLatitude: preset?.latitude ?? DEFAULT_LIVE_CONFIG.customLatitude,
      customLongitude: preset?.longitude ?? DEFAULT_LIVE_CONFIG.customLongitude
    });
  };

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-lg p-3.5 mb-4 animate-fadeIn space-y-4">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-xs font-bold text-white">Telemetry & API Configuration</h3>
          <p className="text-[10px] text-slate-500 mt-0.5">
            Real-time feeds auto-map to PRD widgets after pipeline run
          </p>
        </div>
        <label className="flex items-center gap-2 text-[10px] font-bold text-slate-400 cursor-pointer">
          <input
            type="checkbox"
            checked={liveConfig.enabled}
            onChange={(e) => updateConfig({ enabled: e.target.checked })}
            className="accent-indigo-500"
          />
          Live data ON
        </label>
      </div>

      {/* Live telemetry region */}
      <div className="border border-slate-850 rounded-lg p-3 space-y-2.5 bg-slate-900/40">
        <div className="flex items-center justify-between">
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Telemetry Region</span>
          {detectedDomain && (
            <button
              type="button"
              onClick={applySuggestedRegion}
              className="text-[9px] font-bold text-cyan-400 hover:text-cyan-300"
            >
              Auto-pick for {detectedDomain}
            </button>
          )}
        </div>
        <select
          value={liveConfig.regionId}
          onChange={(e) => updateConfig({ regionId: e.target.value })}
          className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-indigo-500"
        >
          {REGION_PRESETS.map((r) => (
            <option key={r.id} value={r.id}>
              {r.label} ({r.latitude}°, {r.longitude}°)
            </option>
          ))}
        </select>
        {liveConfig.regionId === 'custom' && (
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              step="0.01"
              placeholder="Latitude"
              value={liveConfig.customLatitude}
              onChange={(e) => updateConfig({ customLatitude: parseFloat(e.target.value) || 0 })}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white font-mono"
            />
            <input
              type="number"
              step="0.01"
              placeholder="Longitude"
              value={liveConfig.customLongitude}
              onChange={(e) => updateConfig({ customLongitude: parseFloat(e.target.value) || 0 })}
              className="bg-slate-900 border border-slate-800 rounded px-2 py-1.5 text-xs text-white font-mono"
            />
          </div>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[9px] text-slate-500 font-semibold">Refresh:</span>
          {([15, 30, 60] as PollIntervalSec[]).map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => updateConfig({ pollIntervalSec: sec })}
              className={`text-[9px] font-bold px-2 py-0.5 rounded border transition ${
                liveConfig.pollIntervalSec === sec
                  ? 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
              }`}
            >
              {sec}s
            </button>
          ))}
        </div>
      </div>

      {/* Feed status cards */}
      <div className="space-y-2">
        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Data Feeds</span>

        <div className="border border-slate-850 rounded-lg p-2.5 bg-slate-900/30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <StatusDot status={liveConfig.enabled ? meteoStatus : 'disabled'} />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-white">Open-Meteo</p>
                <p className="text-[9px] text-slate-500 truncate">Weather · Marine · Air Quality · Agriculture</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTestMeteo}
              disabled={!liveConfig.enabled || meteoStatus === 'testing'}
              className="text-[9px] font-bold px-2 py-1 rounded border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40"
            >
              Test
            </button>
          </div>
          {statusMessages.meteo && (
            <p className={`text-[9px] mt-1.5 ${meteoStatus === 'error' ? 'text-rose-400' : 'text-emerald-400/90'}`}>
              {statusMessages.meteo}
            </p>
          )}
        </div>

        <div className="border border-slate-850 rounded-lg p-2.5 bg-slate-900/30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <StatusDot status={domain === 'maritime' && aisKey.trim() ? aisStatus : 'disabled'} />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-white">AISstream</p>
                <p className="text-[9px] text-slate-500 truncate">WebSocket · live vessel AIS positions</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTestAis}
              disabled={!aisKey.trim() || aisStatus === 'testing'}
              className="text-[9px] font-bold px-2 py-1 rounded border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40"
            >
              Test
            </button>
          </div>
          <input
            type="password"
            placeholder="AISstream API key (free at aisstream.io)"
            value={aisKey}
            onChange={(e) => setAisKey(e.target.value)}
            className="w-full mt-2 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
          />
          {statusMessages.ais && (
            <p className={`text-[9px] mt-1.5 ${aisStatus === 'error' ? 'text-rose-400' : 'text-emerald-400/90'}`}>
              {statusMessages.ais}
            </p>
          )}
        </div>

        <div className="border border-slate-850 rounded-lg p-2.5 bg-slate-900/30">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <StatusDot status={groqKey.trim() ? groqStatus : 'disabled'} />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-white">Groq</p>
                <p className="text-[9px] text-slate-500 truncate">Llama 3.3 70B · agent pipeline generation</p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleTestGroq}
              disabled={!groqKey.trim() || groqStatus === 'testing'}
              className="text-[9px] font-bold px-2 py-1 rounded border border-slate-700 text-slate-400 hover:text-white disabled:opacity-40"
            >
              Test
            </button>
          </div>
          <input
            type="password"
            placeholder="gsk_..."
            value={groqKey}
            onChange={(e) => setGroqKey(e.target.value)}
            className="w-full mt-2 bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500 font-mono"
          />
          {statusMessages.groq && (
            <p className={`text-[9px] mt-1.5 ${groqStatus === 'error' ? 'text-rose-400' : 'text-emerald-400/90'}`}>
              {statusMessages.groq}
            </p>
          )}
        </div>
      </div>

      {/* Active feeds summary */}
      <div className="flex flex-wrap gap-1.5 pt-1">
        {feeds.map((feed) => (
          <span
            key={feed.id}
            className={`text-[9px] font-bold px-2 py-0.5 rounded border ${
              feed.active && liveConfig.enabled
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/25'
                : 'text-slate-500 bg-slate-900 border-slate-800'
            }`}
          >
            {feed.name} {feed.active && liveConfig.enabled ? '· ACTIVE' : feed.required ? '· REQUIRED' : '· OPTIONAL'}
          </span>
        ))}
        <span className="text-[9px] font-bold px-2 py-0.5 rounded border text-cyan-400 bg-cyan-500/10 border-cyan-500/25">
          {location.label}
        </span>
      </div>
    </div>
  );
};

export function detectDomainFromValidation(
  dashboardTitle: string,
  widgets: Array<{ title: string; type: import('../agents/types').WidgetSpec['type'] }>
) {
  return detectDomain({
    title: dashboardTitle,
    description: '',
    columns: 3,
    widgets: widgets.map((w, i) => ({
      id: `w_${i}`,
      type: w.type,
      title: w.title,
      icon: 'Gauge',
      color: 'blue' as const,
      size: 'small' as const
    }))
  });
}
