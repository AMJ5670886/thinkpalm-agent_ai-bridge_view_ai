import type { GeoLocation, LiveDataDomain } from './types';

export interface OpenMeteoPayload {
  current: Record<string, number>;
  hourly: Record<string, number[]>;
  source: string;
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Open-Meteo HTTP ${response.status}`);
  }
  return response.json() as Promise<T>;
}

function latestHourlyValues(hourly: Record<string, (number | null)[]>, key: string, count = 12): number[] {
  const values = (hourly[key] || [])
    .filter((v): v is number => v !== null && v !== undefined)
    .slice(0, count);
  return values.length > 0 ? values : [0];
}

function currentValue(current: Record<string, number | null>, key: string, fallback = 0): number {
  const value = current[key];
  return typeof value === 'number' ? value : fallback;
}

export async function fetchOpenMeteoData(
  domain: LiveDataDomain,
  location: GeoLocation
): Promise<OpenMeteoPayload> {
  const { latitude, longitude } = location;

  if (domain === 'environmental') {
    const data = await fetchJson<{
      current?: Record<string, number | null>;
      hourly?: Record<string, (number | null)[]>;
    }>(
      `https://api.open-meteo.com/v1/air-quality?latitude=${latitude}&longitude=${longitude}` +
        '&current=european_aqi,pm2_5,pm10,nitrogen_dioxide&hourly=european_aqi,pm2_5,temperature_2m,relative_humidity_2m'
    );

    return {
      current: {
        european_aqi: currentValue(data.current || {}, 'european_aqi'),
        pm2_5: currentValue(data.current || {}, 'pm2_5'),
        pm10: currentValue(data.current || {}, 'pm10'),
        nitrogen_dioxide: currentValue(data.current || {}, 'nitrogen_dioxide'),
        temperature_2m: latestHourlyValues(data.hourly || {}, 'temperature_2m', 1)[0] || 0,
        relative_humidity_2m: latestHourlyValues(data.hourly || {}, 'relative_humidity_2m', 1)[0] || 0
      },
      hourly: {
        european_aqi: latestHourlyValues(data.hourly || {}, 'european_aqi'),
        pm2_5: latestHourlyValues(data.hourly || {}, 'pm2_5'),
        temperature_2m: latestHourlyValues(data.hourly || {}, 'temperature_2m')
      },
      source: 'Open-Meteo Air Quality'
    };
  }

  if (domain === 'agriculture') {
    const data = await fetchJson<{
      current?: Record<string, number | null>;
      hourly?: Record<string, (number | null)[]>;
    }>(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        '&current=temperature_2m,relative_humidity_2m,precipitation&hourly=soil_temperature_0cm,soil_moisture_0_to_1cm,precipitation,temperature_2m,relative_humidity_2m'
    );

    return {
      current: {
        temperature_2m: currentValue(data.current || {}, 'temperature_2m'),
        relative_humidity_2m: currentValue(data.current || {}, 'relative_humidity_2m'),
        precipitation: currentValue(data.current || {}, 'precipitation'),
        soil_temperature_0cm: latestHourlyValues(data.hourly || {}, 'soil_temperature_0cm', 1)[0] || 0,
        soil_moisture_0_to_1cm: latestHourlyValues(data.hourly || {}, 'soil_moisture_0_to_1cm', 1)[0] || 0
      },
      hourly: {
        soil_moisture_0_to_1cm: latestHourlyValues(data.hourly || {}, 'soil_moisture_0_to_1cm'),
        precipitation: latestHourlyValues(data.hourly || {}, 'precipitation'),
        temperature_2m: latestHourlyValues(data.hourly || {}, 'temperature_2m')
      },
      source: 'Open-Meteo Agriculture'
    };
  }

  if (domain === 'maritime') {
    const [marine, forecast] = await Promise.all([
      fetchJson<{
        current?: Record<string, number | null>;
        hourly?: Record<string, (number | null)[]>;
      }>(
        `https://api.open-meteo.com/v1/marine?latitude=${latitude}&longitude=${longitude}` +
          '&current=wave_height,wind_wave_height,ocean_current_velocity&hourly=wave_height,wind_wave_height'
      ),
      fetchJson<{
        current?: Record<string, number | null>;
        hourly?: Record<string, (number | null)[]>;
      }>(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
          '&current=wind_speed_10m,wind_direction_10m,temperature_2m&hourly=wind_speed_10m,temperature_2m'
      )
    ]);

    return {
      current: {
        wave_height: currentValue(marine.current || {}, 'wave_height'),
        wind_wave_height: currentValue(marine.current || {}, 'wind_wave_height'),
        ocean_current_velocity: currentValue(marine.current || {}, 'ocean_current_velocity'),
        wind_speed_10m: currentValue(forecast.current || {}, 'wind_speed_10m'),
        wind_direction_10m: currentValue(forecast.current || {}, 'wind_direction_10m'),
        temperature_2m: currentValue(forecast.current || {}, 'temperature_2m')
      },
      hourly: {
        wave_height: latestHourlyValues(marine.hourly || {}, 'wave_height'),
        wind_speed_10m: latestHourlyValues(forecast.hourly || {}, 'wind_speed_10m'),
        temperature_2m: latestHourlyValues(forecast.hourly || {}, 'temperature_2m')
      },
      source: 'Open-Meteo Marine'
    };
  }

  if (domain === 'energy') {
    const data = await fetchJson<{
      current?: Record<string, number | null>;
      hourly?: Record<string, (number | null)[]>;
    }>(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
        '&current=temperature_2m,wind_speed_10m,shortwave_radiation&hourly=shortwave_radiation,wind_speed_10m,temperature_2m'
    );

    return {
      current: {
        temperature_2m: currentValue(data.current || {}, 'temperature_2m'),
        wind_speed_10m: currentValue(data.current || {}, 'wind_speed_10m'),
        shortwave_radiation: currentValue(data.current || {}, 'shortwave_radiation')
      },
      hourly: {
        shortwave_radiation: latestHourlyValues(data.hourly || {}, 'shortwave_radiation'),
        wind_speed_10m: latestHourlyValues(data.hourly || {}, 'wind_speed_10m'),
        temperature_2m: latestHourlyValues(data.hourly || {}, 'temperature_2m')
      },
      source: 'Open-Meteo Energy'
    };
  }

  const data = await fetchJson<{
    current?: Record<string, number | null>;
    hourly?: Record<string, (number | null)[]>;
  }>(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      '&current=temperature_2m,relative_humidity_2m,wind_speed_10m,precipitation&hourly=temperature_2m,wind_speed_10m,precipitation'
  );

  return {
    current: {
      temperature_2m: currentValue(data.current || {}, 'temperature_2m'),
      relative_humidity_2m: currentValue(data.current || {}, 'relative_humidity_2m'),
      wind_speed_10m: currentValue(data.current || {}, 'wind_speed_10m'),
      precipitation: currentValue(data.current || {}, 'precipitation')
    },
    hourly: {
      temperature_2m: latestHourlyValues(data.hourly || {}, 'temperature_2m'),
      wind_speed_10m: latestHourlyValues(data.hourly || {}, 'wind_speed_10m'),
      precipitation: latestHourlyValues(data.hourly || {}, 'precipitation')
    },
    source: 'Open-Meteo Weather'
  };
}
