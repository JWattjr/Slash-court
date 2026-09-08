"use client";

import {
  Activity,
  AlertTriangle,
  ArrowUpRight,
  BookOpen,
  Check,
  ChevronRight,
  CircleDollarSign,
  Database,
  FileSearch,
  Gavel,
  Link2,
  LoaderCircle,
  LockKeyhole,
  Menu,
  RefreshCw,
  Scale,
  ShieldCheck,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import { useWallet, formatAddress } from "@/lib/genlayer/WalletProvider";
import { deploymentConfiguration, formatGenAmount, missingConfigurationKeys, SlashCourtClient } from "@/lib/slashcourt/client";
import { historicalArtifactBundle } from "@/lib/slashcourt/historical";
import { MAX_AUTOMATIC_REFRESHES, nextRefreshDelay } from "@/lib/slashcourt/refresh";
import { findAppealableAdjudication, mergeTransaction, transactionStorageKey } from "@/lib/slashcourt/transactions";
import type { CaseBundle, CourtCase, Dashboard, ReadSlice, TxSnapshot } from "@/lib/slashcourt/types";

const EMPTY_FORM = {
  commitmentId: "",
  claim: "",
  evidenceId: "",
  evidenceUrl: "https://slash-court.vercel.app/evidence-fixtures/insufficient-evidence.txt",
  evidenceDomain: "",
  evidenceFact: "The primary provider reported an incident during the duty window.",
  contentHash: "",
};

const PRESETS = {
  misconduct: {
    commitmentId: "keeper-prod-001",
    claim: "The keeper submitted an unauthorized payload and then reported a successful execution.",
    evidenceId: "misconduct-01",
    evidenceUrl: "https://slash-court.vercel.app/evidence-fixtures/provable-misconduct.txt",
    evidenceDomain: "slash-court.vercel.app",
    evidenceFact: "A signed execution receipt shows a destination and action different from the authorized payload.",
  },
  negligence: {
    commitmentId: "keeper-prod-001",
    claim: "The primary RPC failed while the configured secondary remained available, but no failover attempt was recorded.",
    evidenceId: "negligence-01",
    evidenceUrl: "https://slash-court.vercel.app/evidence-fixtures/negligent-failure.txt",
    evidenceDomain: "slash-court.vercel.app",
    evidenceFact: "The primary provider incident overlaps the duty deadline and the secondary provider remained available.",
  },
  outage: {
    commitmentId: "keeper-prod-001",
    claim: "The scheduled duty was missed while the upstream RPC provider was broadly unavailable.",
    evidenceId: "outage-01",
    evidenceUrl: "https://slash-court.vercel.app/evidence-fixtures/external-outage.txt",
    evidenceDomain: "slash-court.vercel.app",
    evidenceFact: "The provider status incident overlaps the scheduled duty window and records a regional outage.",
  },
  uncertainty: {
    commitmentId: "keeper-prod-001",
    claim: "The claimant cannot establish the failure with independently verifiable evidence.",
    evidenceId: "uncertainty-01",
    evidenceUrl: "https://slash-court.vercel.app/evidence-fixtures/insufficient-evidence.txt",
    evidenceDomain: "slash-court.vercel.app",
    evidenceFact: "The supplied report is incomplete and does not establish a duty breach or a covered outage.",
  },
};

const HISTORICAL_DEPLOYMENT = {
  courtAddress: "0x576Bef923bbDd6ACb6aA7b5D183FF277abeFbf8e",
  vaultAddress: "0x95E438A856c70a138824c37F937e0f436461625B",
};

const HISTORICAL_CASES = [
  { caseId: "case-1", label: "Misconduct", transaction: "0x690df6e61ba56a7aed60cfb5290969810d01bcac482b91c9928daedeff3f45e7" },
  { caseId: "case-2", label: "Negligence", transaction: "0x2fca7b681784f8281612b077dc2e2eb3c1dbdf8adc552d7f5014a1648480f19f" },
  { caseId: "case-3", label: "External outage", transaction: "0xcc9b9eb38a760491f401d16f66f2e8cda2986505e10d88d8827768062957b589" },
  { caseId: "case-4", label: "Insufficient evidence", transaction: "0x52f11c2cbe1fef269be0e22d7892891395754e967066bed1453edc35002d4eb2" },
] as const;

type ActiveView = "Home" | "Explorer" | "Submit" | "Operate";
type CaseSource = "current" | "historical";
type DashboardHealth = "loading" | "fresh" | "partial" | "stale" | "unavailable";

function preserveSlice<T>(previous: ReadSlice<T> | undefined, next: ReadSlice<T>): ReadSlice<T> {
  if (next.state === "success" || !previous?.data) return next;
  return { ...next, data: previous.data, updatedAt: previous.updatedAt };
}

function mergeDashboard(previous: Dashboard | null, next: Dashboard): Dashboard {
  if (!previous) return next;
  return {
    ...next,
    statistics: preserveSlice(previous.statistics, next.statistics),
    rulebook: preserveSlice(previous.rulebook, next.rulebook),
    domains: preserveSlice(previous.domains, next.domains),
    caseIndex: preserveSlice(previous.caseIndex, next.caseIndex),
    operator: preserveSlice(previous.operator, next.operator),
    vault: preserveSlice(previous.vault, next.vault),
    vaultStatistics: preserveSlice(previous.vaultStatistics, next.vaultStatistics),
  };
}

function dashboardHealth(dashboard: Dashboard | null, loading: boolean): DashboardHealth {
  if (!dashboard) return loading ? "loading" : "unavailable";
  const slices = [dashboard.statistics, dashboard.rulebook, dashboard.domains, dashboard.caseIndex, dashboard.vault, dashboard.vaultStatistics];
  const failures = slices.filter((slice) => slice.state === "error").length;
  if (failures === 0) return "fresh";
  const retained = slices.some((slice) => slice.state === "error" && slice.data !== null);
  if (failures === slices.length) return retained ? "stale" : "unavailable";
  return "partial";
}

function amount(value: string | bigint | undefined | null) {
  return formatGenAmount(value);
}

async function sha256Text(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return `sha256:${Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("")}`;
}

async function evidenceHash(url: string, supplied: string) {
  if (supplied.trim()) return supplied.trim();
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error(`Evidence fetch returned HTTP ${response.status}. Provide a real SHA-256 hash or use a reachable fixture.`);
  return sha256Text(await response.text());
}

async function makeEvidenceItem(data: { evidenceId: string; evidenceType: string; url: string; sourceDomain: string; claimedFact: string; contentHash?: string; relevantRuleIds: string[] }) {
  const url = data.url.trim();
  const contentHash = await evidenceHash(url, data.contentHash || "");
  return {
    evidence_id: data.evidenceId.trim() || `evidence-${contentHash.slice(-12)}`,
    evidence_type: data.evidenceType,
    url,
    source_domain: data.sourceDomain.trim().toLowerCase() || new URL(url).hostname.toLowerCase(),
    claimed_fact: data.claimedFact.trim(),
    content_hash: contentHash,
    relevant_rule_ids: data.relevantRuleIds,
  };
}

function shortText(value: string, length = 42) {
  return value.length > length ? `${value.slice(0, length - 1)}…` : value;
}

function dateLabel(value: string) {
  if (!value || value.startsWith("1970-01-01")) return "transaction time pending";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value.slice(0, 16) : date.toLocaleString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function statusTone(value: string) {
  if (["PENALTY_APPLIED", "FINALIZED"].includes(value)) return "green";
  if (["RESOLUTION_RECORDED", "APPLICATION_QUEUED", "ACCEPTED_PROVISIONAL", "CONSENSUS_PENDING"].includes(value)) return "amber";
  if (["ADJUDICATING"].includes(value)) return "purple";
  if (["CANCELLED"].includes(value)) return "red";
  if (["AWAITING_RESPONSE", "READY_FOR_ADJUDICATION"].includes(value)) return "cyan";
  return "slate";
}

function prettyStatus(value: string) {
  const labels: Record<string, string> = {
    ACCEPTED_PROVISIONAL: "Appeal window",
    CONSENSUS_PENDING: "Under review",
    INSUFFICIENT_EVIDENCE: "Evidence missing",
    PENALTY_APPLIED: "Settlement applied",
    READY_FOR_ADJUDICATION: "Ready for review",
    RESOLUTION_RECORDED: "Decision recorded",
  };
  if (labels[value]) return labels[value];
  return value.replaceAll("_", " ").toLowerCase().replace(/(^| )\S/g, (letter) => letter.toUpperCase());
}

function outcomeLabel(value: string) {
  if (value === "FULL_SLASH") return "Full bond penalty";
  if (value === "PARTIAL_SLASH") return "Partial bond penalty";
  if (value === "NO_SLASH") return "No penalty";
  return prettyStatus(value);
}

function outcomeTone(value: string) {
  if (value === "FULL_SLASH") return "red";
  if (value === "PARTIAL_SLASH") return "amber";
  return "green";
}

function caseSteps(item: CourtCase) {
  const final = item.status === "PENALTY_APPLIED" && item.network_status === "FINALIZED";
  const frozen = item.evidence_frozen;
  const adjudicating = ["ADJUDICATING", "RESOLUTION_RECORDED", "APPLICATION_QUEUED", "PENALTY_APPLIED"].includes(item.status);
  const response = item.status !== "OPEN" && item.status !== "AWAITING_RESPONSE";
  return [
    { label: "Intake", done: true, current: item.status === "OPEN" },
    { label: "Response", done: response, current: item.status === "AWAITING_RESPONSE" },
    { label: "Frozen", done: frozen, current: item.status === "READY_FOR_ADJUDICATION" },
    { label: "Consensus", done: adjudicating, current: item.status === "ADJUDICATING" },
    { label: "Finality", done: final, current: item.status === "RESOLUTION_RECORDED" || item.status === "APPLICATION_QUEUED" },
  ];
}

function Brand() {
  return <div className="brand"><div className="brand-mark"><Scale /></div><div className="brand-copy"><span className="brand-name">SlashCourt</span><span className="brand-tag">Evidence settlement</span></div></div>;
}

function StatusPill({ value }: { value: string }) {
  return <span className={`status ${statusTone(value)}`}>{prettyStatus(value)}</span>;
}

function Metric({ label, value, foot, tone = "" }: { label: string; value: string; foot: string; tone?: string }) {
  return <div className={`metric ${tone}`}><div className="metric-label">{label}</div><div className="metric-value">{value}</div><div className="metric-foot">{foot}</div></div>;
}

function Lifecycle({ item }: { item: CourtCase }) {
  return <div className="timeline">{caseSteps(item).map((step, index) => <div className={`step ${step.done ? "done" : ""} ${step.current ? "current" : ""}`} key={step.label}><span className="step-dot">{step.done ? <Check size={9} /> : index + 1}</span><span className="step-label">{step.label}</span></div>)}</div>;
}

function CaseRow({ item, onOpen }: { item: CourtCase; onOpen: () => void }) {
  const hasVerdict = Boolean(item.outcome);
  return <button className="case-row" onClick={onOpen} style={{ textAlign: "left", width: "100%" }}>
    <div className="case-top"><div><div className="case-id">{item.case_id} <span style={{ color: "#5f7183" }}>· {item.commitment_id}</span></div><div className="case-claim">{shortText(item.claim, 104)}</div></div><StatusPill value={item.network_status === "FINALIZED" ? "FINALIZED" : item.status} /></div>
    <Lifecycle item={item} />
    <div className="case-meta"><span><LockKeyhole size={10} style={{ verticalAlign: "-2px" }} /> {amount(item.commitment_exposure)} GEN at risk</span><span><FileSearch size={10} style={{ verticalAlign: "-2px" }} /> {item.claimant_evidence.length + item.operator_evidence.length} evidence items</span><span>{dateLabel(item.opened_at)}</span></div>
    {hasVerdict ? <div className="verdict"><span className="verdict-label">Consensus result · {prettyStatus(item.application_status)}</span><strong className={outcomeTone(item.outcome)}>{outcomeLabel(item.outcome)}{item.penalty_amount !== "0" ? ` · ${amount(item.penalty_amount)} GEN` : ""}</strong></div> : null}
  </button>;
}

function CaseIndexRow({ caseId, item, loading, onOpen }: { caseId: string; item?: CourtCase | null; loading: boolean; onOpen: () => void }) {
  if (item) return <CaseRow item={item} onOpen={onOpen} />;
  return <button className="case-row index-row" onClick={onOpen} style={{ textAlign: "left", width: "100%" }}><div><div className="case-id">{caseId}</div><div className="case-claim">Open the public case file to load its facts, evidence, outcome, and vault application.</div></div><span className="status slate">{loading ? "Loading case" : "Open file"}</span></button>;
}

function EmptyState({ configured, index, loading, onRetry }: { configured: boolean; index: Dashboard["caseIndex"] | null; loading: boolean; onRetry: () => void }) {
  if (!configured) return <div className="empty-state"><ShieldCheck /><h3>Contract reads are waiting for deployment</h3><p>Set the deployed Court and Vault addresses. The console never fabricates a case or balance.</p></div>;
  if (loading && !index?.data) return <div className="empty-state"><LoaderCircle className="spin" /><h3>Loading the current case index</h3><p>Checking the configured SlashCourt deployment without requiring a wallet.</p></div>;
  if (index?.state === "success" && index.data?.total === 0) return <div className="empty-state"><ShieldCheck /><h3>No cases have been opened on this deployment</h3><p>This empty state is shown only after a successful current-deployment read.</p></div>;
  return <div className="empty-state"><AlertTriangle /><h3>Case index unavailable</h3><p>{index?.error?.message || "The current deployment could not prove whether cases exist."}</p><button className="ghost-button" style={{ marginTop: 14 }} onClick={onRetry}>Retry case index</button></div>;
}

function RulebookCard({ dashboard }: { dashboard: Dashboard | null }) {
  const slice = dashboard?.rulebook;
  const rulebook = slice?.data;
  const stale = Boolean(rulebook && slice?.state === "error");
  return <section className="panel" id="rulebook"><div className="panel-header"><div className="panel-title"><BookOpen /> Rulebook</div><span className="panel-kicker">{rulebook ? `version ${rulebook.version}${stale ? " · stale" : ""}` : "version unavailable"}</span></div><div className="panel-body">{rulebook ? <><div className="rulebook-text">{rulebook.rulebook_text}</div><div className="rule-tags">{rulebook.rule_ids.map((id) => <span className="rule-tag" key={id}>{id}</span>)}</div><div className="rulebook-hash">{rulebook.rulebook_hash}</div>{stale ? <div className="form-help" style={{ marginTop: 10 }}>Showing the last successful read. The latest rulebook refresh failed.</div> : null}</> : <div className="empty-state"><BookOpen /><h3>Rulebook unavailable</h3><p>{slice?.error?.message || "Waiting for the current deployment to return its rulebook."}</p></div>}</div></section>;
}

function Intake({ configured, writeReady, walletConnected, onGenLayer, onSubmit, busy }: { configured: boolean; writeReady: boolean; walletConnected: boolean; onGenLayer: boolean; onSubmit: (data: typeof EMPTY_FORM) => Promise<void>; busy: boolean }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState<Partial<Record<keyof typeof EMPTY_FORM, boolean>>>({});
  const update = (key: keyof typeof EMPTY_FORM, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const preset = (key: keyof typeof PRESETS) => setForm((current) => ({ ...current, ...PRESETS[key] }));
  const markTouched = (key: keyof typeof EMPTY_FORM) => setTouched((current) => ({ ...current, [key]: true }));
  const errors: Partial<Record<keyof typeof EMPTY_FORM, string>> = {};
  if (!form.commitmentId.trim()) errors.commitmentId = "Enter the commitment this dispute belongs to.";
  if (!form.claim.trim()) errors.claim = "Describe the duty failure being disputed.";
  if (!form.evidenceFact.trim()) errors.evidenceFact = "State the fact this evidence is meant to establish.";
  try {
    if (!form.evidenceUrl.trim() || new URL(form.evidenceUrl).protocol !== "https:") errors.evidenceUrl = "Use a complete HTTPS evidence URL.";
  } catch {
    errors.evidenceUrl = "Use a complete HTTPS evidence URL.";
  }
  if (form.contentHash.trim() && !/^sha256:[a-f0-9]{64}$/i.test(form.contentHash.trim())) errors.contentHash = "Use sha256: followed by 64 hexadecimal characters.";
  const valid = Object.keys(errors).length === 0;
  const problem = (key: keyof typeof EMPTY_FORM) => touched[key] && errors[key] ? <small className="field-error" id={`${key}-error`}>{errors[key]}</small> : null;
  return <section className="panel" id="intake"><div className="panel-header"><div className="panel-title"><Gavel /> Case intake</div><span className="panel-kicker">beneficiary only</span></div><div className="panel-body"><div className="intake-grid">
    <div className="preset-row"><button className="preset" type="button" onClick={() => preset("misconduct")}>misconduct</button><button className="preset" type="button" onClick={() => preset("negligence")}>negligence</button><button className="preset" type="button" onClick={() => preset("outage")}>external outage</button><button className="preset" type="button" onClick={() => preset("uncertainty")}>insufficient evidence</button></div>
    <label className="form-label"><span>Commitment ID</span><input className="input" value={form.commitmentId} onChange={(event) => update("commitmentId", event.target.value)} onBlur={() => markTouched("commitmentId")} aria-invalid={Boolean(touched.commitmentId && errors.commitmentId)} aria-describedby={touched.commitmentId && errors.commitmentId ? "commitmentId-error" : undefined} placeholder="keeper-prod-001" />{problem("commitmentId")}</label>
    <label className="form-label"><span>Incident claim</span><textarea className="textarea" value={form.claim} onChange={(event) => update("claim", event.target.value)} onBlur={() => markTouched("claim")} aria-invalid={Boolean(touched.claim && errors.claim)} aria-describedby={touched.claim && errors.claim ? "claim-error" : undefined} placeholder="Describe the missed duty or disputed action." />{problem("claim")}</label>
    <label className="form-label"><span>Evidence URL</span><input className="input" value={form.evidenceUrl} onChange={(event) => update("evidenceUrl", event.target.value)} onBlur={() => markTouched("evidenceUrl")} aria-invalid={Boolean(touched.evidenceUrl && errors.evidenceUrl)} aria-describedby={touched.evidenceUrl && errors.evidenceUrl ? "evidenceUrl-error" : undefined} placeholder="https://slash-court.vercel.app/evidence-fixtures/incident.txt" />{problem("evidenceUrl")}</label>
    <label className="form-label"><span>Claimed evidence fact</span><textarea className="textarea" value={form.evidenceFact} onChange={(event) => update("evidenceFact", event.target.value)} onBlur={() => markTouched("evidenceFact")} aria-invalid={Boolean(touched.evidenceFact && errors.evidenceFact)} aria-describedby={touched.evidenceFact && errors.evidenceFact ? "evidenceFact-error" : undefined} />{problem("evidenceFact")}</label>
    <details className="advanced-fields"><summary>Advanced evidence metadata</summary><div className="advanced-fields-body"><div className="form-row"><label className="form-label"><span>Evidence ID (optional)</span><input className="input" value={form.evidenceId} onChange={(event) => update("evidenceId", event.target.value)} placeholder="Derived from the content hash" /></label><label className="form-label"><span>Source domain (optional)</span><input className="input" value={form.evidenceDomain} onChange={(event) => update("evidenceDomain", event.target.value)} placeholder="Derived from the evidence URL" /></label></div><label className="form-label"><span>Content SHA-256 (optional)</span><input className="input" value={form.contentHash} onChange={(event) => update("contentHash", event.target.value)} onBlur={() => markTouched("contentHash")} aria-invalid={Boolean(touched.contentHash && errors.contentHash)} aria-describedby={touched.contentHash && errors.contentHash ? "contentHash-error" : undefined} placeholder="Fetched and derived when omitted" />{problem("contentHash")}</label></div></details>
    <div className="form-help">Evidence is bounded, HTTPS-only, domain allowlisted and re-fetched independently by validators. The browser hashes the fetched bytes; these presets are synthetic fixtures, not historical incidents. The model cannot set a penalty amount.</div>
    <button className="primary-button" disabled={!valid || !writeReady || !walletConnected || !onGenLayer || busy} onClick={() => void onSubmit(form)}>{busy ? <><LoaderCircle size={14} className="spin" /> submitting to GenLayer…</> : <><Zap size={14} /> open case on network</>}</button>
    {!valid ? <div className="form-help">Complete the required case and evidence fields to enable submission.</div> : null}
    {!configured ? <div className="form-help">Deployment addresses are missing.</div> : !writeReady ? <div className="form-help">Writes stay disabled until the Court, Vault, rulebook, and evidence policy are freshly verified.</div> : !walletConnected ? <div className="form-help">Connect the beneficiary wallet to open a case.</div> : !onGenLayer ? <div className="form-help">Switch MetaMask to GenLayer Studio Network before writing.</div> : null}
  </div></div></section>;
}

function OperatorActions({ configured, writeReady, rulebookVersion, walletConnected, onGenLayer, address, busy, onSend }: { configured: boolean; writeReady: boolean; rulebookVersion: number | null; walletConnected: boolean; onGenLayer: boolean; address: string | null; busy: boolean; onSend: (action: () => Promise<string>, label: string) => Promise<void> }) {
  const [metadata, setMetadata] = useState("https://slash-court.vercel.app/operators/keeper.json");
  const [deposit, setDeposit] = useState("100");
  const [acceptId, setAcceptId] = useState("keeper-prod-001");
  const [offerPreview, setOfferPreview] = useState<Record<string, any> | null>(null);
  const [offerError, setOfferError] = useState<string | null>(null);
  const [commitment, setCommitment] = useState({ id: "keeper-prod-001", beneficiary: "", service: "Hourly keeper maintenance", trigger: "scheduled-trigger-1", duty: "2099-01-01T00:00:00Z", dispute: "2099-01-02T00:00:00Z", exposure: "20", action: "maintenance-action-1" });
  const update = (key: keyof typeof commitment, value: string) => setCommitment((current) => ({ ...current, [key]: value }));
  useEffect(() => {
    if (!configured || !acceptId.trim()) {
      setOfferPreview(null);
      return;
    }
    let active = true;
    setOfferError(null);
    void new SlashCourtClient(address || undefined).getCommitment(acceptId.trim()).then((value) => {
      if (active) setOfferPreview(value);
    }).catch((error) => {
      if (active) {
        setOfferPreview(null);
        setOfferError(error instanceof Error ? error.message : "Commitment not found.");
      }
    });
    return () => { active = false; };
  }, [acceptId, address, configured]);
  return <div className="intake-grid">
    <div className="form-row"><label className="form-label"><span>Operator metadata URI</span><input className="input" value={metadata} onChange={(event) => setMetadata(event.target.value)} /></label><label className="form-label"><span>Bond amount · GEN</span><input className="input" inputMode="decimal" value={deposit} onChange={(event) => setDeposit(event.target.value)} /></label></div>
    <div className="form-row"><button className="ghost-button" disabled={!writeReady || !walletConnected || !onGenLayer || busy} onClick={() => void onSend(() => new SlashCourtClient(address || undefined).registerOperator(metadata), "Operator registration")}>register operator</button><button className="primary-button" disabled={!writeReady || !walletConnected || !onGenLayer || busy} onClick={() => void onSend(() => new SlashCourtClient(address || undefined).depositBond(deposit), "Bond deposit")}>deposit bond</button></div>
    <div className="section-heading" style={{ margin: "9px 0 0" }}><div><h2>Create commitment</h2><p>Exposure is locked before the beneficiary accepts the offer.</p></div></div>
    <label className="form-label"><span>Beneficiary address</span><input className="input" value={commitment.beneficiary} onChange={(event) => update("beneficiary", event.target.value)} placeholder="0x…" /></label>
    <div className="form-row"><label className="form-label"><span>Commitment ID</span><input className="input" value={commitment.id} onChange={(event) => update("id", event.target.value)} /></label><label className="form-label"><span>Locked exposure · GEN</span><input className="input" value={commitment.exposure} onChange={(event) => update("exposure", event.target.value)} /></label></div>
    <label className="form-label"><span>Service description</span><input className="input" value={commitment.service} onChange={(event) => update("service", event.target.value)} /></label>
    <label className="form-label"><span>Duty trigger</span><input className="input" value={commitment.trigger} onChange={(event) => update("trigger", event.target.value)} /></label>
    <div className="form-row"><label className="form-label"><span>Duty deadline</span><input className="input" value={commitment.duty} onChange={(event) => update("duty", event.target.value)} /></label><label className="form-label"><span>Dispute deadline</span><input className="input" value={commitment.dispute} onChange={(event) => update("dispute", event.target.value)} /></label></div>
    <label className="form-label"><span>Expected action ID</span><input className="input" value={commitment.action} onChange={(event) => update("action", event.target.value)} /></label>
    <div className="form-help">Maximum possible penalty: <strong style={{ color: "var(--red)" }}>{commitment.exposure || "0"} GEN</strong> · fixed by classification and capped to this commitment.</div>
    <button className="primary-button" disabled={!writeReady || !rulebookVersion || !walletConnected || !onGenLayer || busy || !commitment.beneficiary} onClick={() => void onSend(() => new SlashCourtClient(address || undefined).createCommitment({ commitmentId: commitment.id, beneficiary: commitment.beneficiary, serviceDescription: commitment.service, dutyTrigger: commitment.trigger, dutyDeadline: commitment.duty, disputeDeadline: commitment.dispute, rulebookVersion: rulebookVersion!, lockedExposure: commitment.exposure, expectedActionId: commitment.action }), "Commitment creation")}>create commitment</button>
    <div className="form-row"><label className="form-label"><span>Beneficiary acceptance</span><input className="input" value={acceptId} onChange={(event) => setAcceptId(event.target.value)} /></label><button className="ghost-button" style={{ alignSelf: "end" }} disabled={!writeReady || !walletConnected || !onGenLayer || busy || !offerPreview} onClick={() => void onSend(() => new SlashCourtClient(address || undefined).acceptCommitment(acceptId), "Commitment acceptance")}>accept commitment</button></div>
    {offerPreview ? <div className="form-help">Offer preview: <strong>{offerPreview.service_description}</strong> · exposure {amount(offerPreview.locked_exposure)} GEN · duty deadline {offerPreview.duty_deadline} · dispute deadline {offerPreview.dispute_deadline} · rulebook v{offerPreview.rulebook_version}</div> : offerError ? <div className="form-help">{offerError}</div> : null}
    {!configured ? <div className="form-help">Configure both deployed contract addresses to enable writes.</div> : !writeReady ? <div className="form-help">Operator writes remain locked until current Court and Vault policy reads succeed together.</div> : !walletConnected ? <div className="form-help">Connect the wallet for the role you want to exercise.</div> : !onGenLayer ? <div className="form-help">Switch MetaMask to GenLayer Studio Network before writing.</div> : null}
  </div>;
}

function CaseModal({ item, application, source, adjudicationTransaction, tx, onClose, onAction, busy, onGenLayer, writeReady }: { item: CourtCase; application: CaseBundle["application"]; source: CaseSource; adjudicationTransaction?: string; tx?: TxSnapshot[]; onClose: () => void; onAction: (action: "respond" | "ready" | "adjudicate" | "retry" | "appeal", values?: { response?: string; exemption?: string; mitigation?: string; rules?: string[]; counterEvidence?: { evidenceId: string; url: string; domain: string; fact: string; contentHash: string } }) => Promise<void>; busy: boolean; onGenLayer: boolean; writeReady: boolean }) {
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  const [response, setResponse] = useState("The operator response is recorded on the network and will be evaluated against the frozen rulebook.");
  const [exemption, setExemption] = useState("No exemption claimed.");
  const [mitigation, setMitigation] = useState("Secondary provider checked; retry policy followed.");
  const [rules, setRules] = useState("R1,R2");
  const [counterEvidenceId, setCounterEvidenceId] = useState("operator-counter-01");
  const [counterEvidenceUrl, setCounterEvidenceUrl] = useState("https://slash-court.vercel.app/evidence-fixtures/operator-response.txt");
  const [counterEvidenceDomain, setCounterEvidenceDomain] = useState("slash-court.vercel.app");
  const [counterEvidenceFact, setCounterEvidenceFact] = useState("The operator supplied a bounded counterevidence record.");
  const [counterEvidenceHash, setCounterEvidenceHash] = useState("");
  const [showResponse, setShowResponse] = useState(false);
  const deadlinePassed = Boolean(item.response_deadline && new Date(item.response_deadline).getTime() <= Date.now());
  const canRespond = item.status === "AWAITING_RESPONSE" && !deadlinePassed;
  const canReady = item.status === "AWAITING_RESPONSE" && (item.operator_response.trim().length > 0 || deadlinePassed);
  const canAdjudicate = item.status === "READY_FOR_ADJUDICATION";
  const canRetry = Boolean(item.adjudication_finalized) && ["RESOLUTION_RECORDED", "APPLICATION_QUEUED"].includes(item.status);
  const latestTx = tx?.[tx.length - 1];
  const appealableAdjudication = findAppealableAdjudication(tx);
  const adjudicationHash = adjudicationTransaction || tx?.find((entry) => entry.kind === "adjudication")?.hash;
  const duty = item.canonical_commitment;
  const historical = source === "historical";
  useEffect(() => {
    const priorFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const pageRegions = Array.from(document.querySelectorAll<HTMLElement>(".topbar, .body-grid"));
    const priorOverflow = document.body.style.overflow;
    pageRegions.forEach((region) => { region.inert = true; });
    document.body.style.overflow = "hidden";
    closeButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCloseRef.current();
        return;
      }
      if (event.key !== "Tab" || !modalRef.current) return;
      const controls = Array.from(modalRef.current.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])'));
      if (!controls.length) return;
      const first = controls[0];
      const last = controls[controls.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      pageRegions.forEach((region) => { region.inert = false; });
      document.body.style.overflow = priorOverflow;
      priorFocus?.focus();
    };
  }, []);
  const evidence = [...item.claimant_evidence, ...item.operator_evidence];
  const settlement = application.data;
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
    <div ref={modalRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="case-dialog-title">
      <div className="modal-header"><div><h2 id="case-dialog-title">{item.case_id} · case file</h2><p>{historical ? "Historical predecessor deployment · synthetic demo evidence" : "Current deployment"}</p></div><button ref={closeButtonRef} className="modal-close" onClick={onClose} aria-label="Close case file"><X size={18} /></button></div>
      <div className="modal-body">
        {historical ? <div className="banner historical-label"><AlertTriangle size={15} /><div><strong>Historical StudioNet proof</strong><span>This finalized case belongs to the predecessor deployment and uses labelled synthetic incident evidence. It is not a real-world incident.{application.state === "error" ? " Live reads are unavailable, so facts shown here come from the checked deployment manifest and committed fixture digest; the operator response and exact findings remain unavailable." : ""}</span></div></div> : null}
        <div className="case-top"><div><div className="case-id">What happened</div><div className="case-claim">{item.claim}</div></div><StatusPill value={item.status} /></div>
        <div className="outcome-summary">
          <div><span>Classification</span><strong>{item.classification ? prettyStatus(item.classification) : "Not decided"}</strong></div>
          <div><span>Outcome</span><strong>{item.outcome ? prettyStatus(item.outcome) : "Pending"}</strong></div>
          <div><span>Penalty</span><strong>{settlement?.applied ? `${amount(settlement.penalty_amount)} GEN` : item.adjudication_finalized ? `${amount(item.penalty_amount)} GEN` : "Not applied"}</strong></div>
          <div><span>Finality</span><strong>{item.adjudication_finalized ? "Finalized" : prettyStatus(item.network_status || "Pending")}</strong></div>
        </div>
        {item.explanation ? <div className="banner decision-banner"><ShieldCheck size={15} /><div><strong>Decision reasoning</strong><span>{item.explanation}</span></div></div> : null}
        {item.operator_response || item.claimed_exemption || item.mitigation_attempts || historical ? <section className="response-sheet"><h3>Operator response</h3><p>{item.operator_response || (application.state === "error" ? "Unavailable in the checked deployment artifact; a live historical case read is required." : "No response was recorded on chain.")}</p><dl><div><dt>Claimed exemption</dt><dd>{item.claimed_exemption || (application.state === "error" ? "Unavailable" : "None")}</dd></div><div><dt>Mitigation</dt><dd>{item.mitigation_attempts || (application.state === "error" ? "Unavailable" : "None recorded")}</dd></div></dl></section> : null}
        <Lifecycle item={item} />
        {duty ? <div className="banner" style={{ marginTop: 14 }}><LockKeyhole size={15} /><div><strong>Vault-bound duty</strong><span>{duty.service_description} · trigger {duty.duty_trigger} · expected action {duty.expected_action_id}<br />Duty {dateLabel(duty.duty_deadline)} · dispute {dateLabel(duty.dispute_deadline)} · alleged rules {item.alleged_rule_ids.join(", ") || "none"}</span></div></div> : null}
        {settlement ? <><section className="vault-accounting"><div><span>{application.state === "error" ? "Manifest settlement" : "Vault application"}</span><strong>{settlement.applied ? "Applied once" : "Not applied"}</strong></div><div><span>Beneficiary compensation</span><strong>{settlement.applied ? `${amount(settlement.beneficiary_award)} GEN` : "—"}</strong></div><div><span>Safety-pool allocation</span><strong>{settlement.applied ? `${amount(settlement.safety_pool_amount)} GEN` : "—"}</strong></div></section>{application.state === "error" ? <div className="form-help">Per-case amounts are derived from the finalized penalty and immutable 80% / 20% Vault allocation recorded for this predecessor deployment; use the transaction link for chain-level verification.</div> : null}</> : <div className="form-help">Vault accounting is unavailable for this case; no financial action is presented as verified.</div>}
        {item.findings.length ? <div className="rule-tags" style={{ margin: "14px 0" }}>{item.findings.map((finding) => <span className="rule-tag" key={`${finding.evidence_id}-${finding.rule_id}`}>{finding.rule_id} · {finding.submission_party || "party"}: {finding.finding}</span>)}</div> : null}
        <div className="section-heading" style={{ marginTop: 20 }}><div><h2>Evidence and response</h2><p>{evidence.length} cited records · evidence frozen: {item.evidence_frozen ? "yes" : "no"}</p></div></div>
        <div className="activity">{evidence.map((entry) => <div className="activity-row" key={entry.evidence_id}><div className="activity-track"><div className="activity-dot" /></div><div className="activity-copy"><strong>{entry.submission_party || entry.party || "party"}</strong><span>{entry.claimed_fact || entry.fact} · <a href={entry.url} target="_blank" rel="noreferrer" style={{ color: "var(--cyan)" }}>open evidence <ArrowUpRight size={10} style={{ verticalAlign: "-1px" }} /></a></span><details className="advanced-fields"><summary>Technical evidence metadata</summary><code>ID {entry.evidence_id}</code><code>domain {entry.source_domain || new URL(entry.url).hostname}</code><code>{entry.content_hash}</code></details></div></div>)}</div>
        <details className="technical-record"><summary>Advanced case metadata</summary><div>Claimant <code>{formatAddress(item.claimant, 18)}</code> · respondent <code>{formatAddress(item.respondent, 18)}</code> · exposure <code>{amount(item.commitment_exposure)} GEN</code></div>{duty ? <code>{duty.commitment_digest}</code> : null}</details>
        <div className="proof-links"><a href={`https://explorer-studio.genlayer.com/address/${historical ? HISTORICAL_DEPLOYMENT.courtAddress : deploymentConfiguration().courtAddress}`} target="_blank" rel="noreferrer">Court contract <ArrowUpRight size={11} /></a>{adjudicationHash ? <a href={`https://explorer-studio.genlayer.com/tx/${adjudicationHash}`} target="_blank" rel="noreferrer">Adjudication transaction <ArrowUpRight size={11} /></a> : <span>Adjudication transaction unavailable</span>}</div>
        {!historical && canRespond && !showResponse ? <button className="ghost-button" style={{ marginTop: 13 }} disabled={!writeReady} onClick={() => setShowResponse(true)}>Add operator response</button> : null}
        {!historical && showResponse ? <div className="intake-grid" style={{ marginTop: 13 }}><label className="form-label"><span>Response</span><textarea className="textarea" value={response} onChange={(event) => setResponse(event.target.value)} /></label><label className="form-label"><span>Claimed exemption</span><input className="input" value={exemption} onChange={(event) => setExemption(event.target.value)} /></label><label className="form-label"><span>Mitigation attempts</span><input className="input" value={mitigation} onChange={(event) => setMitigation(event.target.value)} /></label><label className="form-label"><span>Counterevidence URL</span><input className="input" value={counterEvidenceUrl} onChange={(event) => setCounterEvidenceUrl(event.target.value)} /></label><label className="form-label"><span>Counterevidence fact</span><textarea className="textarea" value={counterEvidenceFact} onChange={(event) => setCounterEvidenceFact(event.target.value)} /></label><details className="advanced-fields"><summary>Optional evidence metadata</summary><label className="form-label"><span>Evidence ID</span><input className="input" value={counterEvidenceId} onChange={(event) => setCounterEvidenceId(event.target.value)} /></label><label className="form-label"><span>Approved domain</span><input className="input" value={counterEvidenceDomain} onChange={(event) => setCounterEvidenceDomain(event.target.value)} /></label><label className="form-label"><span>Content SHA-256</span><input className="input" value={counterEvidenceHash} onChange={(event) => setCounterEvidenceHash(event.target.value)} placeholder="Derived from the evidence body when blank" /></label></details><button className="primary-button" disabled={busy || !onGenLayer || !writeReady} onClick={() => void onAction("respond", { response, exemption, mitigation, counterEvidence: counterEvidenceUrl.trim() ? { evidenceId: counterEvidenceId, url: counterEvidenceUrl, domain: counterEvidenceDomain, fact: counterEvidenceFact, contentHash: counterEvidenceHash } : undefined })}>Submit response</button></div> : null}
        {!historical ? <><div className="form-help" style={{ marginTop: 14 }}>{!writeReady ? "Writes are locked until current Court, Vault, rulebook, and evidence-policy reads succeed." : !onGenLayer ? "Switch MetaMask to GenLayer Studio Network before writing." : deadlinePassed ? "The response deadline has passed; a claimant may mark this case ready even if the operator stayed silent." : `Response deadline: ${dateLabel(item.response_deadline)}. Evidence becomes frozen when consensus starts.`}</div><div className="modal-actions" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}><button className="ghost-button" disabled={busy || !onGenLayer || !writeReady || !canReady} onClick={() => void onAction("ready", { rules: rules.split(",").map((rule) => rule.trim()).filter(Boolean) })}>Mark ready · rules</button>{canReady ? <input className="input" style={{ width: 110 }} value={rules} onChange={(event) => setRules(event.target.value)} aria-label="Rule IDs" /> : null}<button className="ghost-button" disabled={busy || !onGenLayer || !writeReady || !canAdjudicate} onClick={() => void onAction("adjudicate")}>Run consensus</button><button className="ghost-button" disabled={busy || !onGenLayer || !writeReady || !canRetry} onClick={() => void onAction("retry")}>Retry finalized message</button>{appealableAdjudication ? <button className="primary-button" disabled={busy || !onGenLayer || !writeReady} onClick={() => void onAction("appeal")}>Appeal accepted adjudication</button> : null}</div></> : null}
        {latestTx ? <div className="footer-note">Latest transaction <code>{latestTx.hash}</code> · {latestTx.status} · {latestTx.execution}{latestTx.success ? " · execution succeeded" : latestTx.error ? ` · ${latestTx.error}` : " · outcome unknown"}{latestTx.appealable ? " · appeal window open" : ""}</div> : null}
      </div>
    </div>
  </div>;
}

export default function SlashCourtConsole() {
  const wallet = useWallet();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>("Home");
  const [selectedCase, setSelectedCase] = useState<{ caseId: string; source: CaseSource } | null>(null);
  const [caseBundles, setCaseBundles] = useState<Record<string, CaseBundle>>({});
  const [caseLoading, setCaseLoading] = useState<string | null>(null);
  const [casePageLoading, setCasePageLoading] = useState(false);
  const [caseLoadError, setCaseLoadError] = useState<string | null>(null);
  const [nextRetryAt, setNextRetryAt] = useState<number | null>(null);
  const [automaticRefreshes, setAutomaticRefreshes] = useState(0);
  const [transactions, setTransactions] = useState<Record<string, TxSnapshot[]>>({});
  const [transactionsReady, setTransactionsReady] = useState(false);
  const refreshInFlight = useRef<Promise<void> | null>(null);
  const failureCount = useRef(0);
  const lastAttemptAt = useRef(0);
  const transactionRefreshStarted = useRef(false);
  const configured = missingConfigurationKeys().length === 0;
  const transactionKey = useMemo(() => {
    const configuration = deploymentConfiguration();
    return transactionStorageKey(configuration.network, configuration.courtAddress, configuration.vaultAddress);
  }, []);
  const selectedKey = selectedCase ? `${selectedCase.source}:${selectedCase.caseId}` : null;
  const selectedBundle = selectedKey ? caseBundles[selectedKey] || null : null;

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.localStorage.getItem(transactionKey);
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === "object") setTransactions(parsed as Record<string, TxSnapshot[]>);
    } catch {
      // A malformed local transaction cache must never prevent the contract dashboard from loading.
    } finally {
      setTransactionsReady(true);
    }
  }, [transactionKey]);

  useEffect(() => {
    if (typeof window !== "undefined" && transactionsReady) window.localStorage.setItem(transactionKey, JSON.stringify(transactions));
  }, [transactionKey, transactions, transactionsReady]);

  const refresh = useCallback(async (manual = false) => {
    if (!configured) return;
    if (!manual && typeof document !== "undefined" && document.hidden) return;
    if (refreshInFlight.current) return refreshInFlight.current;
    const request = (async () => {
      setLoading(true);
      try {
        const next = await new SlashCourtClient(wallet.address || undefined).dashboard(wallet.address || undefined);
        setDashboard((current) => mergeDashboard(current, next));
        const slices = [next.statistics, next.rulebook, next.domains, next.caseIndex, next.vault, next.vaultStatistics];
        const failures = slices.filter((slice) => slice.state === "error");
        failureCount.current = failures.length ? failureCount.current + 1 : 0;
        const retryAfter = Math.max(0, ...failures.map((slice) => slice.error?.retryAfterSeconds || 0));
        setNextRetryAt(Date.now() + nextRefreshDelay(failureCount.current, retryAfter));
        lastAttemptAt.current = Date.now();
      } catch (error) {
        failureCount.current += 1;
        setNextRetryAt(Date.now() + nextRefreshDelay(failureCount.current));
        lastAttemptAt.current = Date.now();
        toast.error("Dashboard refresh failed", { description: error instanceof Error ? error.message : "Unable to prepare contract reads." });
      } finally {
        setLoading(false);
      }
    })();
    refreshInFlight.current = request;
    try {
      await request;
    } finally {
      if (refreshInFlight.current === request) refreshInFlight.current = null;
    }
  }, [configured, wallet.address]);

  useEffect(() => { void refresh(false); }, [refresh]);

  useEffect(() => {
    if (!nextRetryAt || automaticRefreshes >= MAX_AUTOMATIC_REFRESHES) return;
    let timer: number | undefined;
    const arm = () => {
      if (timer) window.clearTimeout(timer);
      if (document.hidden) return;
      const remaining = Math.max(0, nextRetryAt - Date.now());
      timer = window.setTimeout(() => {
        setAutomaticRefreshes((count) => count + 1);
        void refresh(false);
      }, remaining);
    };
    const onVisibility = () => {
      if (!document.hidden && Date.now() - lastAttemptAt.current >= Math.max(0, nextRetryAt - lastAttemptAt.current)) arm();
      else arm();
    };
    document.addEventListener("visibilitychange", onVisibility);
    arm();
    return () => {
      if (timer) window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [automaticRefreshes, nextRetryAt, refresh]);

  const loadCase = useCallback(async (source: CaseSource, caseId: string, force = false) => {
    const key = `${source}:${caseId}`;
    if (!force && caseBundles[key]?.caseRecord.data) return;
    const immediateFallback = source === "historical" ? historicalArtifactBundle(caseId) : null;
    if (immediateFallback) setCaseBundles((current) => ({ ...current, [key]: immediateFallback }));
    setCaseLoading(key);
    setCaseLoadError(null);
    const addresses = source === "historical" ? HISTORICAL_DEPLOYMENT : undefined;
    try {
      const bundle = await new SlashCourtClient(undefined, addresses).getCaseBundle(caseId);
      const resolved = source === "historical" && !bundle.caseRecord.data ? historicalArtifactBundle(caseId) || bundle : bundle;
      setCaseBundles((current) => ({ ...current, [key]: resolved }));
      if (!resolved.caseRecord.data) setCaseLoadError(resolved.caseRecord.error?.message || "The case file could not be read.");
    } catch (error) {
      const fallback = source === "historical" ? historicalArtifactBundle(caseId) : null;
      if (fallback) setCaseBundles((current) => ({ ...current, [key]: fallback }));
      else setCaseLoadError(error instanceof Error ? error.message : "The case file could not be read.");
    } finally {
      setCaseLoading((current) => current === key ? null : current);
    }
  }, [caseBundles]);

  const loadCasePage = useCallback(async (offset: number) => {
    if (!configured || casePageLoading) return;
    setCasePageLoading(true);
    try {
      const caseIndex = await new SlashCourtClient(wallet.address || undefined).getCaseIndex(Math.max(0, offset), 8);
      setDashboard((current) => current ? { ...current, caseIndex: preserveSlice(current.caseIndex, caseIndex), attemptedAt: Date.now() } : current);
    } finally {
      setCasePageLoading(false);
    }
  }, [configured, wallet.address]);

  const openCase = useCallback((source: CaseSource, caseId: string, updateUrl = true) => {
    setSelectedCase({ source, caseId });
    setActiveView("Explorer");
    if (updateUrl) window.history.pushState(null, "", `#case/${source}/${encodeURIComponent(caseId)}`);
    void loadCase(source, caseId);
  }, [loadCase]);

  const closeCase = useCallback(() => {
    setSelectedCase(null);
    setCaseLoadError(null);
    window.history.pushState(null, "", "#explorer");
  }, []);

  useEffect(() => {
    const applyHash = () => {
      const match = window.location.hash.match(/^#case\/(current|historical)\/([^/]+)$/);
      if (match) {
        openCase(match[1] as CaseSource, decodeURIComponent(match[2]), false);
        return;
      }
      const view = window.location.hash.slice(1).toLowerCase();
      const mapped: Record<string, ActiveView> = { home: "Home", explorer: "Explorer", submit: "Submit", operate: "Operate" };
      if (mapped[view]) setActiveView(mapped[view]);
    };
    window.addEventListener("hashchange", applyHash);
    applyHash();
    return () => window.removeEventListener("hashchange", applyHash);
  }, [openCase]);

  const rememberTransaction = useCallback((caseId: string | null, snapshot: TxSnapshot) => {
    const key = caseId || "__operator__";
    setTransactions((current) => ({
      ...current,
      [key]: mergeTransaction(current[key], snapshot),
    }));
  }, []);

  useEffect(() => {
    if (!configured || !transactionsReady || transactionRefreshStarted.current) return;
    transactionRefreshStarted.current = true;
    const client = new SlashCourtClient(wallet.address || undefined);
    for (const [caseId, history] of Object.entries(transactions)) {
      for (const entry of history) {
        if (entry.kind !== "adjudication" || !entry.appealable) continue;
        void client.snapshot(entry.hash, entry.kind).then((snapshot) => rememberTransaction(caseId, snapshot));
      }
    }
  }, [configured, transactionsReady, transactions, wallet.address, rememberTransaction]);

  const runTransaction = useCallback(async (caseId: string | null, kind: TxSnapshot["kind"], action: () => Promise<string>, label: string, mode: "finalized" | "appealable" = "finalized") => {
    setBusy(true);
    try {
      const client = new SlashCourtClient(wallet.address || undefined);
      const hash = await action();
      toast.success(`${label} submitted`, { description: hash, className: "toast-copy" });
      rememberTransaction(caseId, { hash, status: "SUBMITTED", execution: "PENDING", appealable: false, success: false, kind, updatedAt: Date.now() });
      const provisional = await client.snapshot(hash, kind).catch(() => null);
      if (provisional) rememberTransaction(caseId, provisional);
      if (mode === "appealable") {
        const accepted = await client.waitForAppealWindow(hash, kind);
        rememberTransaction(caseId, accepted);
        if (accepted.appealable) toast.success(`${label} accepted`, { description: "Adjudication retained; appeal window is open.", className: "toast-copy" });
        else toast.error(`${label} is not appealable`, { description: accepted.error || `${accepted.status} · ${accepted.execution}`, className: "toast-copy" });
        void client.wait(hash, kind).then(async (finalized) => {
          rememberTransaction(caseId, finalized);
          await refresh(true);
        });
        await refresh(true);
        return;
      }
      const snapshot = await client.wait(hash, kind);
      rememberTransaction(caseId, snapshot);
      if (snapshot.success) toast.success(`${label} finalized`, { description: `${snapshot.status} · ${snapshot.execution}`, className: "toast-copy" });
      else toast.error(`${label} did not finalize successfully`, { description: snapshot.error || `${snapshot.status} · ${snapshot.execution}`, className: "toast-copy" });
      await refresh(true);
    } catch (error) {
      toast.error(`${label} failed`, { description: error instanceof Error ? error.message : "The network rejected the transaction.", className: "toast-copy" });
    } finally {
      setBusy(false);
    }
  }, [wallet.address, refresh, rememberTransaction]);

  const submitCase = async (form: typeof EMPTY_FORM) => {
    try {
      const evidence = [await makeEvidenceItem({ evidenceId: form.evidenceId, evidenceType: "PUBLIC_STATUS_REPORT", url: form.evidenceUrl, sourceDomain: form.evidenceDomain, claimedFact: form.evidenceFact, contentHash: form.contentHash, relevantRuleIds: ["R1", "R4"] })];
      await runTransaction(null, "intake", () => new SlashCourtClient(wallet.address || undefined).submitCase(form.commitmentId, form.claim, evidence), "Case intake");
    } catch (error) {
      toast.error("Evidence preparation failed", { description: error instanceof Error ? error.message : "Unable to hash the evidence body." });
    }
  };

  const caseAction = async (action: "respond" | "ready" | "adjudicate" | "retry" | "appeal", values?: { response?: string; exemption?: string; mitigation?: string; rules?: string[]; counterEvidence?: { evidenceId: string; url: string; domain: string; fact: string; contentHash: string } }) => {
    if (!selectedCase || selectedCase.source !== "current") return;
    const client = new SlashCourtClient(wallet.address || undefined);
    const id = selectedCase.caseId;
    if (action === "respond") {
      try {
        const counterEvidence = values?.counterEvidence;
        const evidence = counterEvidence?.url.trim() ? [await makeEvidenceItem({ evidenceId: counterEvidence.evidenceId, evidenceType: "OPERATOR_COUNTEREVIDENCE", url: counterEvidence.url, sourceDomain: counterEvidence.domain, claimedFact: counterEvidence.fact, contentHash: counterEvidence.contentHash, relevantRuleIds: ["R3", "R4"] })] : [];
        await runTransaction(id, "response", () => client.respondToCase(id, values?.response || "", values?.exemption || "", values?.mitigation || "", evidence), "Operator response");
      } catch (error) {
        toast.error("Counterevidence preparation failed", { description: error instanceof Error ? error.message : "Unable to hash the counterevidence body." });
      }
    }
    if (action === "ready") await runTransaction(id, "ready", () => client.markCaseReady(id, values?.rules || []), "Evidence freeze");
    if (action === "adjudicate") await runTransaction(id, "adjudication", () => client.adjudicateCase(id), "Consensus evaluation", "appealable");
    if (action === "retry") await runTransaction(id, "retry", () => client.retryApplication(id), "Finality message retry");
    if (action === "appeal") {
      const adjudication = findAppealableAdjudication(transactions[id]);
      if (!adjudication) {
        toast.error("Appeal unavailable", { description: "No retained ACCEPTED adjudication is currently appealable. Appeals must be submitted before finalization." });
        return;
      }
      await runTransaction(id, "appeal", () => client.appeal(adjudication.hash), "Appeal");
    }
    await loadCase("current", id, true);
  };

  const navigate = (view: ActiveView) => {
    setActiveView(view);
    setSelectedCase(null);
    window.history.pushState(null, "", `#${view.toLowerCase()}`);
    const target: Record<ActiveView, string> = { Home: "overview", Explorer: "cases", Submit: "submit-workflow", Operate: "operate-workflow" };
    window.setTimeout(() => document.getElementById(target[view])?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };
  const stats = dashboard?.statistics.data;
  const caseIndex = dashboard?.caseIndex;
  const caseIds = caseIndex?.data?.ids || [];
  const vaultStats = dashboard?.vaultStatistics.data;
  const rulebook = dashboard?.rulebook.data;
  const domains = dashboard?.domains.data;
  const operator = dashboard?.operator.data;
  const health = dashboardHealth(dashboard, loading);
  const writesSafe = health === "fresh" && Boolean(dashboard?.vault.data?.court_configured && rulebook && domains?.length);
  const failedSlices = dashboard ? [dashboard.statistics, dashboard.rulebook, dashboard.domains, dashboard.caseIndex, dashboard.vault, dashboard.vaultStatistics].filter((slice) => slice.state === "error") : [];
  const primaryFailure = failedSlices[0]?.error;
  const featuredCase = caseIds.map((id) => caseBundles[`current:${id}`]?.caseRecord.data).find(Boolean) || null;
  const deployment = deploymentConfiguration();
  const network = dashboard?.network || deployment.network;
  const networkAvailable = health === "fresh" || health === "partial";
  const displayCase = networkAvailable ? featuredCase : null;
  const previewState = health === "loading" ? "Checking network" : health === "stale" ? "Stale snapshot" : health === "partial" ? "Partial snapshot" : health === "fresh" && caseIndex?.data?.total === 0 ? "No cases opened" : "Snapshot unavailable";
  const retryLabel = loading ? "Retrying now…" : nextRetryAt ? `Next automatic retry ${new Date(nextRetryAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : "Automatic retry paused";
  const healthCopy = health === "loading"
    ? { title: "Loading current deployment", body: "Court, Vault, rulebook, evidence policy, and case index are being checked independently." }
    : health === "partial"
      ? { title: "Partial current-deployment snapshot", body: "Successful reads remain visible. Failed fields stay unavailable and all financial writes remain locked." }
      : health === "stale"
        ? { title: "Showing a stale snapshot", body: "Every latest read failed; retained values are labelled and cannot authorize financial actions." }
        : health === "unavailable"
          ? { title: "Current deployment unavailable", body: "The app could not prove current contract state. It will not infer an empty case list, rulebook, or balance." }
          : null;

  return <div className="app-shell">
    <header className="topbar"><Brand /><div className="top-actions"><span className={`network-chip ${health === "fresh" ? "live" : "unavailable"}`}><span className="live-dot" /> {health === "fresh" ? `${network} live` : health === "partial" ? `${network} partial` : health === "stale" ? `${network} stale` : loading ? "Checking StudioNet" : `${network} unavailable`}</span>{wallet.connected ? <button className="wallet-button connected" onClick={wallet.disconnect}>{formatAddress(wallet.address)}</button> : <button className="wallet-button" disabled={wallet.connecting} onClick={() => void wallet.connect().catch((error) => toast.error("Wallet connection failed", { description: error instanceof Error ? error.message : "Please try again." }))}>{wallet.connecting ? "Connecting…" : "Connect wallet"}</button>}</div></header>
    <div className="body-grid">
      <aside className="sidebar"><nav className="side-nav" aria-label="Primary navigation">{(["Home", "Explorer", "Submit", "Operate"] as const).map((label) => <button className={`side-link ${activeView === label ? "active" : ""}`} aria-current={activeView === label ? "page" : undefined} key={label} onClick={() => navigate(label)}>{label}</button>)}</nav><div className="side-note"><span>{rulebook ? `Rulebook v${rulebook.version}` : "Rulebook unavailable"}</span><strong>Deterministic penalties. Appealable decisions.</strong></div></aside>
      <main className="content"><div className="content-inner" id="overview">
        {!configured ? <div className="notice"><AlertTriangle /><div><strong>Deployment addresses required</strong><span>{missingConfigurationKeys().join(" · ")}<br />No cached or placeholder contract state is shown.</span></div></div> : null}
        {healthCopy ? <div className={`state-banner ${health}`}><AlertTriangle size={16} /><div><strong>{healthCopy.title}</strong><span>{healthCopy.body}</span>{primaryFailure ? <small>{primaryFailure.kind === "rate_limit" ? "StudioNet RPC rate limit reached. " : ""}{primaryFailure.message}</small> : null}<div className="refresh-meta"><span>{retryLabel}{automaticRefreshes >= MAX_AUTOMATIC_REFRESHES ? " · automatic retries paused after the bounded retry budget" : ""}</span><button className="ghost-button" onClick={() => { setAutomaticRefreshes(0); void refresh(true); }} disabled={loading}><RefreshCw size={13} className={loading ? "spin" : ""} /> {loading ? "Retrying" : "Retry now"}</button></div></div></div> : null}
        <section className="hero"><div className="hero-copy"><h1>Accountability for autonomous work.</h1><p>SlashCourt turns a bonded service promise into a public, appealable decision. Validators assess evidence; deterministic contracts cap and route the consequence.</p><div className="hero-actions"><button className="primary-button" onClick={() => navigate("Explorer")}>Explore decisions <ChevronRight size={15} /></button><button className="text-button" onClick={() => navigate("Submit")}>Submit a dispute</button></div><div className="hero-proof"><span><ShieldCheck size={15} /> Canonical duty bound</span><span><FileSearch size={15} /> Evidence attributable</span><span><Scale size={15} /> Penalty capped</span></div></div><div className="hero-rail" aria-label={displayCase ? "Current deployment case file" : "Decision process structural preview"}><div className="desk-mast"><div><strong>{displayCase ? displayCase.case_id : "Decision chain of custody"}</strong><span>{displayCase ? "Current deployment case" : "Structural preview · unverified values withheld"}</span></div>{displayCase ? <StatusPill value={displayCase.network_status === "FINALIZED" ? "FINALIZED" : displayCase.status} /> : <span className="status slate">{previewState}</span>}</div><div className="desk-question">{displayCase ? shortText(displayCase.claim, 150) : "What happens when a bonded operator fails its canonical duty?"}</div><div className="desk-grid"><div><span>Commitment</span><strong>{displayCase?.commitment_id || "Bound at case intake"}</strong></div><div><span>Exposure</span><strong>{displayCase ? `${amount(displayCase.commitment_exposure)} GEN` : "Capped by vault"}</strong></div><div><span>Evidence</span><strong>{displayCase ? `${displayCase.claimant_evidence.length + displayCase.operator_evidence.length} cited items` : "Party + rule preserved"}</strong></div><div><span>Decision</span><strong>{displayCase?.outcome ? outcomeLabel(displayCase.outcome) : "Consensus, then appeal"}</strong></div></div><div className="desk-sequence"><span>Evidence</span><ChevronRight /><span>Consensus</span><ChevronRight /><span>Appeal</span><ChevronRight /><span>Finality</span></div><div className="deployment-links"><a href={`https://explorer-studio.genlayer.com/address/${deployment.courtAddress}`} target="_blank" rel="noreferrer"><span>Current Court</span> {formatAddress(deployment.courtAddress, 17)} <ArrowUpRight size={11} /></a><a href={`https://explorer-studio.genlayer.com/address/${deployment.vaultAddress}`} target="_blank" rel="noreferrer"><span>Current Vault</span> {formatAddress(deployment.vaultAddress, 17)} <ArrowUpRight size={11} /></a></div></div></section>
        <section className="stats-grid"><Metric label="Bonded operators" value={vaultStats ? String(vaultStats.total_operators) : "—"} foot={dashboard?.vaultStatistics.state === "error" && vaultStats ? "stale registry snapshot" : "application registry"} tone="cyan" /><Metric label="Total bond" value={vaultStats ? amount(vaultStats.total_bond) : "—"} foot="application-layer GEN" tone="cyan" /><Metric label="Locked exposure" value={vaultStats ? amount(vaultStats.locked_exposure) : "—"} foot="commitment-level cap" tone="purple" /><Metric label="Open cases" value={stats ? String(stats.open_cases) : "—"} foot={stats ? `${stats.ready_cases} ready for adjudication` : "unavailable"} tone="amber" /><Metric label="Finalized" value={stats ? String(stats.applied_cases) : "—"} foot={stats ? `${stats.cancelled_cases} cancelled` : "unavailable"} tone="green" /><Metric label="Penalties applied" value={vaultStats ? amount(vaultStats.total_penalties_applied) : "—"} foot={rulebook ? `rulebook v${rulebook.version}` : "rulebook unavailable"} tone="red" /></section>
        <div className="section-heading"><div><h2>Current deployment</h2><p>Case IDs are paginated first. Full case and Vault records load only when opened.</p></div><div className="refresh-meta"><span className="mono">{caseIndex?.data ? `${caseIndex.data.total} indexed · ${caseIds.length} on this page` : "case count unavailable"}</span><button className="ghost-button" aria-label="Refresh current deployment" onClick={() => void refresh(true)} disabled={loading}><RefreshCw size={13} className={loading ? "spin" : ""} /> refresh</button></div></div>
        <div className="dashboard-grid"><section className="panel" id="cases"><div className="panel-header"><div className="panel-title"><Activity /> Case ledger</div><span className="panel-kicker">current Court</span></div><div className="panel-body">{caseIds.length ? <><div className="cases-list">{caseIds.map((caseId) => <CaseIndexRow caseId={caseId} item={caseBundles[`current:${caseId}`]?.caseRecord.data} loading={caseLoading === `current:${caseId}`} key={caseId} onOpen={() => openCase("current", caseId)} />)}</div><div className="pagination"><button className="ghost-button" disabled={casePageLoading || !caseIndex?.data || caseIndex.data.offset === 0} onClick={() => void loadCasePage((caseIndex?.data?.offset || 0) - 8)}>Previous</button><span>{caseIndex?.data ? `${caseIndex.data.offset + 1}–${Math.min(caseIndex.data.offset + caseIndex.data.ids.length, caseIndex.data.total)} of ${caseIndex.data.total}` : "—"}</span><button className="ghost-button" disabled={casePageLoading || !caseIndex?.data || caseIndex.data.offset + caseIndex.data.ids.length >= caseIndex.data.total} onClick={() => void loadCasePage((caseIndex?.data?.offset || 0) + 8)}>Next</button></div></> : <EmptyState configured={configured} index={caseIndex || null} loading={loading} onRetry={() => void refresh(true)} />}{caseLoadError && selectedCase?.source === "current" ? <div className="form-help" style={{ marginTop: 12 }}>{caseLoadError}</div> : null}</div></section><div style={{ display: "grid", gap: 14 }}><RulebookCard dashboard={dashboard} /><section className="panel" id="evidence"><div className="panel-header"><div className="panel-title"><Database /> Evidence perimeter</div><span className="panel-kicker">allowlist</span></div><div className="panel-body">{domains?.length ? <><div className="form-help" style={{ marginBottom: 10 }}>Validators may fetch only approved HTTPS sources. Raw IPs, localhost, and unapproved domains are rejected by the contract.{dashboard?.domains.state === "error" ? " This is the last successful read." : ""}</div><div className="rule-tags">{domains.map((domain) => <span className="rule-tag" key={domain}><Link2 size={10} style={{ verticalAlign: "-1px" }} /> {domain}</span>)}</div></> : <div className="empty-state"><Database /><h3>Evidence policy unavailable</h3><p>{dashboard?.domains.error?.message || "Waiting for a successful allowlist read."}</p></div>}</div></section></div></div>
        <section className="historical-proof"><div className="section-heading"><div><h2>Historical finalized proof</h2><p>Four real StudioNet consensus transactions from the predecessor deployment, using clearly labelled synthetic incident fixtures.</p></div><span className="audience-label">Not current-deployment cases</span></div><div className="historical-grid">{HISTORICAL_CASES.map((entry) => <button className="historical-card" key={entry.caseId} onClick={() => openCase("historical", entry.caseId)}><span>{entry.label}</span><strong>{entry.caseId}</strong><small>Open evidence, response, verdict, finality, and Vault accounting</small></button>)}</div><div className="form-help">Predecessor Court <a href={`https://explorer-studio.genlayer.com/address/${HISTORICAL_DEPLOYMENT.courtAddress}`} target="_blank" rel="noreferrer">{formatAddress(HISTORICAL_DEPLOYMENT.courtAddress, 22)} <ArrowUpRight size={10} /></a>. These fixtures demonstrate the protocol; they are not claims about real operators or incidents.</div></section>
        <section className="commercial-panel"><div className="section-heading"><div><h2>Who SlashCourt serves</h2><p>The initial wedge is bonded automation where an operator promises a measurable duty to a beneficiary.</p></div><span className="audience-label">Commercial model</span></div><div className="commercial-grid"><article><Users /><h3>Initial customer</h3><p>Automation operators use verifiable commitments to win trust; treasury and protocol beneficiaries gain a neutral dispute path.</p></article><article><CircleDollarSign /><h3>Who pays</h3><p>Operators or sponsoring protocols would pay for integration and case administration. No platform-fee revenue is implemented in the current contracts.</p></article><article><Scale /><h3>Where penalties go</h3><p>Beneficiary awards are compensation. Safety-pool allocations are protocol reserves—not SlashCourt revenue unless governance later creates an explicit fee.</p></article></div></section>
        <section className="workflow-band submit-band" id="submit-workflow"><div className="section-heading"><div><h2>Submit a dispute</h2><p>Beneficiaries package a claim and attributable public evidence. Public inspection remains wallet-free.</p></div><span className="audience-label">Beneficiary workflow</span></div><div className="workflow-panel"><Intake configured={configured} writeReady={writesSafe} walletConnected={wallet.connected} onGenLayer={wallet.onGenLayer} onSubmit={submitCase} busy={busy} /></div></section>
        <section className="workflow-band operate-band" id="operate-workflow"><div className="section-heading"><div><h2>Operate a bonded service</h2><p>Register, fund, and bind a service duty before a beneficiary can accept it. Available funds remain separate from locked exposure.</p></div><span className="audience-label">Operator workflow</span></div><section className="panel"><div className="panel-header"><div className="panel-title"><Users /> Connected operator</div><span className="panel-kicker">vault state</span></div><div className="panel-body">{operator?.registered ? <div className="cases-list"><div className="case-row"><div className="case-id">{formatAddress(operator.address, 22)}</div><div className="case-meta"><span>total {amount(operator.total_bond)} GEN</span><span>available {amount(operator.available_bond)} GEN</span><span>awards {amount(operator.claimable_awards)} GEN</span></div><div className="verdict"><span className="verdict-label">Active commitments</span><strong className="amber">{operator.active_commitments}</strong></div></div></div> : <div className="empty-state"><CircleDollarSign /><h3>{wallet.connected ? "Operator record unavailable or unregistered" : "Connect a registered operator"}</h3><p>{dashboard?.operator.error?.message || "Wallet-scoped bond and exposure readouts appear here. The Vault keeps the accounting, not the browser."}</p></div>}<details className="action-disclosure"><summary><span>Open operator controls</span><small>Registration, bond, commitments, and acceptance</small><ChevronRight size={17} /></summary><div className="action-disclosure-body"><OperatorActions configured={configured} writeReady={writesSafe} rulebookVersion={rulebook?.version || null} walletConnected={wallet.connected} onGenLayer={wallet.onGenLayer} address={wallet.address} busy={busy} onSend={(action, label) => runTransaction(null, "operator", action, label)} /></div></details></div></section></section>
        <p className="footer-note">SlashCourt is an application-layer settlement protocol, separate from GenLayer’s native validator staking and slashing. Financial application is designed as a finality-safe child message; see the public test and deployment notes for what is and is not proven. <a href="https://docs.genlayer.com" target="_blank" rel="noreferrer" style={{ color: "var(--cyan)" }}>Read the GenLayer docs <ArrowUpRight size={10} style={{ verticalAlign: "-1px" }} /></a></p>
      </div></main>
    </div>
    {selectedCase && selectedBundle?.caseRecord.data ? <CaseModal item={selectedBundle.caseRecord.data} application={selectedBundle.application} source={selectedCase.source} adjudicationTransaction={selectedCase.source === "historical" ? HISTORICAL_CASES.find((entry) => entry.caseId === selectedCase.caseId)?.transaction : undefined} tx={selectedCase.source === "current" ? transactions[selectedCase.caseId] : undefined} onClose={closeCase} onAction={caseAction} busy={busy} onGenLayer={wallet.onGenLayer} writeReady={writesSafe} /> : null}
    {selectedCase && caseLoading === selectedKey ? <div className="modal-backdrop"><div className="modal loading-modal"><LoaderCircle className="spin" /><h2>Loading {selectedCase.caseId}</h2><p>Reading the case and Vault application independently.</p><button className="ghost-button" onClick={closeCase}>Close</button></div></div> : null}
    {selectedCase && !selectedBundle?.caseRecord.data && caseLoadError ? <div className="modal-backdrop"><div className="modal loading-modal"><AlertTriangle /><h2>Case file unavailable</h2><p>{caseLoadError}</p><div className="modal-actions"><button className="ghost-button" onClick={() => void loadCase(selectedCase.source, selectedCase.caseId, true)}>Retry</button><button className="ghost-button" onClick={closeCase}>Close</button></div></div></div> : null}
  </div>;
}
