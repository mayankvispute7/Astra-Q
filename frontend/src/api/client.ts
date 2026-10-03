/**
 * ASTRA-Q REST API Client
 */

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';

export interface PipelineStage {
  stage: string;
  status: string;
  duration_ms: number;
  details?: any;
  log?: string[];
  dataset_status?: string;
  lot_baseline?: any;
}

export interface PipelineSummary {
  total_components: number;
  normal: number;
  investigate: number;
  system_suspect: number;
  insufficient_evidence: number;
  common_mode_patterns: number;
  population_shift: boolean;
  investigate_components: string[];
  system_suspect_components: string[];
  insufficient_evidence_components: string[];
}

export interface RunAnalysisResponse {
  status: string;
  pipeline_stages: PipelineStage[];
  summary: PipelineSummary;
}

export interface ComponentItem {
  component_id: string;
  lot_id: string;
  board_id: string;
  channel_id: string;
  current_value: number;
  spec_pass: boolean;
  lot_deviation: number;
  robust_z: number;
  screen_status: string;
  drift_class: string;
  drift_confidence: string;
  slope: number | null;
  forecast_value: number | null;
  forecast_risk: string;
  attribution: string;
  attribution_confidence: string;
  validation_status: string;
  overall_status: string;
}

export interface ComponentListResponse {
  components: ComponentItem[];
  lot_baseline: any;
  total: number;
}

export interface ComponentDetailResponse {
  component_id: string;
  screening: any;
  drift: any;
  forecast: any;
  attribution: any;
  validation: string;
  historical_range: { low: number | null; high: number | null };
  evidence: any;
  saved_decision: any;
}

export interface DecisionPayload {
  component_id: string;
  decision: 'ACCEPT' | 'HOLD' | 'RETEST' | 'REJECT' | 'ESCALATE';
  rationale: string;
  engineer?: string;
}

export const api = {
  async runAnalysis(): Promise<RunAnalysisResponse> {
    const res = await fetch(`${API_BASE}/analysis/run`, { method: 'POST' });
    if (!res.ok) throw new Error(`Analysis failed: ${res.statusText}`);
    return res.json();
  },

  async getComponents(): Promise<ComponentListResponse> {
    const res = await fetch(`${API_BASE}/components`);
    if (!res.ok) throw new Error(`Failed to fetch components: ${res.statusText}`);
    return res.json();
  },

  async getComponentDetail(componentId: string): Promise<ComponentDetailResponse> {
    const res = await fetch(`${API_BASE}/components/${componentId}`);
    if (!res.ok) throw new Error(`Failed to fetch component detail: ${res.statusText}`);
    return res.json();
  },

  async submitDecision(payload: DecisionPayload): Promise<any> {
    const res = await fetch(`${API_BASE}/decisions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) throw new Error(`Failed to save decision: ${res.statusText}`);
    return res.json();
  },

  async getDecisions(): Promise<{ decisions: any[]; total: number }> {
    const res = await fetch(`${API_BASE}/decisions`);
    if (!res.ok) throw new Error(`Failed to fetch decisions: ${res.statusText}`);
    return res.json();
  },

  async getHistorical(): Promise<any> {
    const res = await fetch(`${API_BASE}/historical`);
    if (!res.ok) throw new Error(`Failed to fetch historical: ${res.statusText}`);
    return res.json();
  },

  async getAttribution(): Promise<any> {
    const res = await fetch(`${API_BASE}/attribution`);
    if (!res.ok) throw new Error(`Failed to fetch attribution: ${res.statusText}`);
    return res.json();
  },

  async getValidationLab(): Promise<any> {
    const res = await fetch(`${API_BASE}/validation-lab`);
    if (!res.ok) throw new Error(`Failed to fetch validation: ${res.statusText}`);
    return res.json();
  },

  async resetScenario(): Promise<any> {
    const res = await fetch(`${API_BASE}/scenarios/reset`, { method: 'POST' });
    if (!res.ok) throw new Error(`Failed to reset scenario: ${res.statusText}`);
    return res.json();
  },
};
