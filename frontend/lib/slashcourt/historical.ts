import type { CaseBundle, CourtCase, EvidenceItem, VaultApplication } from "./types";

const operator = "0xdb433ff614bdd1ece21aa97221c3e0a7ecf79c92";
const beneficiary = "0x2c8eb5db1105a85be66badafed88d10cf393cdd8";
const fixtureBase = "https://slash-court.vercel.app/evidence-fixtures";
const dutyDeadline = "2026-09-06T22:39:19Z";

const scenarios = {
  "case-1": {
    commitmentId: "demo-misconduct-20260906",
    claim: "Signed execution attestations conflict and the submitted target is unauthorized.",
    classification: "PROVABLE_MISCONDUCT",
    outcome: "FULL_SLASH",
    rules: ["R2", "R5"],
    fixture: "provable-misconduct.txt",
    hash: "sha256:32ab39dfa4f3085aebfd4139001a6d7541380945823b6e0a4dc6aebe29984f64",
    fact: "Signed execution attestations conflict and the submitted target is unauthorized.",
    explanation: "The finalized manifest records provable misconduct and the deterministic full-penalty outcome.",
    penaltyBps: 10_000,
    penalty: "1000000000000000000",
    award: "800000000000000000",
    safety: "200000000000000000",
  },
  "case-2": {
    commitmentId: "demo-negligence-20260906",
    claim: "The primary RPC failed while the configured secondary remained available; no failover attempt was evidenced.",
    classification: "NEGLIGENT_FAILURE",
    outcome: "PARTIAL_SLASH",
    rules: ["R1", "R3"],
    fixture: "negligent-failure.txt",
    hash: "sha256:9e9220900a2c6f44d32fddb8e1ac208646fca106f216537f7f1a7b0300873b97",
    fact: "The primary provider incident overlaps the duty deadline while the configured secondary remained available.",
    explanation: "The finalized manifest records negligent failure and the deterministic partial-penalty outcome.",
    penaltyBps: 5_000,
    penalty: "500000000000000000",
    award: "400000000000000000",
    safety: "100000000000000000",
  },
  "case-3": {
    commitmentId: "demo-outage-20260906",
    claim: "Independent records describe a widespread outage and unavailable failover infrastructure.",
    classification: "EXTERNAL_OUTAGE",
    outcome: "NO_SLASH",
    rules: ["R1", "R4"],
    fixture: "external-outage.txt",
    hash: "sha256:fbec80b52824fa1f69220403343462e0db60a4defe1d475105dcdaec1f82a97b",
    fact: "Primary and secondary providers report the same regional incident and failover was unavailable.",
    explanation: "The finalized manifest records an external outage and the deterministic no-penalty outcome.",
    penaltyBps: 0,
    penalty: "0",
    award: "0",
    safety: "0",
  },
  "case-4": {
    commitmentId: "demo-insufficient-20260906",
    claim: "The supplied public report is incomplete and does not identify the responsible party.",
    classification: "INSUFFICIENT_EVIDENCE",
    outcome: "NO_SLASH",
    rules: ["R1"],
    fixture: "insufficient-evidence.txt",
    hash: "sha256:582b1b139702b6f3c883e29b84f1da288a571b348a2404276d9d81d06c902d02",
    fact: "The public report is incomplete and does not identify the responsible party.",
    explanation: "The finalized manifest records insufficient evidence and the deterministic no-penalty outcome.",
    penaltyBps: 0,
    penalty: "0",
    award: "0",
    safety: "0",
  },
} as const;

export function historicalArtifactBundle(caseId: string): CaseBundle | null {
  const scenario = scenarios[caseId as keyof typeof scenarios] as (typeof scenarios)[keyof typeof scenarios] | undefined;
  if (!scenario) return null;
  const evidence: EvidenceItem = {
    evidence_id: `${caseId}-fixture`,
    evidence_type: "SYNTHETIC_DEMO_FIXTURE",
    party: "CLAIMANT",
    submission_party: "CLAIMANT",
    url: `${fixtureBase}/${scenario.fixture}`,
    source_domain: "slash-court.vercel.app",
    published_at: "",
    observed_at: dutyDeadline,
    fact: scenario.fact,
    claimed_fact: scenario.fact,
    content_hash: scenario.hash,
    relevant_rule_ids: [...scenario.rules],
  };
  const record: CourtCase = {
    case_id: caseId,
    commitment_id: scenario.commitmentId,
    claimant: beneficiary,
    respondent: operator,
    claim: scenario.claim,
    alleged_rule_ids: [...scenario.rules],
    claimant_evidence: [evidence],
    operator_evidence: [],
    operator_response: "",
    claimed_exemption: "",
    mitigation_attempts: "",
    rulebook_version: 1,
    commitment_exposure: "1000000000000000000",
    response_deadline: "",
    status: "PENALTY_APPLIED",
    network_status: "FINALIZED",
    evidence_frozen: true,
    frozen_at: "",
    deterministic_facts: {},
    classification: scenario.classification,
    outcome: scenario.outcome,
    violated_rule_ids: [],
    supported_exemptions: [],
    findings: [],
    explanation: scenario.explanation,
    penalty_bps: scenario.penaltyBps,
    penalty_amount: scenario.penalty,
    application_status: "APPLIED_FINALIZED",
    adjudication_finalized: true,
    appeal_guidance: "Finalized historical transaction",
    opened_at: "",
  };
  const application: VaultApplication = {
    case_id: caseId,
    commitment_id: scenario.commitmentId,
    classification: scenario.classification,
    penalty_bps: scenario.penaltyBps,
    penalty_amount: scenario.penalty,
    beneficiary_award: scenario.award,
    safety_pool_amount: scenario.safety,
    beneficiary,
    applied: true,
    alleged_rule_ids: [...scenario.rules],
    evidence_citations: [],
  };
  const artifactError = { kind: "network" as const, message: "Live historical reads are unavailable; showing the checked deployment manifest and fixture digest." };
  return {
    caseRecord: { data: record, state: "error", error: artifactError, updatedAt: null },
    application: { data: application, state: "error", error: artifactError, updatedAt: null },
  };
}
