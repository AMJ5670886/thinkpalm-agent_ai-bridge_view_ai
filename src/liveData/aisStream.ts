import type { GeoLocation, VesselPosition } from './types';

const AIS_STREAM_URL = 'wss://stream.aisstream.io/v0/stream';

export function connectAisStream(
  apiKey: string,
  location: GeoLocation,
  onVessel: (vessel: VesselPosition) => void,
  onStatus: (status: 'connecting' | 'connected' | 'error', message?: string) => void
): () => void {
  let socket: WebSocket | null = null;
  let closed = false;

  const cleanup = () => {
    closed = true;
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.close();
    }
    socket = null;
  };

  try {
    onStatus('connecting');
    socket = new WebSocket(AIS_STREAM_URL);

    socket.onopen = () => {
      if (closed || !socket) return;
      const lat = location.latitude;
      const lon = location.longitude;
      const delta = 2;

      socket.send(
        JSON.stringify({
          APIKey: apiKey,
          BoundingBoxes: [[[lon - delta, lat - delta], [lon + delta, lat + delta]]],
          FilterMessageTypes: ['PositionReport', 'ShipStaticData']
        })
      );
      onStatus('connected');
    };

    socket.onmessage = (event) => {
      try {
        const payload = JSON.parse(event.data as string);
        const position = payload?.Message?.PositionReport;
        const staticData = payload?.Message?.ShipStaticData;

        if (position) {
          onVessel({
            mmsi: String(position.UserID || ''),
            latitude: position.Latitude,
            longitude: position.Longitude,
            speedKnots: typeof position.Sog === 'number' ? position.Sog : undefined,
            heading: position.TrueHeading ?? position.Cog,
            timestamp: payload.MetaData?.time_utc || new Date().toISOString()
          });
        } else if (staticData?.Name) {
          onVessel({
            mmsi: String(staticData.UserID || ''),
            name: staticData.Name,
            latitude: location.latitude,
            longitude: location.longitude,
            timestamp: payload.MetaData?.time_utc || new Date().toISOString()
          });
        }
      } catch {
        // Ignore malformed AIS packets.
      }
    };

    socket.onerror = () => {
      onStatus('error', 'AISstream connection failed');
    };

    socket.onclose = () => {
      if (!closed) {
        onStatus('error', 'AISstream connection closed');
      }
    };
  } catch (error) {
    onStatus('error', error instanceof Error ? error.message : 'AISstream unavailable');
  }

  return cleanup;
}
