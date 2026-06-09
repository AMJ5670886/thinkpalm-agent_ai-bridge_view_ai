import { queryGroq } from '../agents/groqApi';

export interface ConnectionTestResult {
  ok: boolean;
  message: string;
  latencyMs?: number;
}

export async function testOpenMeteo(latitude: number, longitude: number): Promise<ConnectionTestResult> {
  const start = performance.now();
  try {
    const url =
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      '&current=temperature_2m,wind_speed_10m&timezone=auto';
    const response = await fetch(url);
    if (!response.ok) {
      return { ok: false, message: `HTTP ${response.status}` };
    }
    const data = await response.json();
    const temp = data.current?.temperature_2m;
    const wind = data.current?.wind_speed_10m;
    return {
      ok: true,
      message: `Connected · ${temp ?? '—'}°C · wind ${wind ?? '—'} km/h`,
      latencyMs: Math.round(performance.now() - start)
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Connection failed',
      latencyMs: Math.round(performance.now() - start)
    };
  }
}

export function testAisStream(apiKey: string, latitude: number, longitude: number): Promise<ConnectionTestResult> {
  const start = performance.now();

  return new Promise((resolve) => {
    if (!apiKey.trim()) {
      resolve({ ok: false, message: 'API key required' });
      return;
    }

    let settled = false;
    const finish = (result: ConnectionTestResult) => {
      if (settled) return;
      settled = true;
      socket?.close();
      clearTimeout(timer);
      resolve({ ...result, latencyMs: Math.round(performance.now() - start) });
    };

    let socket: WebSocket | null = null;
    const timer = window.setTimeout(() => {
      finish({ ok: false, message: 'Timeout — no AIS packets in 8s (try a busier region)' });
    }, 8000);

    try {
      socket = new WebSocket('wss://stream.aisstream.io/v0/stream');

      socket.onopen = () => {
        const delta = 3;
        socket?.send(
          JSON.stringify({
            APIKey: apiKey.trim(),
            BoundingBoxes: [
              [[longitude - delta, latitude - delta], [longitude + delta, latitude + delta]]
            ],
            FilterMessageTypes: ['PositionReport']
          })
        );
      };

      socket.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data as string);
          const pos = payload?.Message?.PositionReport;
          if (pos?.Latitude !== undefined && pos?.Longitude !== undefined) {
            finish({
              ok: true,
              message: `Live AIS · MMSI ${pos.UserID} · ${pos.Sog?.toFixed?.(1) ?? '—'} kn`
            });
          }
        } catch {
          // wait for next packet
        }
      };

      socket.onerror = () => finish({ ok: false, message: 'WebSocket error — check API key' });
      socket.onclose = () => {
        if (!settled) finish({ ok: false, message: 'Connection closed' });
      };
    } catch (err) {
      finish({ ok: false, message: err instanceof Error ? err.message : 'WebSocket unavailable' });
    }
  });
}

export async function testGroq(apiKey: string): Promise<ConnectionTestResult> {
  const start = performance.now();
  if (!apiKey.trim()) {
    return { ok: false, message: 'API key required' };
  }

  try {
    const text = await queryGroq('Reply with exactly: OK', apiKey, 16);
    return {
      ok: text.toUpperCase().includes('OK'),
      message: text.toUpperCase().includes('OK') ? 'Groq Llama 3.3 70B reachable' : `Unexpected: ${text.slice(0, 40)}`,
      latencyMs: Math.round(performance.now() - start)
    };
  } catch (err) {
    return {
      ok: false,
      message: err instanceof Error ? err.message : 'Groq request failed',
      latencyMs: Math.round(performance.now() - start)
    };
  }
}
