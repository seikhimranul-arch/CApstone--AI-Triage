export interface PatientFile {
  filename: string;
  archetype: string;
  id: string;
  name?: string;
  age?: number;
  gender?: string;
  abha_id?: string;
  phone?: string;
  address?: string;
}

export interface PatientSummary {
  patient_id: string;
  one_liner: string;
  active_problems: Array<{ code?: string; display?: string; clinical_status?: string }>;
  red_flags: Array<{ type: string; key: string; message: string; value?: number; unit?: string; threshold?: number }>;
  chronic_snapshot: Record<string, unknown>;
  medications: Array<{ name: string; dose: string; status?: string }>;
  missing_data: string[];
  encounter_count: number;
  last_encounter_days: number | null;
}

export interface TriageDifferentialResponse {
  success: boolean;
  differential: Array<{
    rank: number;
    icd11_code: string;
    display: string;
    probability: "high" | "moderate" | "low";
    reasoning: string;
    supporting_evidence: string[];
    contradicting_evidence: string[];
    urgency: "emergent" | "urgent" | "routine";
  }>;
  red_flags: Array<{
    type: string;
    key: string;
    message: string;
    value?: number;
    unit?: string;
    threshold?: number;
  }>;
  suggested_actions: Array<{
    type: "question" | "test" | "referral";
    priority: "high" | "medium" | "low";
    description: string;
    rationale: string;
    icd11_link: string[];
  }>;
  clinical_summary: string;
  block_reason: string | null;
  model_used: string;
}

export interface Conflict {
  conflict_id: string;
  type: string;
  severity: "flag" | "warn" | "block";
  message: string;
  intake_value?: unknown;
  history_value?: unknown;
  disclaimer?: string;
  requires_acknowledgment: boolean;
  created_at: string;
}

export interface OverrideLog {
  override_id: string;
  differential_id: string;
  original_rank: number;
  icd11_code: string;
  action: "accept" | "reject" | "reorder" | "add";
  doctor_reason: string;
  timestamp: string;
}

export interface AbhaProfile {
  name: string;
  age: number;
  gender: string;
  phone: string;
  address: string;
  blood_group?: string;
  email?: string;
}

export interface LinkedRecord {
  type: string;
  date: string;
  provider: string;
  summary: string;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}
