/**
 * Tool 1: Icon Selector Tool
 * Resolves standard Lucide React icons matching a search string.
 */
export function searchIcons(query: string): { iconName: string; confidence: number }[] {
  const lowercaseQuery = query.toLowerCase();
  
  const iconRegistry: { [key: string]: string[] } = {
    Anchor: ['anchor', 'berth', 'port', 'dock', 'vessel', 'ship', 'mooring'],
    Gauge: ['gauge', 'speed', 'rpm', 'pressure', 'flow', 'sensor', 'level'],
    Compass: ['compass', 'heading', 'bearing', 'navigation', 'direction', 'gps', 'route'],
    ShieldAlert: ['alert', 'alarm', 'warning', 'critical', 'danger', 'hazard'],
    Activity: ['activity', 'engine', 'health', 'heartbeat', 'vibration', 'status'],
    Flame: ['fuel', 'oil', 'diesel', 'fire', 'combustion', 'consumption'],
    Droplets: ['water', 'ballast', 'bilge', 'humidity', 'fluid', 'tank'],
    Users: ['crew', 'personnel', 'welfare', 'staff', 'pax', 'captain', 'officer'],
    Map: ['map', 'position', 'coordinates', 'ais', 'route', 'tracker'],
    Wind: ['wind', 'weather', 'sea', 'wave', 'current', 'anemometer'],
    Radio: ['radio', 'vhf', 'communication', 'radar', 'signal', 'gps-receiver'],
    TrendingUp: ['trend', 'efficiency', 'optimization', 'performance', 'history'],
    Database: ['log', 'records', 'database', 'storage', 'data'],
    LifeBuoy: ['safety', 'buoy', 'emergency', 'welfare', 'rescue'],
    Thermometer: ['temp', 'temperature', 'heat', 'engine-temp', 'cooling']
  };

  const matches: { iconName: string; confidence: number }[] = [];

  for (const [icon, keywords] of Object.entries(iconRegistry)) {
    // Exact match
    if (icon.toLowerCase() === lowercaseQuery) {
      matches.push({ iconName: icon, confidence: 1.0 });
      continue;
    }
    
    // Keyword match
    const matchingKeyword = keywords.find(keyword => 
      lowercaseQuery.includes(keyword) || keyword.includes(lowercaseQuery)
    );
    
    if (matchingKeyword) {
      const matchLengthRatio = Math.min(lowercaseQuery.length, matchingKeyword.length) / Math.max(lowercaseQuery.length, matchingKeyword.length);
      matches.push({ 
        iconName: icon, 
        confidence: Number((0.5 + 0.5 * matchLengthRatio).toFixed(2)) 
      });
    }
  }

  // Sort by confidence descending
  const sorted = matches.sort((a, b) => b.confidence - a.confidence);
  
  // Default fallback if no match found
  if (sorted.length === 0) {
    return [{ iconName: 'HelpCircle', confidence: 0.1 }];
  }

  return sorted;
}

const REACT_NON_LUCIDE_COMPONENTS = new Set(['Fragment', 'Suspense', 'Profiler', 'StrictMode']);

/**
 * Ensures every PascalCase JSX component used in the file is imported from lucide-react.
 * Fixes StackBlitz/runtime errors such as "Anchor is not defined".
 */
export function ensureLucideImports(code: string): string {
  const usedIcons = new Set<string>();
  const jsxComponentRegex = /<([A-Z][a-zA-Z0-9]*)\b/g;
  let match: RegExpExecArray | null;
  while ((match = jsxComponentRegex.exec(code)) !== null) {
    const name = match[1];
    if (!REACT_NON_LUCIDE_COMPONENTS.has(name)) {
      usedIcons.add(name);
    }
  }

  if (usedIcons.size === 0) {
    return code;
  }

  const importMatch = code.match(/import\s*\{([^}]*)\}\s*from\s*['"]lucide-react['"]/);
  const imported = new Set<string>();
  if (importMatch) {
    for (const part of importMatch[1].split(',')) {
      const name = part.trim().split(/\s+as\s+/)[0].trim();
      if (name) {
        imported.add(name);
      }
    }
  }

  const allIcons = [...new Set([...imported, ...usedIcons])].sort();
  const importBlock = `import {\n  ${allIcons.join(',\n  ')}\n} from 'lucide-react';`;

  if (importMatch) {
    return code.replace(/import\s*\{[^}]*\}\s*from\s*['"]lucide-react['"]\s*;?/, importBlock);
  }

  const reactImport = code.match(/^import\s+.+from\s+['"]react['"];?\s*$/m);
  if (reactImport && reactImport.index !== undefined) {
    const insertAt = reactImport.index + reactImport[0].length;
    return code.slice(0, insertAt) + `\n${importBlock}` + code.slice(insertAt);
  }

  return `${importBlock}\n\n${code}`;
}

/**
 * Tool 2: Vessel Telemetry Schema Tool
 * Returns standardized telemetry data structure and metrics depending on the vessel type.
 */
export interface TelemetryField {
  field: string;
  label: string;
  unit: string;
  defaultVal: number | string;
  min: number;
  max: number;
  color: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'cyan';
}

export function getTelemetrySchema(vesselType: string): TelemetryField[] {
  const type = vesselType.toLowerCase();
  
  const commonFields: TelemetryField[] = [
    { field: 'speed', label: 'Speed Over Ground', unit: 'knots', defaultVal: 14.2, min: 0, max: 25, color: 'cyan' },
    { field: 'heading', label: 'True Heading', unit: '°', defaultVal: 184, min: 0, max: 359, color: 'blue' },
    { field: 'gps', label: 'Position (GPS)', unit: 'lat/lon', defaultVal: '24°48\'N, 056°22\'E', min: 0, max: 0, color: 'indigo' }
  ];

  if (type.includes('tanker') || type.includes('oil') || type.includes('gas')) {
    return [
      ...commonFields,
      { field: 'fuel_rate', label: 'Fuel Oil Flow Rate', unit: 'L/h', defaultVal: 480, min: 0, max: 1200, color: 'amber' },
      { field: 'cargo_temp', label: 'Cargo Tank Temp', unit: '°C', defaultVal: 38.5, min: -10, max: 60, color: 'emerald' },
      { field: 'inert_gas', label: 'Inert Gas Pressure', unit: 'kPa', defaultVal: 4.2, min: 0, max: 10, color: 'blue' },
      { field: 'ballast_level', label: 'Ballast Water Level', unit: '%', defaultVal: 45, min: 0, max: 100, color: 'cyan' }
    ];
  } else if (type.includes('crew') || type.includes('welfare') || type.includes('passenger') || type.includes('ferry')) {
    return [
      ...commonFields,
      { field: 'crew_active', label: 'Crew On Duty', unit: 'pax', defaultVal: 18, min: 0, max: 50, color: 'emerald' },
      { field: 'welfare_status', label: 'Crew Rest Hours Compliance', unit: '%', defaultVal: 98, min: 0, max: 100, color: 'emerald' },
      { field: 'fresh_water', label: 'Fresh Water Level', unit: 'm³', defaultVal: 124, min: 0, max: 200, color: 'cyan' },
      { field: 'active_alarms', label: 'Safety Incidents Logged', unit: 'alerts', defaultVal: 0, min: 0, max: 10, color: 'rose' }
    ];
  } else if (type.includes('container') || type.includes('cargo')) {
    return [
      ...commonFields,
      { field: 'fuel_efficiency', label: 'Specific Fuel Consumption', unit: 'g/kWh', defaultVal: 165, min: 100, max: 250, color: 'amber' },
      { field: 'reefer_temp', label: 'Active Reefer Temperature', unit: '°C', defaultVal: -18.2, min: -25, max: 10, color: 'emerald' },
      { field: 'roll_angle', label: 'Vessel Roll Angle', unit: '°', defaultVal: 1.8, min: -15, max: 15, color: 'indigo' },
      { field: 'trim', label: 'Vessel Trim', unit: 'm', defaultVal: 0.8, min: -5, max: 5, color: 'blue' }
    ];
  }

  // Default cargo ship telemetries
  return [
    ...commonFields,
    { field: 'engine_rpm', label: 'Main Engine Speed', unit: 'RPM', defaultVal: 82, min: 0, max: 120, color: 'blue' },
    { field: 'fuel_level', label: 'Main Fuel Tank Level', unit: '%', defaultVal: 72.4, min: 0, max: 100, color: 'amber' },
    { field: 'generator_power', label: 'Aux Power Output', unit: 'kW', defaultVal: 340, min: 0, max: 1000, color: 'emerald' }
  ];
}
