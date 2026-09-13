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
  commitment_exposure: string;
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
  findings: Finding[];
  adjudication_evidence?: EvidenceCitation[];
  canonical_commitment?: CanonicalCommitment;
  explanation: string;
  penalty_bps: number;
  penalty_amount: string;
  application_status: string;
  adjudication_finalized?: boolean;
  appeal_guidance: string;
  opened_at: string;
};

export type Finding = {
  evidence_id: string;
  rule_id: string;
  finding: string;
  submission_party?: "CLAIMANT" | "OPERATOR";
  evidence_type?: string;
  source_domain?: string;
  content_hash?: string;
  relevant_rule_ids?: string[];
};

export type EvidenceCitation = {
  evidence_id: string;
  evidence_type: string;
  submission_party: "CLAIMANT" | "OPERATOR";
  source_domain: string;
  content_hash: string;
  relevant_rule_ids: string[];
};

export type CanonicalCommitment = {
  commitment_id: string;
  operator: string;
  beneficiary: string;
  service_description: string;
  duty_trigger: string;
  duty_deadline: string;
  dispute_deadline: string;
  expected_action_id: string;
  rulebook_version: number;
  locked_exposure: string;
  commitment_digest: string;
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
  relevant_rule_ids?: string[];
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
  total_bond: string;
  available_bond: string;
  locked_exposure: string;
  claimable_awards: string;
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
  total_bond: string;
  available_bond: string;
  locked_exposure: string;
  total_penalties_applied: string;
  safety_pool_balance: string;
};

export type VaultApplication = {
  case_id: string;
  commitment_id?: string;
  classification?: string;
  penalty_bps?: number;
  penalty_amount?: string;
  beneficiary_award?: string;
  safety_pool_amount?: string;
  beneficiary?: string;
  applied: boolean;
  commitment_digest?: string;
  alleged_rule_ids?: string[];
  evidence_citations?: EvidenceCitation[];
};

export type CaseIndex = {
  ids: string[];
  total: number;
  offset: number;
  limit: number;
};

export type ReadSlice<T> = {
  data: T | null;
  state: "idle" | "success" | "error";
  error: import("./refresh").ReadFailure | null;
  updatedAt: number | null;
};

export type Dashboard = {
  statistics: ReadSlice<CourtStatistics>;
  rulebook: ReadSlice<Rulebook | null>;
  domains: ReadSlice<string[]>;
  caseIndex: ReadSlice<CaseIndex>;
  operator: ReadSlice<OperatorState>;
  vault: ReadSlice<VaultConfiguration>;
  vaultStatistics: ReadSlice<VaultStatistics>;
  network: string;
  attemptedAt: number;
};

export type CaseBundle = {
  caseRecord: ReadSlice<CourtCase>;
  application: ReadSlice<VaultApplication>;
};

export type AppealEligibility = "unknown" | "eligible" | "ineligible";

export type TxSnapshot = {
  hash: string;
  status: string;
  execution: string;
  /** Backward-compatible mirror for deployment-scoped browser history. */
  appealable: boolean;
  appealEligibility?: AppealEligibility;
  appealEligibilityError?: string;
  success: boolean;
  kind: "operator" | "intake" | "response" | "ready" | "adjudication" | "retry" | "appeal";
  error?: string;
  updatedAt: number;
};
