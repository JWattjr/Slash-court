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
import { findAppealableAdjudication, mergeTransaction, transactionStorageKey } from "@/lib/slashcourt/transactions";
import type { CourtCase, Dashboard, TxSnapshot } from "@/lib/slashcourt/types";

const EMPTY_FORM = {
  commitmentId: "",
  claim: "",
  evidenceId: "incident-source-01",
  evidenceUrl: "https://slash-court.vercel.app/evidence-fixtures/insufficient-evidence.txt",
  evidenceDomain: "slash-court.vercel.app",
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

type ActiveView = "Home" | "Explorer" | "Submit" | "Operate";

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
  return {
    evidence_id: data.evidenceId.trim(),
    evidence_type: data.evidenceType,
    url,
    source_domain: data.sourceDomain.trim().toLowerCase(),
    claimed_fact: data.claimedFact.trim(),
    content_hash: await evidenceHash(url, data.contentHash || ""),
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

function EmptyState({ configured, onConnect }: { configured: boolean; onConnect: () => void }) {
  return <div className="empty-state"><ShieldCheck /><h3>{configured ? "No cases have been opened" : "Contract reads are waiting for deployment"}</h3><p>{configured ? "Once a beneficiary opens a dispute, every evidence submission, response, consensus round and finality callback will appear here." : "Set the two deployed addresses in frontend/.env.local. The console never fabricates a sample verdict or balance."}</p>{!configured ? <button className="ghost-button" style={{ marginTop: 14 }} onClick={onConnect}>Connect wallet</button> : null}</div>;
}

function RulebookCard({ dashboard }: { dashboard: Dashboard | null }) {
  const rulebook = dashboard?.rulebook;
  return <section className="panel" id="rulebook"><div className="panel-header"><div className="panel-title"><BookOpen /> Rulebook</div><span className="panel-kicker">version {rulebook?.version || "—"}</span></div><div className="panel-body">{rulebook ? <><div className="rulebook-text">{rulebook.rulebook_text}</div><div className="rule-tags">{rulebook.rule_ids.map((id) => <span className="rule-tag" key={id}>{id}</span>)}</div><div className="rulebook-hash">{rulebook.rulebook_hash}</div></> : <div className="empty-state"><BookOpen /><h3>Rulebook not readable yet</h3><p>Publish v1 through the deployment script, then the immutable policy hash will render here.</p></div>}</div></section>;
}

function Intake({ configured, walletConnected, onGenLayer, onSubmit, busy }: { configured: boolean; walletConnected: boolean; onGenLayer: boolean; onSubmit: (data: typeof EMPTY_FORM) => Promise<void>; busy: boolean }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [touched, setTouched] = useState<Partial<Record<keyof typeof EMPTY_FORM, boolean>>>({});
  const update = (key: keyof typeof EMPTY_FORM, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const preset = (key: keyof typeof PRESETS) => setForm((current) => ({ ...current, ...PRESETS[key] }));
  const markTouched = (key: keyof typeof EMPTY_FORM) => setTouched((current) => ({ ...current, [key]: true }));
  const errors: Partial<Record<keyof typeof EMPTY_FORM, string>> = {};
  if (!form.commitmentId.trim()) errors.commitmentId = "Enter the commitment this dispute belongs to.";
  if (!form.claim.trim()) errors.claim = "Describe the duty failure being disputed.";
  if (!form.evidenceId.trim()) errors.evidenceId = "Give this evidence item a stable ID.";
  if (!form.evidenceDomain.trim()) errors.evidenceDomain = "Enter the approved source hostname.";
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
    <div className="form-row"><label className="form-label"><span>Evidence ID</span><input className="input" value={form.evidenceId} onChange={(event) => update("evidenceId", event.target.value)} onBlur={() => markTouched("evidenceId")} aria-invalid={Boolean(touched.evidenceId && errors.evidenceId)} aria-describedby={touched.evidenceId && errors.evidenceId ? "evidenceId-error" : undefined} />{problem("evidenceId")}</label><label className="form-label"><span>Approved source domain</span><input className="input" value={form.evidenceDomain} onChange={(event) => update("evidenceDomain", event.target.value)} onBlur={() => markTouched("evidenceDomain")} aria-invalid={Boolean(touched.evidenceDomain && errors.evidenceDomain)} aria-describedby={touched.evidenceDomain && errors.evidenceDomain ? "evidenceDomain-error" : undefined} />{problem("evidenceDomain")}</label></div>
    <label className="form-label"><span>Evidence URL</span><input className="input" value={form.evidenceUrl} onChange={(event) => update("evidenceUrl", event.target.value)} onBlur={() => markTouched("evidenceUrl")} aria-invalid={Boolean(touched.evidenceUrl && errors.evidenceUrl)} aria-describedby={touched.evidenceUrl && errors.evidenceUrl ? "evidenceUrl-error" : undefined} placeholder="https://slash-court.vercel.app/evidence-fixtures/incident.txt" />{problem("evidenceUrl")}</label>
    <label className="form-label"><span>Claimed evidence fact</span><textarea className="textarea" value={form.evidenceFact} onChange={(event) => update("evidenceFact", event.target.value)} onBlur={() => markTouched("evidenceFact")} aria-invalid={Boolean(touched.evidenceFact && errors.evidenceFact)} aria-describedby={touched.evidenceFact && errors.evidenceFact ? "evidenceFact-error" : undefined} />{problem("evidenceFact")}</label>
    <label className="form-label"><span>Content SHA-256 (optional)</span><input className="input" value={form.contentHash} onChange={(event) => update("contentHash", event.target.value)} onBlur={() => markTouched("contentHash")} aria-invalid={Boolean(touched.contentHash && errors.contentHash)} aria-describedby={touched.contentHash && errors.contentHash ? "contentHash-error" : undefined} placeholder="sha256:<64 hex characters>" />{problem("contentHash")}</label>
    <div className="form-help">Evidence is bounded, HTTPS-only, domain allowlisted and re-fetched independently by validators. The browser hashes the fetched bytes; these presets are synthetic fixtures, not historical incidents. The model cannot set a penalty amount.</div>
    <button className="primary-button" disabled={!valid || !configured || !walletConnected || !onGenLayer || busy} onClick={() => void onSubmit(form)}>{busy ? <><LoaderCircle size={14} className="spin" /> submitting to GenLayer…</> : <><Zap size={14} /> open case on network</>}</button>
    {!valid ? <div className="form-help">Complete the required case and evidence fields to enable submission.</div> : null}
    {!configured ? <div className="form-help">Deployment addresses are missing.</div> : !walletConnected ? <div className="form-help">Connect the beneficiary wallet to open a case.</div> : !onGenLayer ? <div className="form-help">Switch MetaMask to GenLayer Studio Network before writing.</div> : null}
  </div></div></section>;
}

function OperatorActions({ configured, walletConnected, onGenLayer, address, busy, onSend }: { configured: boolean; walletConnected: boolean; onGenLayer: boolean; address: string | null; busy: boolean; onSend: (action: () => Promise<string>, label: string) => Promise<void> }) {
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
    <div className="form-row"><button className="ghost-button" disabled={!configured || !walletConnected || !onGenLayer || busy} onClick={() => void onSend(() => new SlashCourtClient(address || undefined).registerOperator(metadata), "Operator registration")}>register operator</button><button className="primary-button" disabled={!configured || !walletConnected || !onGenLayer || busy} onClick={() => void onSend(() => new SlashCourtClient(address || undefined).depositBond(deposit), "Bond deposit")}>deposit bond</button></div>
    <div className="section-heading" style={{ margin: "9px 0 0" }}><div><h2>Create commitment</h2><p>Exposure is locked before the beneficiary accepts the offer.</p></div></div>
    <label className="form-label"><span>Beneficiary address</span><input className="input" value={commitment.beneficiary} onChange={(event) => update("beneficiary", event.target.value)} placeholder="0x…" /></label>
    <div className="form-row"><label className="form-label"><span>Commitment ID</span><input className="input" value={commitment.id} onChange={(event) => update("id", event.target.value)} /></label><label className="form-label"><span>Locked exposure · GEN</span><input className="input" value={commitment.exposure} onChange={(event) => update("exposure", event.target.value)} /></label></div>
    <label className="form-label"><span>Service description</span><input className="input" value={commitment.service} onChange={(event) => update("service", event.target.value)} /></label>
    <label className="form-label"><span>Duty trigger</span><input className="input" value={commitment.trigger} onChange={(event) => update("trigger", event.target.value)} /></label>
    <div className="form-row"><label className="form-label"><span>Duty deadline</span><input className="input" value={commitment.duty} onChange={(event) => update("duty", event.target.value)} /></label><label className="form-label"><span>Dispute deadline</span><input className="input" value={commitment.dispute} onChange={(event) => update("dispute", event.target.value)} /></label></div>
    <label className="form-label"><span>Expected action ID</span><input className="input" value={commitment.action} onChange={(event) => update("action", event.target.value)} /></label>
    <div className="form-help">Maximum possible penalty: <strong style={{ color: "var(--red)" }}>{commitment.exposure || "0"} GEN</strong> · fixed by classification and capped to this commitment.</div>
    <button className="primary-button" disabled={!configured || !walletConnected || !onGenLayer || busy || !commitment.beneficiary} onClick={() => void onSend(() => new SlashCourtClient(address || undefined).createCommitment({ commitmentId: commitment.id, beneficiary: commitment.beneficiary, serviceDescription: commitment.service, dutyTrigger: commitment.trigger, dutyDeadline: commitment.duty, disputeDeadline: commitment.dispute, rulebookVersion: 1, lockedExposure: commitment.exposure, expectedActionId: commitment.action }), "Commitment creation")}>create commitment</button>
    <div className="form-row"><label className="form-label"><span>Beneficiary acceptance</span><input className="input" value={acceptId} onChange={(event) => setAcceptId(event.target.value)} /></label><button className="ghost-button" style={{ alignSelf: "end" }} disabled={!configured || !walletConnected || !onGenLayer || busy || !offerPreview} onClick={() => void onSend(() => new SlashCourtClient(address || undefined).acceptCommitment(acceptId), "Commitment acceptance")}>accept commitment</button></div>
    {offerPreview ? <div className="form-help">Offer preview: <strong>{offerPreview.service_description}</strong> · exposure {amount(offerPreview.locked_exposure)} GEN · duty deadline {offerPreview.duty_deadline} · dispute deadline {offerPreview.dispute_deadline} · rulebook v{offerPreview.rulebook_version}</div> : offerError ? <div className="form-help">{offerError}</div> : null}
    {!configured ? <div className="form-help">Configure both deployed contract addresses to enable writes.</div> : !walletConnected ? <div className="form-help">Connect the wallet for the role you want to exercise.</div> : !onGenLayer ? <div className="form-help">Switch MetaMask to GenLayer Studio Network before writing.</div> : null}
  </div>;
}

function CaseModal({ item, tx, onClose, onAction, busy, onGenLayer }: { item: CourtCase; tx?: TxSnapshot[]; onClose: () => void; onAction: (action: "respond" | "ready" | "adjudicate" | "retry" | "appeal", values?: { response?: string; exemption?: string; mitigation?: string; rules?: string[]; counterEvidence?: { evidenceId: string; url: string; domain: string; fact: string; contentHash: string } }) => Promise<void>; busy: boolean; onGenLayer: boolean }) {
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
  const adjudicationTx = findAppealableAdjudication(tx);
  const duty = item.canonical_commitment;
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
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div ref={modalRef} className="modal" role="dialog" aria-modal="true" aria-labelledby="case-dialog-title"><div className="modal-header"><div><h2 id="case-dialog-title">{item.case_id} · case file</h2><p>{item.commitment_id} · {item.network_status}</p></div><button ref={closeButtonRef} className="modal-close" onClick={onClose} aria-label="Close case file"><X size={18} /></button></div><div className="modal-body">
    <div className="case-top"><div><div className="case-id">Claim</div><div className="case-claim">{item.claim}</div></div><StatusPill value={item.status} /></div><Lifecycle item={item} />
    <div className="form-help" style={{ margin: "15px 0" }}>Claimant <code>{formatAddress(item.claimant, 18)}</code> · respondent <code>{formatAddress(item.respondent, 18)}</code> · exposure <code>{amount(item.commitment_exposure)} GEN</code></div>
    {duty ? <div className="banner" style={{ marginBottom: 14 }}><LockKeyhole size={15} /><div><strong>Vault-bound canonical duty</strong><span>{duty.service_description} · trigger {duty.duty_trigger} · action {duty.expected_action_id}<br />duty {dateLabel(duty.duty_deadline)} · dispute {dateLabel(duty.dispute_deadline)} · allegations {item.alleged_rule_ids.join(", ") || "pending"}<br /><code>{duty.commitment_digest}</code></span></div></div> : null}
    {item.explanation ? <div className="banner" style={{ borderColor: "rgba(116,237,221,.2)", background: "rgba(116,237,221,.04)", color: "var(--cyan)" }}><ShieldCheck size={15} /><div><strong>{prettyStatus(item.classification)} · {prettyStatus(item.outcome)}</strong><span>{item.explanation}</span></div></div> : null}
    {item.findings.length ? <div className="rule-tags" style={{ marginBottom: 14 }}>{item.findings.map((finding) => <span className="rule-tag" key={`${finding.evidence_id}-${finding.rule_id}`}>{finding.rule_id} · {finding.evidence_id} · {finding.submission_party || "party"}: {finding.finding}</span>)}</div> : null}
    <div className="section-heading" style={{ marginTop: 17 }}><div><h2>Evidence ledger</h2><p>{item.claimant_evidence.length + item.operator_evidence.length} records · frozen: {item.evidence_frozen ? "yes" : "no"}</p></div></div>
    <div className="activity">{[...item.claimant_evidence, ...item.operator_evidence].map((evidence) => <div className="activity-row" key={evidence.evidence_id}><div className="activity-track"><div className="activity-dot" /></div><div className="activity-copy"><strong>{evidence.evidence_id} · {evidence.submission_party || "party"}</strong><span>{evidence.claimed_fact || evidence.fact} · <a href={evidence.url} target="_blank" rel="noreferrer" style={{ color: "var(--cyan)" }}>source <ArrowUpRight size={10} style={{ verticalAlign: "-1px" }} /></a></span></div><span className="activity-time">{evidence.source_domain}</span></div>)}</div>
    {canRespond && !showResponse ? <button className="ghost-button" style={{ marginTop: 13 }} onClick={() => setShowResponse(true)}>Add operator response</button> : null}
    {showResponse ? <div className="intake-grid" style={{ marginTop: 13 }}><label className="form-label"><span>Response</span><textarea className="textarea" value={response} onChange={(event) => setResponse(event.target.value)} /></label><label className="form-label"><span>Claimed exemption</span><input className="input" value={exemption} onChange={(event) => setExemption(event.target.value)} /></label><label className="form-label"><span>Mitigation attempts</span><input className="input" value={mitigation} onChange={(event) => setMitigation(event.target.value)} /></label><label className="form-label"><span>Counterevidence URL</span><input className="input" value={counterEvidenceUrl} onChange={(event) => setCounterEvidenceUrl(event.target.value)} /></label><div className="form-row"><label className="form-label"><span>Evidence ID</span><input className="input" value={counterEvidenceId} onChange={(event) => setCounterEvidenceId(event.target.value)} /></label><label className="form-label"><span>Approved domain</span><input className="input" value={counterEvidenceDomain} onChange={(event) => setCounterEvidenceDomain(event.target.value)} /></label></div><label className="form-label"><span>Counterevidence fact</span><textarea className="textarea" value={counterEvidenceFact} onChange={(event) => setCounterEvidenceFact(event.target.value)} /></label><label className="form-label"><span>Content SHA-256 (optional)</span><input className="input" value={counterEvidenceHash} onChange={(event) => setCounterEvidenceHash(event.target.value)} placeholder="sha256:<64 hex characters>" /></label><button className="primary-button" disabled={busy || !onGenLayer} onClick={() => void onAction("respond", { response, exemption, mitigation, counterEvidence: counterEvidenceUrl.trim() ? { evidenceId: counterEvidenceId, url: counterEvidenceUrl, domain: counterEvidenceDomain, fact: counterEvidenceFact, contentHash: counterEvidenceHash } : undefined })}>Submit response</button></div> : null}
    <div className="form-help" style={{ marginTop: 14 }}>{!onGenLayer ? "Switch MetaMask to GenLayer Studio Network before writing." : deadlinePassed ? "The response deadline has passed; a claimant may mark this case ready even if the operator stayed silent." : `Response deadline: ${dateLabel(item.response_deadline)}. Evidence becomes frozen when consensus starts.`}</div>
    <div className="modal-actions" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}><button className="ghost-button" disabled={busy || !onGenLayer || !canReady} onClick={() => void onAction("ready", { rules: rules.split(",").map((rule) => rule.trim()).filter(Boolean) })}>Mark ready · rules</button>{canReady ? <input className="input" style={{ width: 110 }} value={rules} onChange={(event) => setRules(event.target.value)} aria-label="Rule IDs" /> : null}<button className="ghost-button" disabled={busy || !onGenLayer || !canAdjudicate} onClick={() => void onAction("adjudicate")}>Run consensus</button><button className="ghost-button" disabled={busy || !onGenLayer || !canRetry} onClick={() => void onAction("retry")}>Retry finalized message</button>{adjudicationTx ? <button className="primary-button" disabled={busy || !onGenLayer} onClick={() => void onAction("appeal")}>Appeal accepted adjudication</button> : null}</div>
    {latestTx ? <div className="footer-note">Latest transaction <code>{latestTx.hash}</code> · {latestTx.status} · {latestTx.execution}{latestTx.success ? " · execution succeeded" : latestTx.error ? ` · ${latestTx.error}` : " · outcome unknown"}{latestTx.appealable ? " · appeal window open" : ""}</div> : null}
  </div></div></div>;
}

export default function SlashCourtConsole() {
  const wallet = useWallet();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>("Home");
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Record<string, TxSnapshot[]>>({});
  const [transactionsReady, setTransactionsReady] = useState(false);
  const refreshInFlight = useRef<Promise<void> | null>(null);
  const transactionRefreshStarted = useRef(false);
  const configured = missingConfigurationKeys().length === 0;
  const transactionKey = useMemo(() => {
    const configuration = deploymentConfiguration();
    return transactionStorageKey(configuration.network, configuration.courtAddress, configuration.vaultAddress);
  }, []);
  const selectedCase = useMemo(() => dashboard?.cases.find((item) => item.case_id === selectedCaseId) || null, [dashboard?.cases, selectedCaseId]);

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

  const refresh = useCallback(async () => {
    if (!configured) return;
    if (refreshInFlight.current) return refreshInFlight.current;
    const request = (async () => {
      setLoading(true);
      try {
        const next = await new SlashCourtClient(wallet.address || undefined).dashboard(wallet.address || undefined);
        setDashboard(next);
        setReadError(null);
      } catch (error) {
        setReadError(error instanceof Error ? error.message : "Unable to read SlashCourt state.");
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

  useEffect(() => { void refresh(); const interval = window.setInterval(() => void refresh(), 12_000); return () => window.clearInterval(interval); }, [refresh]);

  const rememberTransaction = useCallback((caseId: string | null, snapshot: TxSnapshot) => {
    const key = caseId || "__operator__";
    setTransactions((current) => ({
      ...current,
      [key]: mergeTransaction(current[key], snapshot),
    }));
  }, []);

  useEffect(() => {
    if (!transactionsReady || transactionRefreshStarted.current) return;
    transactionRefreshStarted.current = true;
    const client = new SlashCourtClient(wallet.address || undefined);
    for (const [caseId, history] of Object.entries(transactions)) {
      for (const entry of history) {
        if (entry.kind !== "adjudication" || !entry.appealable) continue;
        void client.snapshot(entry.hash, entry.kind).then((snapshot) => rememberTransaction(caseId, snapshot));
      }
    }
  }, [transactionsReady, transactions, wallet.address, rememberTransaction]);

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
          await refresh();
        });
        await refresh();
        return;
      }
      const snapshot = await client.wait(hash, kind);
      rememberTransaction(caseId, snapshot);
      if (snapshot.success) toast.success(`${label} finalized`, { description: `${snapshot.status} · ${snapshot.execution}`, className: "toast-copy" });
      else toast.error(`${label} did not finalize successfully`, { description: snapshot.error || `${snapshot.status} · ${snapshot.execution}`, className: "toast-copy" });
      await refresh();
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
    if (!selectedCase) return;
    const client = new SlashCourtClient(wallet.address || undefined);
    const id = selectedCase.case_id;
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
  };

  const navigate = (view: ActiveView) => {
    setActiveView(view);
    const target: Record<ActiveView, string> = { Home: "overview", Explorer: "cases", Submit: "submit-workflow", Operate: "operate-workflow" };
    window.setTimeout(() => document.getElementById(target[view])?.scrollIntoView({ behavior: "smooth", block: "start" }), 0);
  };
  const stats = dashboard?.statistics;
  const cases = useMemo(() => [...(dashboard?.cases || [])].sort((a, b) => b.case_id.localeCompare(a.case_id, undefined, { numeric: true })), [dashboard?.cases]);
  const featuredCase = cases[0] || null;
  const deployment = deploymentConfiguration();
  const network = dashboard?.network || deployment.network;
  const networkAvailable = Boolean(dashboard && !readError);
  const displayCase = networkAvailable ? featuredCase : null;
  const previewState = readError ? "Snapshot unavailable" : networkAvailable ? "No cases opened" : "Checking network";

  return <div className="app-shell"><header className="topbar"><Brand /><div className="top-actions"><span className={`network-chip ${networkAvailable ? "live" : "unavailable"}`}><span className="live-dot" /> {networkAvailable ? `${network} live` : loading ? "Checking StudioNet" : `${network} unavailable`}</span>{wallet.connected ? <button className="wallet-button connected" onClick={wallet.disconnect}>{formatAddress(wallet.address)}</button> : <button className="wallet-button" disabled={wallet.connecting} onClick={() => void wallet.connect().catch((error) => toast.error("Wallet connection failed", { description: error instanceof Error ? error.message : "Please try again." }))}>{wallet.connecting ? "Connecting…" : "Connect wallet"}</button>}</div></header>
    <div className="body-grid"><aside className="sidebar"><nav className="side-nav" aria-label="Primary navigation">{(["Home", "Explorer", "Submit", "Operate"] as const).map((label) => <button className={`side-link ${activeView === label ? "active" : ""}`} aria-current={activeView === label ? "page" : undefined} key={label} onClick={() => navigate(label)}>{label}</button>)}</nav><div className="side-note"><span>Rulebook v{stats?.current_rulebook_version || 1}</span><strong>Deterministic penalties. Appealable decisions.</strong></div></aside>
      <main className="content"><div className="content-inner" id="overview">
        {!configured ? <div className="notice"><AlertTriangle /><div><strong>Deployment addresses required</strong><span>{missingConfigurationKeys().join(" · ")}<br />Set them in <code>frontend/.env.local</code>; no cached or placeholder contract state is shown.</span></div></div> : null}
        {readError ? <div className="banner network-warning"><AlertTriangle size={15} /><div><strong>Live network temporarily unavailable</strong><span>StudioNet reads could not refresh. You can still inspect the interface and verified deployment links; try again shortly.</span><small>{readError}</small></div></div> : null}
        <section className="hero"><div className="hero-copy"><h1>Accountability for autonomous work.</h1><p>SlashCourt turns a bonded service promise into a public, appealable decision. Validators assess the evidence; deterministic contracts limit the consequence.</p><div className="hero-actions"><button className="primary-button" onClick={() => navigate("Explorer")}>Explore decisions <ChevronRight size={15} /></button><button className="text-button" onClick={() => navigate("Submit")}>Submit a dispute</button></div><div className="hero-proof"><span><ShieldCheck size={15} /> Canonical duty bound</span><span><FileSearch size={15} /> Evidence attributable</span><span><Scale size={15} /> Penalty capped</span></div></div><div className="hero-rail" aria-label={displayCase ? "Live decision case file" : "Decision process structural preview"}><div className="desk-mast"><div><strong>{displayCase ? displayCase.case_id : "Decision chain of custody"}</strong><span>{displayCase ? "Network case file" : "Structural preview · live values withheld"}</span></div>{displayCase ? <StatusPill value={displayCase.network_status === "FINALIZED" ? "FINALIZED" : displayCase.status} /> : <span className="status slate">{previewState}</span>}</div><div className="desk-question">{displayCase ? shortText(displayCase.claim, 150) : "What happens when a bonded operator fails its canonical duty?"}</div><div className="desk-grid"><div><span>Commitment</span><strong>{displayCase?.commitment_id || "Bound at case intake"}</strong></div><div><span>Exposure</span><strong>{displayCase ? `${amount(displayCase.commitment_exposure)} GEN` : "Capped by vault"}</strong></div><div><span>Evidence</span><strong>{displayCase ? `${displayCase.claimant_evidence.length + displayCase.operator_evidence.length} cited items` : "Party + rule preserved"}</strong></div><div><span>Decision</span><strong>{displayCase?.outcome ? outcomeLabel(displayCase.outcome) : "Consensus, then appeal"}</strong></div></div><div className="desk-sequence"><span>Evidence</span><ChevronRight /><span>Consensus</span><ChevronRight /><span>Appeal</span><ChevronRight /><span>Finality</span></div><div className="deployment-links"><a href={`https://explorer-studio.genlayer.com/address/${deployment.courtAddress}`} target="_blank" rel="noreferrer"><span>Court</span> {formatAddress(deployment.courtAddress, 17)} <ArrowUpRight size={11} /></a><a href={`https://explorer-studio.genlayer.com/address/${deployment.vaultAddress}`} target="_blank" rel="noreferrer"><span>Vault</span> {formatAddress(deployment.vaultAddress, 17)} <ArrowUpRight size={11} /></a></div></div></section>
        <section className="stats-grid"><Metric label="Bonded operators" value={dashboard?.vaultStatistics ? String(dashboard.vaultStatistics.total_operators) : "—"} foot="application registry" tone="cyan" /><Metric label="Total bond" value={amount(dashboard?.vaultStatistics?.total_bond)} foot="application-layer GEN" tone="cyan" /><Metric label="Locked exposure" value={amount(dashboard?.vaultStatistics?.locked_exposure)} foot="commitment-level cap" tone="purple" /><Metric label="Open cases" value={stats ? String(stats.open_cases) : "—"} foot={stats ? `${stats.ready_cases} ready for adjudication` : "awaiting network"} tone="amber" /><Metric label="Finalized" value={stats ? String(stats.applied_cases) : "—"} foot={stats ? `${stats.cancelled_cases} cancelled` : "no cached data"} tone="green" /><Metric label="Penalties applied" value={amount(dashboard?.vaultStatistics?.total_penalties_applied)} foot={stats?.current_rulebook_version ? `rulebook v${stats.current_rulebook_version}` : "hash-pinned policy"} tone="red" /></section>
        <div className="section-heading"><div><h2>Recent case activity</h2><p>Every row is read from SlashCourt state, never inferred from a UI fixture.</p></div><div style={{ display: "flex", gap: 8, alignItems: "center" }}><span className="mono">{loading ? "syncing…" : `${cases.length} loaded`}</span><button className="ghost-button" aria-label="Refresh network case activity" onClick={() => void refresh()} disabled={loading}><RefreshCw size={13} className={loading ? "spin" : ""} /></button></div></div>
        <div className="dashboard-grid"><section className="panel" id="cases"><div className="panel-header"><div className="panel-title"><Activity /> Case ledger</div><span className="panel-kicker">provisional → final</span></div><div className="panel-body">{cases.length ? <div className="cases-list">{cases.map((item) => <CaseRow item={item} key={item.case_id} onOpen={() => setSelectedCaseId(item.case_id)} />)}</div> : <EmptyState configured={configured} onConnect={() => void wallet.connect()} />}</div></section><div style={{ display: "grid", gap: 14 }}><RulebookCard dashboard={dashboard} /><section className="panel" id="evidence"><div className="panel-header"><div className="panel-title"><Database /> Evidence perimeter</div><span className="panel-kicker">allowlist</span></div><div className="panel-body">{dashboard?.domains.length ? <><div className="form-help" style={{ marginBottom: 10 }}>Validators may fetch only approved HTTPS sources. Raw IPs, localhost and unapproved domains are rejected by the contract.</div><div className="rule-tags">{dashboard.domains.map((domain) => <span className="rule-tag" key={domain}><Link2 size={10} style={{ verticalAlign: "-1px" }} /> {domain}</span>)}</div></> : <div className="form-help">Approved domains will appear after the deployment configuration is readable.</div>}</div></section></div></div>
        <section className="workflow-band submit-band" id="submit-workflow"><div className="section-heading"><div><h2>Submit a dispute</h2><p>Beneficiaries package a claim and attributable public evidence. Technical fields stay available without overwhelming the public record.</p></div><span className="audience-label">Beneficiary workflow</span></div><div className="workflow-panel"><Intake configured={configured} walletConnected={wallet.connected} onGenLayer={wallet.onGenLayer} onSubmit={submitCase} busy={busy} /></div></section>
        <section className="workflow-band operate-band" id="operate-workflow"><div className="section-heading"><div><h2>Operate a bonded service</h2><p>Register, fund, and bind a service duty before a beneficiary can accept it. Available funds remain separate from locked exposure.</p></div><span className="audience-label">Operator workflow</span></div><section className="panel"><div className="panel-header"><div className="panel-title"><Users /> Connected operator</div><span className="panel-kicker">vault state</span></div><div className="panel-body">{dashboard?.operator?.registered ? <div className="cases-list"><div className="case-row"><div className="case-id">{formatAddress(dashboard.operator.address, 22)}</div><div className="case-meta"><span>total {amount(dashboard.operator.total_bond)} GEN</span><span>available {amount(dashboard.operator.available_bond)} GEN</span><span>awards {amount(dashboard.operator.claimable_awards)} GEN</span></div><div className="verdict"><span className="verdict-label">Active commitments</span><strong className="amber">{dashboard.operator.active_commitments}</strong></div></div></div> : <div className="empty-state"><CircleDollarSign /><h3>Connect a registered operator</h3><p>Wallet-scoped bond and exposure readouts appear here. The vault keeps the accounting, not the browser.</p></div>}<details className="action-disclosure"><summary><span>Open operator controls</span><small>Registration, bond, commitments, and acceptance</small><ChevronRight size={17} /></summary><div className="action-disclosure-body"><OperatorActions configured={configured} walletConnected={wallet.connected} onGenLayer={wallet.onGenLayer} address={wallet.address} busy={busy} onSend={(action, label) => runTransaction(null, "operator", action, label)} /></div></details></div></section></section>
        <p className="footer-note">SlashCourt is an application-layer settlement protocol, separate from GenLayer’s native validator staking and slashing. Financial state changes are finality-safe child messages. <a href="https://docs.genlayer.com" target="_blank" rel="noreferrer" style={{ color: "var(--cyan)" }}>Read the GenLayer docs <ArrowUpRight size={10} style={{ verticalAlign: "-1px" }} /></a></p>
      </div></main></div>
    {selectedCase ? <CaseModal item={selectedCase} tx={transactions[selectedCase.case_id]} onClose={() => setSelectedCaseId(null)} onAction={caseAction} busy={busy} onGenLayer={wallet.onGenLayer} /> : null}
  </div>;
}
