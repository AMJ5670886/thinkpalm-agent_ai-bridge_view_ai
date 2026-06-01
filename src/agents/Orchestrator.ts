import { ClaudeArchitect } from './ClaudeArchitect';
import { ClaudeCoder } from './ClaudeCoder';
import { ClaudeInspector } from './ClaudeInspector';
import type { PipelineSession, AgentMessage, LongTermMemoryItem } from './types';

export class Orchestrator {
  private architect = new ClaudeArchitect();
  private coder = new ClaudeCoder();
  private inspector = new ClaudeInspector();

  /**
   * Runs the collaborative agentic pipeline to build a maritime dashboard.
   */
  async runPipeline(
    prdText: string,
    apiKey: string | undefined,
    onStateChange: (session: PipelineSession) => void
  ): Promise<void> {
    const session: PipelineSession = {
      status: 'analyzing',
      currentStep: 'Analyzing Maritime PRD Spec',
      logs: []
    };

    const addLog = (
      agent: AgentMessage['agent'],
      type: AgentMessage['type'],
      content: string
    ) => {
      const newLog: AgentMessage = {
        id: Math.random().toString(36).substring(7),
        agent,
        type,
        content,
        timestamp: new Date().toLocaleTimeString()
      };
      session.logs = [...session.logs, newLog];
      onStateChange({ ...session });
    };

    try {
      addLog('System', 'info', 'Pipeline initialized. Allocating Claude agents...');
      
      // Step 1: Maritime Architect Agent
      session.status = 'analyzing';
      session.currentStep = '1. Structural Analysis (Architect Agent)';
      onStateChange({ ...session });
      
      const layout = await this.architect.analyzePRD(
        prdText,
        apiKey,
        (msg, type = 'info') => addLog('Architect', type, msg)
      );
      
      session.layout = layout;
      addLog('System', 'info', 'Architect Agent completed analysis. Handoff to React Coder Agent...');

      // Step 2: React Coder Agent
      session.status = 'coding';
      session.currentStep = '2. Code Synthesis (Coder Agent)';
      onStateChange({ ...session });

      const rawCode = await this.coder.generateCode(
        layout,
        apiKey,
        (msg, type = 'info') => addLog('Coder', type, msg)
      );

      addLog('System', 'info', 'Coder Agent finished coding. Handoff to UX Inspector Agent...');

      // Step 3: UX Inspector Agent
      session.status = 'verifying';
      session.currentStep = '3. Inspection & Audit (Inspector Agent)';
      onStateChange({ ...session });

      const finalCode = await this.inspector.inspectCode(
        rawCode,
        apiKey,
        (msg, type = 'info') => addLog('Inspector', type, msg)
      );

      session.code = finalCode;
      
      // Step 4: Long-Term Memory Storage
      addLog('System', 'info', 'Updating Long-Term Memory registry...');
      this.saveToLongTermMemory(layout.title, layout.widgets.length, layout.widgets[0]?.color || 'blue');
      addLog('System', 'success', 'Long-term memory updated. Dashboard compilation successful!');

      session.status = 'completed';
      session.currentStep = 'Pipeline Completed';
      onStateChange({ ...session });

    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      addLog('System', 'error', `Pipeline execution failed: ${errMsg}`);
      session.status = 'failed';
      session.currentStep = 'Pipeline Failed';
      onStateChange({ ...session });
    }
  }

  private saveToLongTermMemory(title: string, widgetCount: number, primaryColor: string) {
    try {
      const memoryRaw = localStorage.getItem('bridgeview_mini_ltm');
      const memory: LongTermMemoryItem[] = memoryRaw ? JSON.parse(memoryRaw) : [];
      
      const newItem: LongTermMemoryItem = {
        id: Math.random().toString(36).substring(7),
        prdTitle: title,
        widgetsCount: widgetCount,
        timestamp: new Date().toLocaleString(),
        primaryColor
      };
      
      const updatedMemory = [newItem, ...memory].slice(0, 10);
      localStorage.setItem('bridgeview_mini_ltm', JSON.stringify(updatedMemory));
    } catch (e) {
      console.error('Failed to write to long-term memory:', e);
    }
  }

  static getLongTermMemory(): LongTermMemoryItem[] {
    try {
      const memoryRaw = localStorage.getItem('bridgeview_mini_ltm');
      return memoryRaw ? JSON.parse(memoryRaw) : [];
    } catch {
      return [];
    }
  }

  static clearMemory() {
    try {
      localStorage.removeItem('bridgeview_mini_ltm');
    } catch {}
  }
}
