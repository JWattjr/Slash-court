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
  LayoutDashboard,
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
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import { useWallet, formatAddress } from "@/lib/genlayer/WalletProvider";
import { deploymentConfiguration, missingConfigurationKeys, SlashCourtClient } from "@/lib/slashcourt/client";
import type { CourtCase, Dashboard, TxSnapshot } from "@/lib/slashcourt/types";

const EMPTY_FORM = {
  commitmentId: "",
  claim: "",
  evidenceId: "incident-source-01",
  evidenceUrl: "https://status.example.org/incidents/sample",
  evidenceDomain: "status.example.org",
  evidenceFact: "The primary provider reported an incident during the duty window.",
};

const PRESETS = {
  misconduct: {
    commitmentId: "keeper-prod-001",
    claim: "The keeper submitted an unauthorized payload and then reported a successful execution.",
    evidenceFact: "A signed execution receipt shows a destination and action different from the authorized payload.",
  },
  outage: {
    commitmentId: "keeper-prod-001",
    claim: "The scheduled duty was missed while the upstream RPC provider was broadly unavailable.",
    evidenceFact: "The provider status incident overlaps the scheduled duty window and records a regional outage.",
  },
  uncertainty: {
    commitmentId: "keeper-prod-001",
    claim: "The claimant cannot establish the failure with independently verifiable evidence.",
    evidenceFact: "The supplied report is incomplete and does not establish a duty breach or a covered outage.",
  },
};

type ActiveView = "Overview" | "Cases" | "Operators" | "Rulebook" | "Evidence";

function amount(value: number | undefined | null) {
  if (value === undefined || value === null || Number.isNaN(value)) return "—";
  return new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);
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
  return value.replaceAll("_", " ").toLowerCase().replace(/(^| )\S/g, (letter) => letter.toUpperCase());
}

function outcomeTone(value: string) {
  if (value === "FULL_SLASH") return "red";
  if (value === "PARTIAL_SLASH") return "amber";
  return "green";
}

function caseSteps(item: CourtCase) {
  const final = item.status === "PENALTY_APPLIED";
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
  return <div className="brand"><div className="brand-mark"><Scale /></div><div className="brand-copy"><span className="brand-name">SlashCourt</span><span className="brand-tag">GenLayer settlement layer</span></div></div>;
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
    {hasVerdict ? <div className="verdict"><span className="verdict-label">Consensus result · {item.application_status.replaceAll("_", " ").toLowerCase()}</span><strong className={outcomeTone(item.outcome)}>{prettyStatus(item.outcome)}{item.penalty_amount ? ` · ${amount(item.penalty_amount)} GEN` : ""}</strong></div> : null}
  </button>;
}

function EmptyState({ configured, onConnect }: { configured: boolean; onConnect: () => void }) {
  return <div className="empty-state"><ShieldCheck /><h3>{configured ? "No cases have been opened" : "Contract reads are waiting for deployment"}</h3><p>{configured ? "Once a beneficiary opens a dispute, every evidence submission, response, consensus round and finality callback will appear here." : "Set the two deployed addresses in frontend/.env.local. The console never fabricates a sample verdict or balance."}</p>{!configured ? <button className="ghost-button" style={{ marginTop: 14 }} onClick={onConnect}>Connect wallet</button> : null}</div>;
}

function RulebookCard({ dashboard }: { dashboard: Dashboard | null }) {
  const rulebook = dashboard?.rulebook;
  return <section className="panel" id="rulebook"><div className="panel-header"><div className="panel-title"><BookOpen /> Rulebook</div><span className="panel-kicker">version {rulebook?.version || "—"}</span></div><div className="panel-body">{rulebook ? <><div className="rulebook-text">{rulebook.rulebook_text}</div><div className="rule-tags">{rulebook.rule_ids.map((id) => <span className="rule-tag" key={id}>{id}</span>)}</div><div className="rulebook-hash">{rulebook.rulebook_hash}</div></> : <div className="empty-state"><BookOpen /><h3>Rulebook not readable yet</h3><p>Publish v1 through the deployment script, then the immutable policy hash will render here.</p></div>}</div></section>;
}

function Intake({ configured, walletConnected, onSubmit, busy }: { configured: boolean; walletConnected: boolean; onSubmit: (data: typeof EMPTY_FORM) => Promise<void>; busy: boolean }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const update = (key: keyof typeof EMPTY_FORM, value: string) => setForm((current) => ({ ...current, [key]: value }));
  const preset = (key: keyof typeof PRESETS) => setForm((current) => ({ ...current, ...PRESETS[key] }));
  return <section className="panel" id="intake"><div className="panel-header"><div className="panel-title"><Gavel /> Case intake</div><span className="panel-kicker">beneficiary only</span></div><div className="panel-body"><div className="intake-grid">
    <div className="preset-row"><button className="preset" type="button" onClick={() => preset("misconduct")}>misconduct</button><button className="preset" type="button" onClick={() => preset("outage")}>external outage</button><button className="preset" type="button" onClick={() => preset("uncertainty")}>insufficient evidence</button></div>
    <label className="form-label"><span>Commitment ID</span><input className="input" value={form.commitmentId} onChange={(event) => update("commitmentId", event.target.value)} placeholder="keeper-prod-001" /></label>
    <label className="form-label"><span>Incident claim</span><textarea className="textarea" value={form.claim} onChange={(event) => update("claim", event.target.value)} placeholder="Describe the missed duty or disputed action." /></label>
    <div className="form-row"><label className="form-label"><span>Evidence ID</span><input className="input" value={form.evidenceId} onChange={(event) => update("evidenceId", event.target.value)} /></label><label className="form-label"><span>Approved source domain</span><input className="input" value={form.evidenceDomain} onChange={(event) => update("evidenceDomain", event.target.value)} /></label></div>
    <label className="form-label"><span>Evidence URL</span><input className="input" value={form.evidenceUrl} onChange={(event) => update("evidenceUrl", event.target.value)} placeholder="https://status.example.org/incident/123" /></label>
    <label className="form-label"><span>Claimed evidence fact</span><textarea className="textarea" value={form.evidenceFact} onChange={(event) => update("evidenceFact", event.target.value)} /></label>
    <div className="form-help">Evidence is bounded, HTTPS-only, domain allowlisted and re-fetched independently by validators. The model cannot set a penalty amount.</div>
    <button className="primary-button" disabled={!configured || !walletConnected || busy} onClick={() => void onSubmit(form)}>{busy ? <><LoaderCircle size={14} className="spin" /> submitting to GenLayer…</> : <><Zap size={14} /> open case on network</>}</button>
    {!configured ? <div className="form-help">Deployment addresses are missing.</div> : !walletConnected ? <div className="form-help">Connect the beneficiary wallet to open a case.</div> : null}
  </div></div></section>;
}

function OperatorActions({ configured, walletConnected, address, busy, onSend }: { configured: boolean; walletConnected: boolean; address: string | null; busy: boolean; onSend: (action: () => Promise<string>, label: string) => Promise<void> }) {
  const [metadata, setMetadata] = useState("https://evidence.example.com/operators/keeper.json");
  const [deposit, setDeposit] = useState("100");
  const [acceptId, setAcceptId] = useState("keeper-prod-001");
  const [commitment, setCommitment] = useState({ id: "keeper-prod-001", beneficiary: "", service: "Hourly keeper maintenance", trigger: "scheduled-trigger-1", duty: "2099-01-01T00:00:00Z", dispute: "2099-01-02T00:00:00Z", exposure: "20", action: "maintenance-action-1" });
  const update = (key: keyof typeof commitment, value: string) => setCommitment((current) => ({ ...current, [key]: value }));
  return <div className="intake-grid">
    <div className="form-row"><label className="form-label"><span>Operator metadata URI</span><input className="input" value={metadata} onChange={(event) => setMetadata(event.target.value)} /></label><label className="form-label"><span>Bond amount · GEN</span><input className="input" inputMode="numeric" value={deposit} onChange={(event) => setDeposit(event.target.value)} /></label></div>
    <div className="form-row"><button className="ghost-button" disabled={!configured || !walletConnected || busy} onClick={() => void onSend(() => new SlashCourtClient(address || undefined).registerOperator(metadata), "Operator registration")}>register operator</button><button className="primary-button" disabled={!configured || !walletConnected || busy} onClick={() => void onSend(() => new SlashCourtClient(address || undefined).depositBond(deposit), "Bond deposit")}>deposit bond</button></div>
    <div className="section-heading" style={{ margin: "9px 0 0" }}><div><h2>Create commitment</h2><p>Exposure is locked before the beneficiary accepts the offer.</p></div></div>
    <label className="form-label"><span>Beneficiary address</span><input className="input" value={commitment.beneficiary} onChange={(event) => update("beneficiary", event.target.value)} placeholder="0x…" /></label>
    <div className="form-row"><label className="form-label"><span>Commitment ID</span><input className="input" value={commitment.id} onChange={(event) => update("id", event.target.value)} /></label><label className="form-label"><span>Locked exposure · GEN</span><input className="input" value={commitment.exposure} onChange={(event) => update("exposure", event.target.value)} /></label></div>
    <label className="form-label"><span>Service description</span><input className="input" value={commitment.service} onChange={(event) => update("service", event.target.value)} /></label>
    <label className="form-label"><span>Duty trigger</span><input className="input" value={commitment.trigger} onChange={(event) => update("trigger", event.target.value)} /></label>
    <div className="form-row"><label className="form-label"><span>Duty deadline</span><input className="input" value={commitment.duty} onChange={(event) => update("duty", event.target.value)} /></label><label className="form-label"><span>Dispute deadline</span><input className="input" value={commitment.dispute} onChange={(event) => update("dispute", event.target.value)} /></label></div>
    <label className="form-label"><span>Expected action ID</span><input className="input" value={commitment.action} onChange={(event) => update("action", event.target.value)} /></label>
    <div className="form-help">Maximum possible penalty: <strong style={{ color: "var(--red)" }}>{commitment.exposure || "0"} GEN</strong> · fixed by classification and capped to this commitment.</div>
    <button className="primary-button" disabled={!configured || !walletConnected || busy || !commitment.beneficiary} onClick={() => void onSend(() => new SlashCourtClient(address || undefined).createCommitment({ commitmentId: commitment.id, beneficiary: commitment.beneficiary, serviceDescription: commitment.service, dutyTrigger: commitment.trigger, dutyDeadline: commitment.duty, disputeDeadline: commitment.dispute, rulebookVersion: 1, lockedExposure: commitment.exposure, expectedActionId: commitment.action }), "Commitment creation")}>create commitment</button>
    <div className="form-row"><label className="form-label"><span>Beneficiary acceptance</span><input className="input" value={acceptId} onChange={(event) => setAcceptId(event.target.value)} /></label><button className="ghost-button" style={{ alignSelf: "end" }} disabled={!configured || !walletConnected || busy} onClick={() => void onSend(() => new SlashCourtClient(address || undefined).acceptCommitment(acceptId), "Commitment acceptance")}>accept commitment</button></div>
    {!configured ? <div className="form-help">Configure both deployed contract addresses to enable writes.</div> : !walletConnected ? <div className="form-help">Connect the wallet for the role you want to exercise.</div> : null}
  </div>;
}

function CaseModal({ item, tx, onClose, onAction, busy }: { item: CourtCase; tx?: TxSnapshot; onClose: () => void; onAction: (action: "respond" | "ready" | "adjudicate" | "retry" | "appeal", values?: { response?: string; exemption?: string; mitigation?: string; rules?: string[] }) => Promise<void>; busy: boolean }) {
  const [response, setResponse] = useState("The operator response is recorded on the network and will be evaluated against the frozen rulebook.");
  const [exemption, setExemption] = useState("No exemption claimed.");
  const [mitigation, setMitigation] = useState("Secondary provider checked; retry policy followed.");
  const [rules, setRules] = useState("R1,R2");
  const [showResponse, setShowResponse] = useState(false);
  const canRespond = item.status === "AWAITING_RESPONSE";
  const canReady = item.status === "AWAITING_RESPONSE" && item.operator_response.length > 0;
  const canAdjudicate = item.status === "READY_FOR_ADJUDICATION";
  const canRetry = ["RESOLUTION_RECORDED", "APPLICATION_QUEUED"].includes(item.status);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}><div className="modal" role="dialog" aria-modal="true"><div className="modal-header"><div><h2>{item.case_id} · case file</h2><p>{item.commitment_id} · {item.network_status}</p></div><button className="modal-close" onClick={onClose} aria-label="Close"><X size={18} /></button></div><div className="modal-body">
    <div className="case-top"><div><div className="case-id">Claim</div><div className="case-claim">{item.claim}</div></div><StatusPill value={item.status} /></div><Lifecycle item={item} />
    <div className="form-help" style={{ margin: "15px 0" }}>Claimant <code>{formatAddress(item.claimant, 18)}</code> · respondent <code>{formatAddress(item.respondent, 18)}</code> · exposure <code>{amount(item.commitment_exposure)} GEN</code></div>
    {item.explanation ? <div className="banner" style={{ borderColor: "rgba(116,237,221,.2)", background: "rgba(116,237,221,.04)", color: "var(--cyan)" }}><ShieldCheck size={15} /><div><strong>{prettyStatus(item.classification)} · {prettyStatus(item.outcome)}</strong><span>{item.explanation}</span></div></div> : null}
    {item.findings.length ? <div className="rule-tags" style={{ marginBottom: 14 }}>{item.findings.map((finding) => <span className="rule-tag" key={finding}>{finding}</span>)}</div> : null}
    <div className="section-heading" style={{ marginTop: 17 }}><div><h2>Evidence ledger</h2><p>{item.claimant_evidence.length + item.operator_evidence.length} records · frozen: {item.evidence_frozen ? "yes" : "no"}</p></div></div>
    <div className="activity">{[...item.claimant_evidence, ...item.operator_evidence].map((evidence) => <div className="activity-row" key={evidence.evidence_id}><div className="activity-track"><div className="activity-dot" /></div><div className="activity-copy"><strong>{evidence.evidence_id} · {evidence.submission_party || "party"}</strong><span>{evidence.claimed_fact || evidence.fact} · <a href={evidence.url} target="_blank" rel="noreferrer" style={{ color: "var(--cyan)" }}>source <ArrowUpRight size={10} style={{ verticalAlign: "-1px" }} /></a></span></div><span className="activity-time">{evidence.source_domain}</span></div>)}</div>
    {canRespond && !showResponse ? <button className="ghost-button" style={{ marginTop: 13 }} onClick={() => setShowResponse(true)}>Add operator response</button> : null}
    {showResponse ? <div className="intake-grid" style={{ marginTop: 13 }}><label className="form-label"><span>Response</span><textarea className="textarea" value={response} onChange={(event) => setResponse(event.target.value)} /></label><label className="form-label"><span>Claimed exemption</span><input className="input" value={exemption} onChange={(event) => setExemption(event.target.value)} /></label><label className="form-label"><span>Mitigation attempts</span><input className="input" value={mitigation} onChange={(event) => setMitigation(event.target.value)} /></label><button className="primary-button" disabled={busy} onClick={() => void onAction("respond", { response, exemption, mitigation })}>Submit response</button></div> : null}
    <div className="modal-actions" style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 18 }}><button className="ghost-button" disabled={busy || !canReady} onClick={() => void onAction("ready", { rules: rules.split(",").map((rule) => rule.trim()).filter(Boolean) })}>Freeze evidence · rules</button>{canReady ? <input className="input" style={{ width: 110 }} value={rules} onChange={(event) => setRules(event.target.value)} aria-label="Rule IDs" /> : null}<button className="ghost-button" disabled={busy || !canAdjudicate} onClick={() => void onAction("adjudicate")}>Run consensus</button><button className="ghost-button" disabled={busy || !canRetry} onClick={() => void onAction("retry")}>Retry finality message</button>{tx?.appealable ? <button className="primary-button" disabled={busy} onClick={() => void onAction("appeal")}>Appeal this transaction</button> : null}</div>
    {tx ? <div className="footer-note">Latest transaction <code>{tx.hash}</code> · {tx.status} · {tx.execution} {tx.appealable ? "· appeal window open" : ""}</div> : null}
  </div></div></div>;
}

export default function SlashCourtConsole() {
  const wallet = useWallet();
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [readError, setReadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [activeView, setActiveView] = useState<ActiveView>("Overview");
  const [selectedCase, setSelectedCase] = useState<CourtCase | null>(null);
  const [transactions, setTransactions] = useState<Record<string, TxSnapshot>>({});
  const configured = missingConfigurationKeys().length === 0;

  const refresh = useCallback(async () => {
    if (!configured) return;
    setLoading(true);
    try {
      const next = await new SlashCourtClient(wallet.address || undefined).dashboard(wallet.address || undefined);
      setDashboard(next);
      setReadError(null);
      if (selectedCase) setSelectedCase(next.cases.find((item) => item.case_id === selectedCase.case_id) || null);
    } catch (error) {
      setReadError(error instanceof Error ? error.message : "Unable to read SlashCourt state.");
    } finally {
      setLoading(false);
    }
  }, [configured, wallet.address, selectedCase]);

  useEffect(() => { void refresh(); const interval = window.setInterval(() => void refresh(), 12_000); return () => window.clearInterval(interval); }, [refresh]);

  const runTransaction = useCallback(async (caseId: string | null, action: () => Promise<string>, label: string) => {
    setBusy(true);
    try {
      const client = new SlashCourtClient(wallet.address || undefined);
      const hash = await action();
      toast.success(`${label} submitted`, { description: hash, className: "toast-copy" });
      const snapshot = await client.wait(hash).catch(() => ({ hash, status: "SUBMITTED", execution: "PENDING", appealable: false }));
      if (caseId) setTransactions((current) => ({ ...current, [caseId]: snapshot }));
      await refresh();
    } catch (error) {
      toast.error(`${label} failed`, { description: error instanceof Error ? error.message : "The network rejected the transaction.", className: "toast-copy" });
    } finally {
      setBusy(false);
    }
  }, [wallet.address, refresh]);

  const submitCase = async (form: typeof EMPTY_FORM) => {
    const evidence = [{ evidence_id: form.evidenceId, evidence_type: "PUBLIC_STATUS_REPORT", url: form.evidenceUrl, source_domain: form.evidenceDomain, claimed_fact: form.evidenceFact, content_hash: "sha256:ui-submitted", relevant_rule_ids: ["R1", "R4"] }];
    await runTransaction(null, () => new SlashCourtClient(wallet.address || undefined).submitCase(form.commitmentId, form.claim, evidence), "Case intake");
  };

  const caseAction = async (action: "respond" | "ready" | "adjudicate" | "retry" | "appeal", values?: { response?: string; exemption?: string; mitigation?: string; rules?: string[] }) => {
    if (!selectedCase) return;
    const client = new SlashCourtClient(wallet.address || undefined);
    const id = selectedCase.case_id;
    if (action === "respond") await runTransaction(id, () => client.respondToCase(id, values?.response || "", values?.exemption || "", values?.mitigation || "", []), "Operator response");
    if (action === "ready") await runTransaction(id, () => client.markCaseReady(id, values?.rules || []), "Evidence freeze");
    if (action === "adjudicate") await runTransaction(id, () => client.adjudicateCase(id), "Consensus evaluation");
    if (action === "retry") await runTransaction(id, () => client.retryApplication(id), "Finality message retry");
    if (action === "appeal") { setBusy(true); try { const tx = transactions[id]; if (!tx) throw new Error("No appealable transaction is attached to this case."); await client.appeal(tx.hash); toast.success("Appeal submitted", { description: "The original consensus transaction is now under appeal." }); await refresh(); } catch (error) { toast.error("Appeal failed", { description: error instanceof Error ? error.message : "The appeal was rejected." }); } finally { setBusy(false); } }
  };

  const navigate = (view: ActiveView) => { setActiveView(view); const id = view === "Overview" ? "overview" : view.toLowerCase(); window.setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" }), 0); };
  const stats = dashboard?.statistics;
  const cases = useMemo(() => [...(dashboard?.cases || [])].sort((a, b) => b.case_id.localeCompare(a.case_id, undefined, { numeric: true })), [dashboard?.cases]);
  const network = dashboard?.network || deploymentConfiguration().network;

  return <div className="app-shell"><header className="topbar"><Brand /><div className="top-actions"><span className="network-chip"><span className="live-dot" /> {network} / live</span>{wallet.connected ? <button className="wallet-button connected" onClick={wallet.disconnect}>{formatAddress(wallet.address)}</button> : <button className="wallet-button" disabled={wallet.connecting} onClick={() => void wallet.connect().catch((error) => toast.error("Wallet connection failed", { description: error instanceof Error ? error.message : "Please try again." }))}>{wallet.connecting ? "connecting…" : "connect wallet"}</button>}</div></header>
    <div className="body-grid"><aside className="sidebar"><div className="side-label">Console</div><nav className="side-nav">{([["Overview", LayoutDashboard], ["Cases", Gavel], ["Operators", Users], ["Rulebook", BookOpen], ["Evidence", FileSearch]] as const).map(([label, Icon]) => <button className={`side-link ${activeView === label ? "active" : ""}`} key={label} onClick={() => navigate(label)}><Icon />{label}</button>)}</nav><div className="side-note"><strong>Settlement, bounded.</strong>SlashCourt turns a service commitment into an evidence-backed, finality-safe settlement. GenLayer validators evaluate the facts; the rulebook fixes the economics.</div></aside>
      <main className="content"><div className="content-inner" id="overview">
        {!configured ? <div className="notice"><AlertTriangle /><div><strong>Deployment addresses required</strong><span>{missingConfigurationKeys().join(" · ")}<br />Set them in <code>frontend/.env.local</code>; no cached or placeholder contract state is shown.</span></div></div> : null}
        {readError ? <div className="banner" style={{ borderColor: "rgba(255,127,141,.25)", background: "rgba(255,127,141,.04)", color: "var(--red)" }}><AlertTriangle size={15} /><div><strong>Contract read failed</strong><span>{readError}</span></div></div> : null}
        <section className="hero"><div><div className="eyebrow"><span className="line" /> live settlement console</div><h1>Make automated work <em>accountable.</em></h1><p>SlashCourt is the evidence-to-settlement layer for bonded keepers. Independent validators evaluate a versioned rulebook, while a separate vault enforces only the fixed penalty that the commitment allowed.</p></div><div className="hero-rail"><div className="hero-rail-title"><span>Decision boundary</span><span style={{ color: "var(--cyan)" }}>R1—R7</span></div><strong>Facts first. Money last.</strong><small>Accepted resolutions are provisional. The vault receives its settlement message only at finality, and appeals remain a real network operation.</small></div></section>
        <section className="stats-grid"><Metric label="Bonded operators" value={dashboard?.vaultStatistics ? String(dashboard.vaultStatistics.total_operators) : "—"} foot="application registry" tone="cyan" /><Metric label="Total bond" value={amount(dashboard?.vaultStatistics?.total_bond)} foot="application-layer GEN" tone="cyan" /><Metric label="Locked exposure" value={amount(dashboard?.vaultStatistics?.locked_exposure)} foot="commitment-level cap" tone="purple" /><Metric label="Open cases" value={stats ? String(stats.open_cases) : "—"} foot={stats ? `${stats.ready_cases} ready for adjudication` : "awaiting network"} tone="amber" /><Metric label="Finalized" value={stats ? String(stats.applied_cases) : "—"} foot={stats ? `${stats.cancelled_cases} cancelled` : "no cached data"} tone="green" /><Metric label="Penalties applied" value={amount(dashboard?.vaultStatistics?.total_penalties_applied)} foot={stats?.current_rulebook_version ? `rulebook v${stats.current_rulebook_version}` : "hash-pinned policy"} tone="red" /></section>
        <div className="section-heading"><div><h2>Recent case activity</h2><p>Every row is read from SlashCourt state, never inferred from a UI fixture.</p></div><div style={{ display: "flex", gap: 8, alignItems: "center" }}><span className="mono">{loading ? "syncing…" : `${cases.length} loaded`}</span><button className="ghost-button" onClick={() => void refresh()} disabled={loading}><RefreshCw size={13} className={loading ? "spin" : ""} /></button></div></div>
        <div className="dashboard-grid"><section className="panel" id="cases"><div className="panel-header"><div className="panel-title"><Activity /> Case ledger</div><span className="panel-kicker">provisional → final</span></div><div className="panel-body">{cases.length ? <div className="cases-list">{cases.map((item) => <CaseRow item={item} key={item.case_id} onOpen={() => setSelectedCase(item)} />)}</div> : <EmptyState configured={configured} onConnect={() => void wallet.connect()} />}</div></section><div style={{ display: "grid", gap: 14 }}><RulebookCard dashboard={dashboard} /><section className="panel" id="evidence"><div className="panel-header"><div className="panel-title"><Database /> Evidence perimeter</div><span className="panel-kicker">allowlist</span></div><div className="panel-body">{dashboard?.domains.length ? <><div className="form-help" style={{ marginBottom: 10 }}>Validators may fetch only approved HTTPS sources. Raw IPs, localhost and unapproved domains are rejected by the contract.</div><div className="rule-tags">{dashboard.domains.map((domain) => <span className="rule-tag" key={domain}><Link2 size={10} style={{ verticalAlign: "-1px" }} /> {domain}</span>)}</div></> : <div className="form-help">Approved domains will appear after the deployment configuration is readable.</div>}</div></section></div></div>
        <div className="section-heading" id="operators"><div><h2>Operator rail</h2><p>Bond is committed before a beneficiary can open a case; only available funds can be withdrawn.</p></div></div><div className="dashboard-grid"><section className="panel"><div className="panel-header"><div className="panel-title"><Users /> Connected operator</div><span className="panel-kicker">vault state + actions</span></div><div className="panel-body">{dashboard?.operator?.registered ? <div className="cases-list"><div className="case-row"><div className="case-id">{formatAddress(dashboard.operator.address, 22)}</div><div className="case-meta"><span>total {amount(dashboard.operator.total_bond)} GEN</span><span>available {amount(dashboard.operator.available_bond)} GEN</span><span>awards {amount(dashboard.operator.claimable_awards)} GEN</span></div><div className="verdict"><span className="verdict-label">active commitments</span><strong className="amber">{dashboard.operator.active_commitments}</strong></div></div></div> : <div className="empty-state"><CircleDollarSign /><h3>Connect a registered operator</h3><p>Wallet-scoped bond and exposure readouts appear here. The vault keeps the accounting, not the browser.</p></div>}<div style={{ marginTop: 18, paddingTop: 17, borderTop: "1px solid var(--line)" }}><OperatorActions configured={configured} walletConnected={wallet.connected} address={wallet.address} busy={busy} onSend={(action, label) => runTransaction(null, action, label)} /></div></div></section><Intake configured={configured} walletConnected={wallet.connected} onSubmit={submitCase} busy={busy} /></div>
        <p className="footer-note">SlashCourt is an application-layer settlement protocol, separate from GenLayer’s native validator staking and slashing. Financial state changes are finality-safe child messages. <a href="https://docs.genlayer.com" target="_blank" rel="noreferrer" style={{ color: "var(--cyan)" }}>Read the GenLayer docs <ArrowUpRight size={10} style={{ verticalAlign: "-1px" }} /></a></p>
      </div></main></div>
    {selectedCase ? <CaseModal item={selectedCase} tx={transactions[selectedCase.case_id]} onClose={() => setSelectedCase(null)} onAction={caseAction} busy={busy} /> : null}
    <style jsx global>{`.spin { animation: slashcourt-spin 1s linear infinite; } @keyframes slashcourt-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } } code { font-family: "DM Mono", monospace; color: var(--soft); }`}</style>
  </div>;
}
