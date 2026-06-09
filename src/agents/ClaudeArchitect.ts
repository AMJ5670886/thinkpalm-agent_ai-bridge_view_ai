import type { DashboardLayout } from './types';
import { parsePRD } from './PrdParser';
import { queryGroq, stripMarkdownFences } from './groqApi';

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
      log('Active Groq API Key detected. Delegating analysis to Groq (Llama 3.3 70B)...', 'info');
      try {
        const result = await this.queryGroqAPI(prdText, apiKey, log);
        log(`Groq completed analysis. Formulated dashboard layout: "${result.title}" with ${result.widgets.length} components.`, 'info');
        return result;
      } catch (err) {
        log(`Groq API query failed (${err instanceof Error ? err.message : String(err)}). Falling back to local rule-based engine.`, 'info');
      }
    }

    // Rule-based fallback: parse widgets directly from user-entered PRD
    log('Running local PRD parsing engine (simulation mode)...', 'info');
    await new Promise(resolve => setTimeout(resolve, 1000));

    const parsed = parsePRD(prdText);

    if (parsed.widgets.length === 0) {
      throw new Error(
        'No widgets found in PRD. Add bullet points under "UI Widgets Required" describing each gauge, chart, metric, alert list, or control panel.'
      );
    }

    for (const widget of parsed.widgets) {
      log(`Parsed PRD widget: "${widget.title}" (${widget.type})`, 'info');
    }

    log(`PRD parsing complete. Layout: "${parsed.title}" with ${parsed.widgets.length} components from your requirements.`, 'info');

    return {
      title: parsed.title,
      description: parsed.description,
      columns: 3,
      widgets: parsed.widgets
    };
  }

  private async queryGroqAPI(prdText: string, apiKey: string, _log: (msg: string) => void): Promise<DashboardLayout> {
    const prompt = `You are a Senior Maritime Software Architect Agent at ThinkPalm.
Analyze the provided Product Requirements Document (PRD) text and design an interactive dashboard layout.

CRITICAL: The output MUST strictly match the user's PRD. Only include widgets explicitly listed in the PRD.
Do NOT add default widgets, extra controls, or telemetry not mentioned in the requirements.
Extract the dashboard title from the "System:" line and the description from the "Purpose" section.
For each bullet under "UI Widgets Required", create exactly one matching widget with the correct type, unit, color, range, threshold, and options as specified.

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

    const text = await queryGroq(prompt, apiKey);
    const cleanText = stripMarkdownFences(text, 'json');
    const result = JSON.parse(cleanText) as DashboardLayout;
    return result;
  }
}
