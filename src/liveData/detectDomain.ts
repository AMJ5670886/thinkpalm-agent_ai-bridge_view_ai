import type { DashboardLayout } from '../agents/types';
import type { GeoLocation, LiveDataDomain } from './types';

const DOMAIN_KEYWORDS: Record<LiveDataDomain, string[]> = {
  maritime: [
    'vessel', 'ship', 'maritime', 'ballast', 'fuel', 'engine', 'propulsion',
    'ais', 'port', 'ferry', 'tanker', 'rpm', 'knots', 'cargo', 'mooring'
  ],
  environmental: [
    'air quality', 'pollution', 'aqi', 'pm2.5', 'pm10', 'environment',
    'smart city', 'urban', 'ozone', 'no2', 'emission'
  ],
  agriculture: [
    'soil', 'crop', 'farm', 'agriculture', 'irrigation', 'harvest', 'field', 'moisture'
  ],
  energy: [
    'energy', 'carbon', 'electricity', 'power', 'solar', 'grid', 'consumption', 'kwh'
  ],
  general: []
};

const DOMAIN_LOCATIONS: Record<LiveDataDomain, GeoLocation> = {
  maritime: { latitude: 24.8, longitude: 56.2, label: 'Arabian Gulf' },
  environmental: { latitude: 13.08, longitude: 80.27, label: 'Chennai' },
  agriculture: { latitude: 11.0, longitude: 76.0, label: 'Coimbatore Region' },
  energy: { latitude: 52.52, longitude: 13.41, label: 'Berlin Grid Zone' },
  general: { latitude: 20.0, longitude: 0.0, label: 'Global' }
};

export function detectDomain(layout: DashboardLayout): LiveDataDomain {
  const text = [
    layout.title,
    layout.description,
    ...layout.widgets.map((w) => `${w.title} ${w.unit || ''}`)
  ]
    .join(' ')
    .toLowerCase();

  const scores = (Object.keys(DOMAIN_KEYWORDS) as LiveDataDomain[])
    .filter((d) => d !== 'general')
    .map((domain) => ({
      domain,
      score: DOMAIN_KEYWORDS[domain].filter((kw) => text.includes(kw)).length
    }))
    .sort((a, b) => b.score - a.score);

  return scores[0]?.score > 0 ? scores[0].domain : 'general';
}

export function getDomainLocation(domain: LiveDataDomain): GeoLocation {
  return DOMAIN_LOCATIONS[domain];
}
