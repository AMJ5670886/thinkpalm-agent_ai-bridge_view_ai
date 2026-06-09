import type { GeoLocation, LiveDataDomain } from './types';
import { getDomainLocation } from './detectDomain';

export type PollIntervalSec = 15 | 30 | 60;

export interface RegionPreset {
  id: string;
  label: string;
  latitude: number;
  longitude: number;
  domains: LiveDataDomain[];
}

export interface LiveDataConfig {
  enabled: boolean;
  regionId: string;
  customLatitude: number;
  customLongitude: number;
  pollIntervalSec: PollIntervalSec;
}

export type ConnectionStatus = 'idle' | 'testing' | 'connected' | 'error' | 'disabled';

export interface FeedStatus {
  openMeteo: ConnectionStatus;
  aisstream: ConnectionStatus;
  message?: string;
}

const STORAGE_KEYS = {
  groq: 'bridgeview_groq_key',
  ais: 'bridgeview_ais_key',
  live: 'bridgeview_live_config'
} as const;

export const REGION_PRESETS: RegionPreset[] = [
  { id: 'arabian_gulf', label: 'Arabian Gulf (Dubai)', latitude: 24.8, longitude: 56.2, domains: ['maritime', 'general'] },
  { id: 'singapore', label: 'Singapore Strait', latitude: 1.35, longitude: 103.8, domains: ['maritime', 'general'] },
  { id: 'rotterdam', label: 'Rotterdam Port', latitude: 51.9, longitude: 4.5, domains: ['maritime', 'general'] },
  { id: 'chennai', label: 'Chennai (Smart City)', latitude: 13.08, longitude: 80.27, domains: ['environmental', 'general'] },
  { id: 'london', label: 'London (Air Quality)', latitude: 51.5, longitude: -0.12, domains: ['environmental', 'general'] },
  { id: 'coimbatore', label: 'Coimbatore (Agriculture)', latitude: 11.0, longitude: 76.0, domains: ['agriculture', 'general'] },
  { id: 'berlin', label: 'Berlin (Energy Grid)', latitude: 52.52, longitude: 13.41, domains: ['energy', 'general'] },
  { id: 'custom', label: 'Custom Coordinates', latitude: 20.0, longitude: 0.0, domains: ['maritime', 'environmental', 'agriculture', 'energy', 'general'] }
];

export const DEFAULT_LIVE_CONFIG: LiveDataConfig = {
  enabled: true,
  regionId: 'arabian_gulf',
  customLatitude: 24.8,
  customLongitude: 56.2,
  pollIntervalSec: 30
};

export function resolveLocation(domain: LiveDataDomain, config: LiveDataConfig): GeoLocation {
  if (config.regionId === 'custom') {
    return {
      latitude: config.customLatitude,
      longitude: config.customLongitude,
      label: `${config.customLatitude.toFixed(2)}°, ${config.customLongitude.toFixed(2)}°`
    };
  }

  const preset = REGION_PRESETS.find((r) => r.id === config.regionId);
  if (preset) {
    return { latitude: preset.latitude, longitude: preset.longitude, label: preset.label };
  }

  return getDomainLocation(domain);
}

export function suggestedRegionForDomain(domain: LiveDataDomain): string {
  const match = REGION_PRESETS.find((r) => r.id !== 'custom' && r.domains.includes(domain));
  return match?.id || 'arabian_gulf';
}

export function loadGroqKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.groq) || '';
  } catch {
    return '';
  }
}

export function saveGroqKey(key: string): void {
  try {
    if (key.trim()) localStorage.setItem(STORAGE_KEYS.groq, key.trim());
    else localStorage.removeItem(STORAGE_KEYS.groq);
  } catch {
    // ignore
  }
}

export function loadAisKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEYS.ais) || '';
  } catch {
    return '';
  }
}

export function saveAisKey(key: string): void {
  try {
    if (key.trim()) localStorage.setItem(STORAGE_KEYS.ais, key.trim());
    else localStorage.removeItem(STORAGE_KEYS.ais);
  } catch {
    // ignore
  }
}

export function loadLiveConfig(): LiveDataConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.live);
    if (!raw) return { ...DEFAULT_LIVE_CONFIG };
    return { ...DEFAULT_LIVE_CONFIG, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULT_LIVE_CONFIG };
  }
}

export function saveLiveConfig(config: LiveDataConfig): void {
  try {
    localStorage.setItem(STORAGE_KEYS.live, JSON.stringify(config));
  } catch {
    // ignore
  }
}

export function getFeedsForDomain(domain: LiveDataDomain, aisKey: string): Array<{ id: string; name: string; required: boolean; active: boolean }> {
  const feeds = [
    { id: 'open-meteo', name: 'Open-Meteo', required: false, active: true }
  ];

  if (domain === 'maritime') {
    feeds.push({
      id: 'aisstream',
      name: 'AISstream',
      required: false,
      active: Boolean(aisKey.trim())
    });
  }

  return feeds;
}
