import { useCallback, useEffect, useMemo, useState } from 'react';
import type { DashboardLayout } from '../agents/types';
import type { FeedStatus, LiveDataConfig } from './apiConfig';
import { resolveLocation } from './apiConfig';
import { connectAisStream } from './aisStream';
import { detectDomain } from './detectDomain';
import { mapWidgetsToLiveValues } from './mapLiveValues';
import { fetchOpenMeteoData, type OpenMeteoPayload } from './openMeteo';
import type { LiveDataSnapshot, VesselPosition } from './types';

export function useLiveData(
  layout: DashboardLayout | undefined,
  aisApiKey: string | undefined,
  liveConfig: LiveDataConfig
) {
  const [snapshot, setSnapshot] = useState<LiveDataSnapshot | null>(null);
  const [status, setStatus] = useState<'idle' | 'loading' | 'live' | 'error' | 'disabled'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [feedStatus, setFeedStatus] = useState<FeedStatus>({
    openMeteo: 'idle',
    aisstream: 'disabled'
  });
  const [secondsUntilRefresh, setSecondsUntilRefresh] = useState(0);
  const [refreshNonce, setRefreshNonce] = useState(0);

  const context = useMemo(() => {
    if (!layout) return null;
    const domain = detectDomain(layout);
    return {
      layout,
      domain,
      location: resolveLocation(domain, liveConfig)
    };
  }, [layout, liveConfig]);

  const manualRefresh = useCallback(() => {
    setRefreshNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    if (!context || !liveConfig.enabled) {
      setSnapshot(null);
      setStatus(liveConfig.enabled ? 'idle' : 'disabled');
      setFeedStatus({ openMeteo: liveConfig.enabled ? 'idle' : 'disabled', aisstream: 'disabled' });
      setError(null);
      return;
    }

    let cancelled = false;
    let cleanupAis: (() => void) | undefined;
    let latestVessel: VesselPosition | undefined;
    let latestMeteo: OpenMeteoPayload | null = null;
    const pollMs = liveConfig.pollIntervalSec * 1000;

    const applySnapshot = (meteo: OpenMeteoPayload, vessel?: VesselPosition) => {
      const mapped = mapWidgetsToLiveValues(
        context.layout.widgets,
        context.domain,
        meteo,
        vessel
      );

      const sources = [meteo.source];
      if (vessel) sources.push('AISstream');

      setSnapshot({
        domain: context.domain,
        sources,
        lastUpdated: new Date().toLocaleTimeString(),
        widgetValues: mapped.widgetValues,
        chartSeries: mapped.chartSeries,
        vessel,
        alerts: mapped.alerts
      });
      setSecondsUntilRefresh(liveConfig.pollIntervalSec);
    };

    const refresh = async () => {
      try {
        setStatus((prev) => (prev === 'idle' ? 'loading' : prev));
        setFeedStatus((prev) => ({ ...prev, openMeteo: 'testing' }));

        const meteo = await fetchOpenMeteoData(context.domain, context.location);
        if (cancelled) return;

        latestMeteo = meteo;
        applySnapshot(meteo, latestVessel);
        setStatus('live');
        setError(null);
        setFeedStatus((prev) => ({
          ...prev,
          openMeteo: 'connected',
          message: `Open-Meteo synced · ${context.location.label}`
        }));
      } catch (err) {
        if (cancelled) return;
        setStatus('error');
        const msg = err instanceof Error ? err.message : 'Live data unavailable';
        setError(msg);
        setFeedStatus((prev) => ({ ...prev, openMeteo: 'error', message: msg }));
      }
    };

    refresh();
    const pollTimer = window.setInterval(refresh, pollMs);

    const countdownTimer = window.setInterval(() => {
      setSecondsUntilRefresh((s) => (s > 0 ? s - 1 : liveConfig.pollIntervalSec));
    }, 1000);

    if (context.domain === 'maritime' && aisApiKey?.trim()) {
      setFeedStatus((prev) => ({ ...prev, aisstream: 'testing' }));
      cleanupAis = connectAisStream(
        aisApiKey.trim(),
        context.location,
        (vessel) => {
          latestVessel = { ...latestVessel, ...vessel };
          setFeedStatus((prev) => ({ ...prev, aisstream: 'connected' }));
          if (latestMeteo) {
            applySnapshot(latestMeteo, latestVessel);
          }
        },
        (aisStatus, message) => {
          if (aisStatus === 'connected') {
            setFeedStatus((prev) => ({ ...prev, aisstream: 'connected' }));
          } else if (aisStatus === 'error') {
            setFeedStatus((prev) => ({ ...prev, aisstream: 'error', message }));
            if (message) setError(message);
          }
        }
      );
    } else {
      setFeedStatus((prev) => ({
        ...prev,
        aisstream: context.domain === 'maritime' && !aisApiKey?.trim() ? 'disabled' : 'disabled'
      }));
    }

    return () => {
      cancelled = true;
      window.clearInterval(pollTimer);
      window.clearInterval(countdownTimer);
      cleanupAis?.();
    };
  }, [context, aisApiKey, liveConfig, refreshNonce]);

  return {
    snapshot,
    status,
    error,
    feedStatus,
    locationLabel: context?.location.label,
    secondsUntilRefresh,
    manualRefresh,
    domain: context?.domain
  };
}
