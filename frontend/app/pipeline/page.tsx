"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { ArrowRight, Scale } from "lucide-react";
import { useWallet, formatAddress } from "@/lib/genlayer/WalletProvider";
import { PipelineClient, pipelineAddresses, pipelineConfigured, type Job, type Case, type Profile } from "@/lib/pipeline/client";
import { explorerContract, explorerTransaction } from "@/lib/pipeline/explorer.mjs";
import { AppealAction } from "@/lib/slashcourt/AppealAction";
import { mergeTransaction, isTerminalTransaction, trackAppealableTransaction } from "@/lib/slashcourt/transactions";
import type { TxSnapshot } from "@/lib/slashcourt/types";
import styles from "./pipeline.module.css";

const HISTORY = `slashcourt:pipeline:61999:${Object.values(pipelineAddresses).join(":")}`;
const DEFAULT_STEPS = [{step_id: "A", operator: "", duty: "Redact all email addresses from received source text."},
  {step_id: "B", operator: "", duty: "Uppercase names, preserving contact values exactly as received."},
  {step_id: "C", operator: "", duty: "Export received CSV bytes without alteration."}];

export default function PipelinePage() {
  const wallet = useWallet();
  const client = useMemo(() => pipelineConfigured ? new PipelineClient(wallet.address || undefined) : null, [wallet.address]);
  const [ids, setIds] = useState<string[]>([]);
  const [id, setId] = useState("");
  const [offset, setOffset] = useState(0);
  const [job, setJob] = useState<Job | null>(null);
  const [caseData, setCaseData] = useState<Case | null>(null);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [history, setHistory] = useState<TxSnapshot[]>([]);
  const [proof, setProof] = useState<{status: string; cases?: {id: string; outcome: string; adjudicationHash: string}[]} | null>(null);
  const [charter, setCharter] = useState("Each operator performs only its own frozen local duty on the input it received. Never introduce email addresses. Faithful propagation of inherited data is allowed where filtering is not assigned.");
  const [steps, setSteps] = useState(DEFAULT_STEPS);
  const [jobId, setJobId] = useState("");
  const [baseBond, setBaseBond] = useState("10");
  const [filingBond, setFilingBond] = useState("3");
  const [fundingDeadline, setFundingDeadline] = useState("");
  const [evidenceDeadline, setEvidenceDeadline] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [stepId, setStepId] = useState("A");
  const [record, setRecord] = useState({input_url: "", output_url: "", input_digest: "", output_digest: ""});
  const [participant, setParticipant] = useState("");
  const [claimHash, setClaimHash] = useState("");
  const mounted = useRef(false);
  const readGeneration = useRef(0);
  const refreshRef = useRef<() => Promise<void>>(async () => {});
  const monitors = useRef(new Map<string, AbortController>());

  const refresh = useCallback(async () => {
    if (!client) return;
    const generation = ++readGeneration.current;
    setLoading(true);
    setError("");
    const outcomes = await Promise.allSettled([client.list(offset), id ? client.job(id) : Promise.resolve(null), id ? client.case(id) : Promise.resolve(null)]);
    if (!mounted.current || generation !== readGeneration.current) return;
    const failures: string[] = [];
    if (outcomes[0].status === "fulfilled") setIds(outcomes[0].value); else failures.push("Case index unavailable");
    if (outcomes[1].status === "fulfilled") setJob(outcomes[1].value); else {setJob(null); failures.push("Current charter/accounting unavailable");}
    if (outcomes[2].status === "fulfilled") setCaseData(outcomes[2].value); else {setCaseData(null); failures.push("Assessment unavailable");}
    setError(failures.join(". "));
    setLoading(false);
  }, [client, id, offset]);
  useEffect(() => {refreshRef.current = refresh;}, [refresh]);

  useEffect(() => {
    mounted.current = true;
    const navigate = () => {readGeneration.current++; setJob(null); setCaseData(null); setId(new URLSearchParams(location.hash.slice(1)).get("case") || "");};
    navigate();
    window.addEventListener("hashchange", navigate);
    void fetch("/pipeline-proof.json").then(r => {if (!r.ok) throw new Error("Proof unavailable"); return r.json();}).then(setProof).catch(() => setProof(null));
    return () => {mounted.current = false; readGeneration.current++; window.removeEventListener("hashchange", navigate);};
  }, []);
  useEffect(() => {void refresh();}, [refresh]);
  useEffect(() => {
    if (!client || !job) {setProfiles([]); return;}
    let cancelled = false;
    void Promise.allSettled(job.steps.map(s => client.profile(s.operator))).then(results => {
      if (!cancelled) setProfiles(results.flatMap(r => r.status === "fulfilled" ? [r.value] : []));
    });
    return () => {cancelled = true;};
  }, [client, job]);

  const save = useCallback((tx: TxSnapshot) => {
    setHistory(previous => {const next = mergeTransaction(previous, tx); localStorage.setItem(HISTORY, JSON.stringify(next)); return next;});
  }, []);
  const monitor = useCallback(async (hash: string, kind: TxSnapshot["kind"], signal?: AbortSignal) => {
    if (!client || monitors.current.has(hash)) return;
    const controller = new AbortController();
    signal?.addEventListener("abort", () => controller.abort(), {once: true});
    monitors.current.set(hash, controller);
    try {
      const tracked = await trackAppealableTransaction(client.tracker, hash, kind, save, {signal: controller.signal, maxDurationMs: 240_000, intervalMs: 4000});
      await tracked.finalized;
      if (!controller.signal.aborted) await refreshRef.current();
    } catch (e) {if (!controller.signal.aborted) setError(`Tracking paused; retained hash can be resumed. ${e instanceof Error ? e.message : e}`);}
    finally {monitors.current.delete(hash);}
  }, [client, save]);

  useEffect(() => {
    if (!client) return;
    const abort = new AbortController();
    try {
      const stored: TxSnapshot[] = JSON.parse(localStorage.getItem(HISTORY) || "[]");
      setHistory(stored);
      for (const tx of stored.filter(t => !isTerminalTransaction(t))) void monitor(tx.hash, tx.kind, abort.signal);
    } catch {setError("Saved transaction history could not be read");}
    return () => {abort.abort(); for (const controller of monitors.current.values()) controller.abort(); monitors.current.clear();};
  }, [client, monitor]);

  async function submit(contract: "charter" | "court" | "record", method: string, args: (string | number)[], value = 0n) {
    if (!client || busy || !wallet.onGenLayer) return false;
    setBusy(true);
    setError("");
    try {
      const hash = await client.write(contract, method, args, value);
      const kind = method === "adjudicate" || method === "compile" ? "adjudication" : "operator";
      save({hash, kind, status: "SUBMITTED", execution: "UNKNOWN", success: false, appealable: false, appealEligibility: "unknown", updatedAt: Date.now()});
      setBusy(false);
      void monitor(hash, kind);
      return true;
    } catch (e) {setError(e instanceof Error ? e.message : String(e)); setBusy(false); return false;}
  }

  function select(next: string) {readGeneration.current++; setJob(null); setCaseData(null); setId(next); location.hash = `case=${encodeURIComponent(next)}`;}
  const canWrite = Boolean(client && wallet.connected && wallet.onGenLayer && !busy && !loading);
  const ownStep = job?.steps.find(s => s.operator.toLowerCase() === wallet.address?.toLowerCase());
  const now = Date.now() / 1000;
  const accepted = [...history].reverse().find(t => t.kind === "adjudication" && t.status === "ACCEPTED");
  async function compile() {
    const numbers = [baseBond, filingBond].map(Number);
    const dates = [fundingDeadline, evidenceDeadline, deadline].map(d => Math.floor(new Date(d).getTime() / 1000));
    if (numbers.some(n => !Number.isSafeInteger(n) || n <= 0) || dates.some(n => !Number.isFinite(n))) {setError("Enter positive whole wei amounts and all three UTC deadlines."); return;}
    if (await submit("charter", "compile", [jobId, charter, JSON.stringify(steps), ...numbers, ...dates])) select(jobId);
  }

  return <div className="app-shell" data-source-revision={process.env.NEXT_PUBLIC_SLASHCOURT_SOURCE_REVISION || "local-candidate"}>
    <header className="topbar"><Link href="/" className="brand"><span className="brand-mark"><Scale /></span><strong>SlashCourt</strong></Link><div className="top-actions"><Link href="/#explorer">Single-operator cases</Link><button className="wallet-button" disabled={wallet.connecting} onClick={() => void wallet.connect().catch(e => setError(String(e)))}>{wallet.address ? formatAddress(wallet.address) : "Connect wallet"}</button></div></header>
    <main className={`content ${styles.main}`}>
      <h1>Find the first broken duty.</h1>
      <p className={styles.intro}>Pipeline cases judge each operator against the input it received. Only the earliest proven violation pays; earlier uncertainty protects every bond.</p>
      <p>Built for <a href="https://internetcourt.org/">Internet Court job disputes</a>. Demonstration incidents are synthetic.</p>
      <nav className={styles.nav} aria-label="Pipeline navigation"><a href="#cases">Pipeline cases</a><a href="#builder">Charter builder</a><a href="#operators">Operator records</a><a href="#transactions">Transactions</a></nav>
      {!pipelineConfigured && <p className={styles.notice}>Pipeline contracts are not deployed/configured. The original SlashCourt remains available. No live pipeline balances or outcomes are claimed.</p>}
      {error && <p role="alert" className={styles.notice}>{error}. Use Refresh to retry.</p>}
      <section id="cases"><div className={styles.heading}><h2>Pipeline cases</h2><button className="ghost-button" disabled={!client || loading} onClick={() => void refresh()}>{loading ? "Refreshing…" : "Refresh"}</button></div>
        <div className={styles.nav}>{ids.map(value => <button className="ghost-button" key={value} onClick={() => select(value)} aria-pressed={value === id}>{value}</button>)}<button className="ghost-button" disabled={!client || offset === 0} onClick={() => setOffset(Math.max(0, offset - 8))}>Previous</button><button className="ghost-button" disabled={ids.length < 8} onClick={() => setOffset(offset + 8)}>Next</button></div>
        {!job && <p>{loading ? "Reading selected charter…" : id ? "Selected charter is unavailable. Financial actions are disabled." : "Select a case to inspect its charter, evidence, and outcome."}</p>}
        {job && <><h3>{job.id}: {job.outcome || job.status}</h3><p>{job.charter}</p><p>Refund deadline: {new Date(job.deadline * 1000).toISOString()}</p>
          {!!job.rejection_reasons?.length && <p role="status">Rejected: {job.rejection_reasons.join(", ")}</p>}
          <ol className={styles.pipeline} aria-label="Ordered pipeline assessment">{job.steps.map((step, index) => {
            const row = caseData?.assessment?.steps[index], evidence = job.records[step.step_id];
            return <li key={step.step_id} className={job.liable_index === index && job.outcome === "PIPELINE_FAULT" ? styles.fault : ""}>
              <div className={styles.stepHeading}><h3>{step.step_id}</h3>{index < job.steps.length - 1 && <ArrowRight aria-hidden="true" />}</div><p>{step.duty}</p>
              <p><strong>{row?.effective_verdict || "Not assessed"}</strong>{caseData?.assessment && !caseData.finalized ? " · Provisional" : ""}</p>
              {row?.quote && <blockquote>“{row.quote}”</blockquote>}
              <dl><dt>Required bond</dt><dd>{step.bond_units} wei</dd><dt>Posted</dt><dd>{job.deposits[step.operator] ?? "Not posted"}</dd><dt>Settlement credit</dt><dd>{job.credits[step.operator] ?? (["SETTLING", "FINAL"].includes(job.status) ? 0 : "Unavailable until settlement")}</dd><dt>Verified paid</dt><dd>{job.paid[step.operator] ?? "Not verified"}</dd></dl>
              {evidence && <div><a href={evidence.input_url} target="_blank" rel="noreferrer">Received input</a> · <a href={evidence.output_url} target="_blank" rel="noreferrer">Produced output</a></div>}
              <details><summary>Operator and commitment</summary><code>{step.operator}</code><p>{job.digest}</p></details>
            </li>;
          })}</ol>
          <div className={styles.controls}>
            <button className="primary-button" disabled={!canWrite || job.status !== "FUNDING" || !ownStep || now >= job.funding_deadline || !!job.deposits[ownStep.operator]} onClick={() => void submit("charter", "deposit", [id], BigInt(ownStep!.bond_units))}>Post my bond</button>
            <button className="ghost-button" disabled={!canWrite || job.status !== "DISPUTED" || !caseData || !!caseData.assessment || now >= job.deadline} onClick={() => void submit("court", "adjudicate", [id])}>Judge pipeline</button>
            <button className="ghost-button" disabled={!canWrite || !["FUNDING", "ACTIVE", "DISPUTED"].includes(job.status) || !(now >= (job.status === "FUNDING" ? job.funding_deadline : job.deadline) || (caseData?.finalized && caseData.outcome !== "UNATTRIBUTABLE"))} onClick={() => void submit("charter", "settle", [id])}>Settle or refund</button>
            <button className="ghost-button" disabled={!canWrite || job.status !== "FINAL"} onClick={() => void submit("record", "sync", [id])}>Sync finalized record</button>
          </div>
          <details><summary>Record a step or file a dispute</summary><div className={styles.forms}><div><label>Assigned step<select value={stepId} onChange={e => setStepId(e.target.value)}>{job.steps.map(s => <option key={s.step_id}>{s.step_id}</option>)}</select></label>{Object.entries(record).map(([key, value]) => <label key={key}>{key.replaceAll("_", " ")}<input value={value} onChange={e => setRecord({...record, [key]: e.target.value})} /></label>)}<button className="ghost-button" disabled={!canWrite || job.status !== "ACTIVE" || ownStep?.step_id !== stepId || now >= job.evidence_deadline} onClick={() => void submit("charter", "record_step", [id, stepId, record.input_url, record.output_url, record.input_digest, record.output_digest])}>Freeze step evidence</button></div>
            <div><label>Incident description<textarea value={description} onChange={e => setDescription(e.target.value)} /></label><p>Filing bond: {job.filing_bond} wei. All-faithful decisions distribute it to the operators.</p><button className="ghost-button" disabled={!canWrite || job.status !== "ACTIVE" || !!ownStep || now < job.evidence_deadline || now >= job.deadline || !description.trim()} onClick={() => void submit("charter", "file_incident", [id, description], BigInt(job.filing_bond))}>File incident and bond</button></div></div></details>
          <details><summary>Pull claim and native-credit verification</summary><label>Recipient address<input value={participant} onChange={e => setParticipant(e.target.value)} /></label><button className="ghost-button" disabled={!canWrite || job.status !== "FINAL" || !job.credits[participant.toLowerCase()]} onClick={() => void submit("charter", "claim", [id, participant.toLowerCase(), (job.claims[participant.toLowerCase()]?.attempt || 0) + 1])}>Reserve and send claim</button><label>Claim transaction hash<input value={claimHash} onChange={e => setClaimHash(e.target.value)} /></label><button className="ghost-button" disabled={!canWrite || !/^0x[0-9a-fA-F]{64}$/.test(claimHash)} onClick={() => void submit("charter", "verify_claim", [id, participant, claimHash])}>Verify native credit</button></details>
        </>}
      </section>
      <section id="builder"><h2>Charter builder</h2><p>Validators reject subjective, overlapping, or unobservable duties before any bond can be posted.</p><div className={styles.forms}><div><label>Job identifier<input value={jobId} onChange={e => setJobId(e.target.value)} /></label><label>Plain-English charter<textarea rows={5} value={charter} onChange={e => setCharter(e.target.value)} /></label>{steps.map((step, i) => <fieldset key={step.step_id}><legend>Step {step.step_id}</legend><label>Operator address<input value={step.operator} onChange={e => setSteps(steps.map((s, n) => n === i ? {...s, operator: e.target.value} : s))} /></label><label>Local duty<textarea value={step.duty} onChange={e => setSteps(steps.map((s, n) => n === i ? {...s, duty: e.target.value} : s))} /></label></fieldset>)}<div className={styles.controls}><button className="ghost-button" disabled={steps.length >= 5} onClick={() => setSteps([...steps, {step_id: String.fromCharCode(65 + steps.length), operator: "", duty: ""}])}>Add step</button><button className="ghost-button" disabled={steps.length <= 2} onClick={() => setSteps(steps.slice(0, -1))}>Remove last step</button></div></div><div><label>Base bond (wei)<input inputMode="numeric" value={baseBond} onChange={e => setBaseBond(e.target.value)} /></label><label>Filing bond (wei)<input inputMode="numeric" value={filingBond} onChange={e => setFilingBond(e.target.value)} /></label>{[["Funding deadline (UTC)", fundingDeadline, setFundingDeadline], ["Evidence deadline (UTC)", evidenceDeadline, setEvidenceDeadline], ["Refund deadline (UTC)", deadline, setDeadline]].map(([label, value, setter]) => <label key={label as string}>{label as string}<input placeholder="2026-11-12T12:00:00Z" value={value as string} onChange={e => (setter as (s: string) => void)(e.target.value)} /></label>)}<p>History pricing: 0 violations = 1×, 1 = 2×, 2 or more = 4×. The compiled charter freezes each operator’s required bond.</p><button className="primary-button" disabled={!canWrite || !jobId || steps.some(s => !/^0x[0-9a-fA-F]{40}$/.test(s.operator))} onClick={() => void compile()}>Compile charter</button></div></div></section>
      <section id="operators"><h2>Operator records</h2><p>Only finalized settlements update these records. A void records uncertainty, not misconduct.</p>{profiles.length ? <ul>{profiles.map(p => <li key={p.operator}><code>{p.operator}</code>: {p.cases} cases · {p.violations} violations · {p.faithful_steps} faithful steps · {p.voids} voids · next bond {p.bond_multiplier}×</li>)}</ul> : <p>Select a case to read its operator records. Unavailable profiles are withheld.</p>}</section>
      <section id="transactions"><h2>Transactions and appeal window</h2><p>Submitted and accepted results remain provisional. Reload recovers pending hashes; finalized success is distinct from finalized execution error.</p><AppealAction transaction={accepted} busy={busy} enabled={Boolean(client && wallet.connected && wallet.onGenLayer)} onAppeal={hash => {if (!client) return; setBusy(true); void client.tracker.appeal(hash).then(next => {setBusy(false); save({hash: next, kind: "appeal", status: "SUBMITTED", execution: "UNKNOWN", success: false, appealable: false, updatedAt: Date.now()}); void monitor(next, "appeal");}).catch(e => {setBusy(false); setError(String(e));});}} />
        <ul>{history.map(t => <li key={t.hash}><a href={explorerTransaction(t.hash)}>{formatAddress(t.hash, 24)}</a> · {t.status === "FINALIZED" ? t.success ? "Finalized success" : "Finalized error" : t.status} · {t.execution}{!isTerminalTransaction(t) && <button className="ghost-button" onClick={() => void monitor(t.hash, t.kind)}>Resume tracking</button>}</li>)}</ul>
      </section>
      <section><h2>Recorded proof</h2><p>This section is a published snapshot, separate from current RPC reads.</p>{proof?.status === "LIVE_PASS" ? <ul>{proof.cases?.map(c => <li key={c.id}><a href={explorerTransaction(c.adjudicationHash)}>{c.id}: {c.outcome}</a></li>)}</ul> : <p>No verified Pipeline Court live release has been published.</p>}
        {pipelineConfigured && <ul>{Object.entries(pipelineAddresses).map(([role, address]) => <li key={role}><a href={explorerContract(address)}>{role} contract — {address}</a></li>)}</ul>}
      </section>
    </main>
  </div>;
}
