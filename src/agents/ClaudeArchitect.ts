import type { DashboardLayout, WidgetSpec } from './types';
import { getTelemetrySchema, searchIcons } from './tools';

export class ClaudeArchitect {
  /**
   * Analyzes maritime PRD text and converts it into a structured layout design using Claude.
   */
  async analyzePRD(
    prdText: string,
    apiKey: string | undefined,
    log: (msg: string, type?: 'info' | 'tool_call' | 'tool_response') => void
  ): Promise<DashboardLayout> {
    log('Starting analysis of the Maritime PRD spec...', 'info');
    await new Promise(resolve => setTimeout(resolve, 800));

    if (apiKey && apiKey.trim() !== '') {
      log('Active Claude API Key detected. Delegating analysis to Claude 3.5 Sonnet...', 'info');
      try {
        const result = await this.queryClaudeAPI(prdText, apiKey, log);
        log(`Claude completed analysis. Formulated dashboard layout: "${result.title}" with ${result.widgets.length} components.`, 'info');
        return result;
      } catch (err) {
        log(`Claude API query failed (${err instanceof Error ? err.message : String(err)}). Falling back to local rule-based engine.`, 'info');
      }
    }

    // Rule-based fallback engine (Mock Mode)
    log('Running local rule-based Maritime parsing engine (Claude Mode)...', 'info');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const textLower = prdText.toLowerCase();
    let title = 'Vessel Operations Dashboard';
    let description = 'Real-time telemetry and management controls for maritime operations.';
    let shipType = 'Cargo Vessel';
    let widgets: WidgetSpec[] = [];

    if (textLower.includes('tanker') || textLower.includes('oil') || textLower.includes('cargo temp')) {
      shipType = 'VLCC Oil Tanker';
      title = 'VLCC Tanker Vessel Monitoring System';
      description = 'Critical cargo tank temperature, inert gas pressure, and fuel consumption analytics.';
    } else if (textLower.includes('crew') || textLower.includes('welfare') || textLower.includes('passenger') || textLower.includes('portal')) {
      shipType = 'Passenger Cruise Vessel';
      title = 'Crew Welfare & Watch Portal';
      description = 'Safety status tracker, rest compliance logs, and crew personnel directory.';
    } else if (textLower.includes('ballast') || textLower.includes('water') || textLower.includes('bilge')) {
      shipType = 'Bulk Carrier';
      title = 'Ballast Water & Tank Level Indicator';
      description = 'Real-time tank indicators, pump statuses, and ballast water indicators.';
    } else if (textLower.includes('fuel') || textLower.includes('optimizer') || textLower.includes('efficiency')) {
      shipType = 'Container Carrier';
      title = 'Vessel Fuel & Speed Optimizer';
      description = 'Propulsion efficiency dashboard matching RPM commands with specific fuel flow curves.';
    }

    log(`Identified Context: ${shipType} deployment profile. Invoking Telemetry Schema Tool...`, 'tool_call');
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const schemaFields = getTelemetrySchema(shipType);
    log(`Telemetry Schema Tool returned ${schemaFields.length} recommended data structures.`, 'tool_response');
    
    for (const f of schemaFields) {
      log(`Matching layout widget details for telemetry point "${f.label}"...`, 'info');
      
      let widgetType: WidgetSpec['type'] = 'metric';
      let widgetSize: WidgetSpec['size'] = 'small';
      
      if (f.field === 'gps' || f.field === 'map') {
        widgetType = 'map';
        widgetSize = 'large';
      } else if (f.field === 'fuel_rate' || f.field === 'engine_rpm' || f.field === 'ballast_level' || f.field === 'fuel_level') {
        widgetType = 'gauge';
        widgetSize = 'medium';
      } else if (f.field === 'active_alarms' || f.field === 'alarms') {
        widgetType = 'alert_list';
        widgetSize = 'medium';
      } else if (f.field === 'welfare_status' || f.field === 'fuel_efficiency') {
        widgetType = 'chart';
        widgetSize = 'medium';
      }

      log(`Calling Tool: Icon Selector for keyword "${f.field}"...`, 'tool_call');
      const icons = searchIcons(f.field);
      const chosenIcon = icons[0]?.iconName || 'Gauge';
      log(`Icon Selector Tool matched keyword to icon: "${chosenIcon}" (Confidence: ${icons[0]?.confidence || 0})`, 'tool_response');

      widgets.push({
        id: `widget_${f.field}`,
        type: widgetType,
        title: f.label,
        icon: chosenIcon,
        color: f.color,
        size: widgetSize,
        unit: f.unit,
        value: f.defaultVal,
        threshold: f.min !== f.max ? f.max * 0.85 : undefined,
        options: undefined
      });
    }

    if (!widgets.some(w => w.type === 'alert_list')) {
      widgets.push({
        id: 'widget_alerts',
        type: 'alert_list',
        title: 'Safety & System Alarms',
        icon: 'ShieldAlert',
        color: 'rose',
        size: 'medium',
        value: 'System Normal'
      });
    }

    widgets.push({
      id: 'widget_controls',
      type: 'control_panel',
      title: 'Propulsion Mode Selector',
      icon: 'Radio',
      color: 'indigo',
      size: 'small',
      value: 'Eco Speed',
      options: ['Eco Speed', 'Full Speed', 'Dynamic Positioning', 'Manual Helm']
    });

    log(`Rule-based parsing complete. Proposed layout: "${title}" with ${widgets.length} components.`, 'info');
    
    return {
      title,
      description,
      columns: 3,
      widgets
    };
  }

  private async queryClaudeAPI(prdText: string, apiKey: string, _log: (msg: string) => void): Promise<DashboardLayout> {
    const prompt = `You are a Senior Maritime Software Architect Agent at ThinkPalm.
Analyze the provided Product Requirements Document (PRD) text and design an interactive dashboard layout.

Output a JSON object matching this schema. Return ONLY raw JSON, do NOT wrap it in markdown block quotes:
{
  "title": "dashboard title",
  "description": "dashboard description",
  "columns": 3,
  "widgets": [
    {
      "id": "string",
      "type": "gauge" | "metric" | "chart" | "alert_list" | "control_panel" | "map",
      "title": "string",
      "icon": "string (name of Lucide icon, like Flame, Gauge, Compass, ShieldAlert, Droplets, Users, Map, Wind, Radio, Activity, Database, LifeBuoy, Thermometer)",
      "color": "blue" | "emerald" | "amber" | "rose" | "indigo" | "cyan",
      "size": "small" | "medium" | "large" | "full",
      "unit": "string (optional)",
      "value": "string or number (optional)",
      "threshold": number (optional),
      "options": ["string"] (optional, for control panels)
    }
  ]
}

PRD Spec:
${prdText}`;

    // Note: Due to CORS, local browser testing might need proxy. We use direct fetch here.
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
    const text = data.content?.[0]?.text;
    if (!text) {
      throw new Error('Empty response from Claude API');
    }

    const cleanText = text.replace(/```json/g, '').replace(/```/g, '').trim();
    const result = JSON.parse(cleanText) as DashboardLayout;
    return result;
  }
}
