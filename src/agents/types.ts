export interface WidgetSpec {
  id: string;
  type: 'gauge' | 'metric' | 'chart' | 'alert_list' | 'control_panel' | 'map';
  title: string;
  icon: string;
  color: 'blue' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'cyan';
  size: 'small' | 'medium' | 'large' | 'full';
  unit?: string;
  value?: string | number;
  threshold?: number;
  options?: string[]; // for controls
}

export interface DashboardLayout {
  title: string;
  description: string;
  columns: number;
  widgets: WidgetSpec[];
}

export interface AgentMessage {
  id: string;
  agent: 'Architect' | 'Coder' | 'Inspector' | 'System';
  type: 'info' | 'message' | 'tool_call' | 'tool_response' | 'success' | 'error';
  content: string;
  timestamp: string;
}

export interface LongTermMemoryItem {
  id: string;
  prdTitle: string;
  widgetsCount: number;
  timestamp: string;
  primaryColor: string;
}

export interface PipelineSession {
  status: 'idle' | 'analyzing' | 'coding' | 'verifying' | 'completed' | 'failed';
  currentStep: string;
  logs: AgentMessage[];
  layout?: DashboardLayout;
  code?: string;
}
