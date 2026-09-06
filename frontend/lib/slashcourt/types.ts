export type CaseStatus =
  | "OPEN"
  | "AWAITING_RESPONSE"
  | "READY_FOR_ADJUDICATION"
  | "ADJUDICATING"
  | "RESOLUTION_RECORDED"
  | "APPLICATION_QUEUED"
  | "PENALTY_APPLIED"
  | "CANCELLED"
  | string;

export type CourtCase = {
  case_id: string;
  commitment_id: string;
  claimant: string;
  respondent: string;
  claim: string;
  alleged_rule_ids: string[];
  claimant_evidence: EvidenceItem[];
  operator_evidence: EvidenceItem[];
  operator_response: string;
  claimed_exemption: string;
  mitigation_attempts: string;
  rulebook_version: number;
  commitment_exposure: number;
  response_deadline: string;
  status: CaseStatus;
  network_status: string;
  evidence_frozen: boolean;
  frozen_at: string;
  deterministic_facts: Record<string, unknown>;
  classification: string;
  outcome: string;
  violated_rule_ids: string[];
  supported_exemptions: string[];
  findings: string[];
  explanation: string;
  penalty_bps: number;
  penalty_amount: number;
  application_status: string;
  appeal_guidance: string;
  opened_at: string;
};

export type EvidenceItem = {
  evidence_id: string;
  evidence_type?: string;
  party: string;
  submission_party?: string;
  url: string;
  source_domain: string;
  published_at: string;
  observed_at: string;
  fact: string;
  claimed_fact?: string;
  content_hash: string;
};

export type Rulebook = {
  version: number;
  rulebook_text: string;
  rulebook_hash: string;
  created_by: string;
  full_slash_bps: number;
  partial_slash_bps: number;
  no_slash_bps: number;
  beneficiary_share_bps: number;
  safety_pool_share_bps: number;
  rule_ids: string[];
  created_at: string;
};

export type CourtStatistics = {
  total_cases: number;
  open_cases: number;
  ready_cases: number;
  applied_cases: number;
  cancelled_cases: number;
  provable_misconduct: number;
  negligent_failure: number;
  external_outage: number;
  insufficient_evidence: number;
  current_rulebook_version: number;
};

export type OperatorState = {
  address: string;
  registered: boolean;
  metadata_uri: string;
  total_bond: number;
  available_bond: number;
  locked_exposure: number;
  claimable_awards: number;
  active_commitments: number;
  resolved_commitments: number;
};

export type VaultConfiguration = {
  governor: string;
  slash_court: string;
  court_configured: boolean;
  full_slash_bps: number;
  partial_slash_bps: number;
  beneficiary_share_bps: number;
  safety_pool_share_bps: number;
};

export type VaultStatistics = {
  total_operators: number;
  total_bond: number;
  available_bond: number;
  locked_exposure: number;
  total_penalties_applied: number;
  safety_pool_balance: number;
};

export type Dashboard = {
  statistics: CourtStatistics;
  rulebook: Rulebook | null;
  domains: string[];
  cases: CourtCase[];
  operator: OperatorState | null;
  vault: VaultConfiguration | null;
  vaultStatistics: VaultStatistics | null;
  network: string;
};

export type TxSnapshot = {
  hash: string;
  status: string;
  execution: string;
  appealable: boolean;
};
