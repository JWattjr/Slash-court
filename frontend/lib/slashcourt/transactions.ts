import type { AppealEligibility, TxSnapshot } from "./types";
import type { AppealTraceObservation } from "./appealDiagnostics";

const TERMINAL_STATUSES = new Set(["FINALIZED", "CANCELED", "CANCELLED"]);

type AppealSdk = {
  canAppeal: (args: { txId: `0x${string}` }) => Promise<boolean>;
  getAppealCharge?: (args: { txId: `0x${string}` }) => Promise<bigint>;
  getMinAppealBond?: (args: { txId: `0x${string}` }) => Promise<bigint>;
  appealTransaction: (args: {
    txId: `0x${string}`;
    value: bigint;
  }) => Promise<unknown>;
};

type AppealTrackingClient = {
  snapshot: (hash: string, kind: TxSnapshot["kind"]) => Promise<TxSnapshot>;
  waitForAppealWindow: (
    hash: string,
    kind: TxSnapshot["kind"],
  ) => Promise<TxSnapshot>;
};

export type AppealMonitorOptions = {
  network?: string;
  courtAddress?: string;
  vaultAddress?: string;
  intervalMs?: number;
  maxDurationMs?: number;
  signal?: AbortSignal;
  onSubmitted?: (hash: string) => void;
  onObservation?: (observation: AppealTraceObservation) => void;
};

export type AppealTrackingResult = {
  accepted: TxSnapshot;
  /** Resolves when finality/cancellation is observed or the bounded monitor stops. */
  finalized: Promise<TxSnapshot>;
  /** Alias that makes the background lifecycle explicit to callers. */
  monitoring: Promise<TxSnapshot>;
};

export function transactionStorageKey(network: string, court: string, vault: string) {
  return `slashcourt:transactions:${network}:${court}:${vault}`;
}

export function mergeTransaction(history: TxSnapshot[] | undefined, snapshot: TxSnapshot) {
  const entries = history || [];
  const existing = entries.find((entry) => entry.hash === snapshot.hash);
  if (existing) {
    const existingTerminal = isTerminalTransaction(existing);
    const nextTerminal = isTerminalTransaction(snapshot);
    const existingRank = statusRank(existing.status);
    const nextRank = statusRank(snapshot.status);
    if (existingTerminal && !nextTerminal) return entries;
    if (!nextTerminal && existingRank > nextRank) return entries;
    if (existingRank === nextRank && existing.updatedAt > snapshot.updatedAt) return entries;
    // A transient eligibility read must not erase a verified eligible window.
    if (existing.appealEligibility === "eligible" && snapshot.appealEligibility === "unknown") return entries;
  }
  return [...entries.filter((entry) => entry.hash !== snapshot.hash), snapshot].slice(-20);
}

function statusRank(status: string) {
  const normalized = status.toUpperCase();
  if (["FINALIZED", "CANCELED", "CANCELLED"].includes(normalized)) return 5;
  if (normalized === "ACCEPTED") return 4;
  if (["PENDING", "PROPOSING", "ADJUDICATING", "CONSENSUS_PENDING"].includes(normalized)) return 3;
  if (normalized === "SUBMITTED") return 2;
  return 1;
}

export function isTerminalTransaction(snapshot: Pick<TxSnapshot, "status">) {
  return TERMINAL_STATUSES.has(snapshot.status.toUpperCase());
}

export function appealEligibility(snapshot: TxSnapshot): AppealEligibility {
  if (isTerminalTransaction(snapshot)) return "ineligible";
  if (snapshot.appealEligibility) return snapshot.appealEligibility;
  if (snapshot.appealable) return "eligible";
  return "unknown";
}

export function findAppealableAdjudication(history: TxSnapshot[] | undefined) {
  return [...(history || [])]
    .reverse()
    .find(
      (entry) =>
        entry.kind === "adjudication" &&
        entry.status.toUpperCase() === "ACCEPTED" &&
        appealEligibility(entry) === "eligible",
    );
}

export function findLatestAdjudication(history: TxSnapshot[] | undefined) {
  return [...(history || [])].reverse().find((entry) => entry.kind === "adjudication");
}

export function findRefreshableAdjudications(history: TxSnapshot[] | undefined) {
  return (history || []).filter(
    (entry) => entry.kind === "adjudication" && !isTerminalTransaction(entry),
  );
}

function trace(
  hash: string,
  phase: AppealTraceObservation["phase"],
  snapshot: Pick<TxSnapshot, "status" | "appealEligibility">,
  options: AppealMonitorOptions,
  extra: Pick<AppealTraceObservation, "reason" | "error"> = {},
) {
  options.onObservation?.({
    observedAt: new Date().toISOString(),
    network: options.network || "unknown",
    courtAddress: options.courtAddress || "unknown",
    vaultAddress: options.vaultAddress || "unknown",
    transactionHash: hash,
    phase,
    receiptStatus: snapshot.status,
    eligibility: snapshot.appealEligibility || "unknown",
    ...extra,
  });
}

function wait(ms: number, signal?: AbortSignal) {
  if (signal?.aborted) return Promise.resolve(false);
  return new Promise<boolean>((resolve) => {
    const timer = setTimeout(() => {
      signal?.removeEventListener("abort", onAbort);
      resolve(true);
    }, ms);
    const onAbort = () => {
      clearTimeout(timer);
      signal?.removeEventListener("abort", onAbort);
      resolve(false);
    };
    signal?.addEventListener("abort", onAbort, { once: true });
  });
}

async function monitorAppealWindow(
  client: AppealTrackingClient,
  accepted: TxSnapshot,
  retain: (snapshot: TxSnapshot) => void,
  options: AppealMonitorOptions,
) {
  const intervalMs = Math.max(500, options.intervalMs ?? 3000);
  const maxDurationMs = Math.max(intervalMs, options.maxDurationMs ?? 5 * 60_000);
  const deadline = Date.now() + maxDurationMs;
  let latest = accepted;
  trace(accepted.hash, "monitor_started", accepted, options, { reason: "accepted retained; eligibility monitor started" });

  while (Date.now() < deadline && !options.signal?.aborted) {
    try {
      // snapshot performs one receipt read followed by one canAppeal read. The
      // loop is deliberately serial so transient eligibility failures do not
      // create overlapping RPC requests.
      const next = await client.snapshot(accepted.hash, accepted.kind);
      latest = next;
      retain(next);
      if (isTerminalTransaction(next)) {
        trace(accepted.hash, "finalized", next, options, { reason: "terminal receipt observed" });
        return next;
      }
      trace(accepted.hash, "eligibility", next, options, {
        error: next.appealEligibilityError,
        reason: next.appealEligibility === "unknown" ? "eligibility unavailable; retrying while nonterminal" : "eligibility observed",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Appeal monitor read failed.";
      trace(accepted.hash, "eligibility", latest, options, { error: message, reason: "read failed; retrying while nonterminal" });
    }
    const remaining = Math.max(0, Math.min(intervalMs, deadline - Date.now()));
    if (!(await wait(remaining, options.signal))) break;
  }

  const reason = options.signal?.aborted ? "monitor aborted by lifecycle change" : "bounded appeal monitor limit reached";
  trace(accepted.hash, "stopped", latest, options, { reason });
  return latest;
}

export async function requestVerifiedAppeal(sdk: AppealSdk, txHash: string) {
  const txId = txHash as `0x${string}`;
  let eligible: boolean;
  try {
    eligible = await sdk.canAppeal({ txId });
  } catch (error) {
    const detail = error instanceof Error ? ` ${error.message}` : "";
    throw new Error(
      `Appeal eligibility is temporarily unavailable; no appeal was submitted.${detail}`,
    );
  }
  if (!eligible) {
    throw new Error("The adjudication is no longer appealable; no appeal was submitted.");
  }
  const getCharge = sdk.getAppealCharge || sdk.getMinAppealBond;
  if (!getCharge) throw new Error("The connected GenLayer SDK cannot calculate the appeal bond.");
  const value = await getCharge.call(sdk, { txId });
  return String(await sdk.appealTransaction({ txId, value }));
}

export async function trackAppealableTransaction(
  client: AppealTrackingClient,
  hash: string,
  kind: TxSnapshot["kind"],
  retain: (snapshot: TxSnapshot) => void,
  options: AppealMonitorOptions = {},
): Promise<AppealTrackingResult> {
  // Do not perform a canAppeal read before the ACCEPTED receipt. The exact
  // ACCEPTED snapshot must be retained even when eligibility RPC is slow or
  // temporarily unavailable.
  const accepted = await client.waitForAppealWindow(hash, kind);
  retain(accepted);
  trace(hash, "accepted", accepted, options, { reason: "accepted receipt retained before eligibility read" });
  const monitoring = monitorAppealWindow(client, accepted, retain, options);
  return { accepted, finalized: monitoring, monitoring };
}

export async function submitAndTrackAppealableTransaction(
  action: () => Promise<string>,
  client: AppealTrackingClient,
  kind: TxSnapshot["kind"],
  retain: (snapshot: TxSnapshot) => void,
  options: AppealMonitorOptions = {},
  startMonitor?: (
    hash: string,
    retain: (snapshot: TxSnapshot) => void,
    options: AppealMonitorOptions,
  ) => Promise<AppealTrackingResult>,
) {
  const hash = String(await action());
  options.onSubmitted?.(hash);
  const submitted: TxSnapshot = {
    hash,
    status: "SUBMITTED",
    execution: "PENDING",
    appealable: false,
    appealEligibility: "unknown",
    success: false,
    kind,
    updatedAt: Date.now(),
  };
  retain(submitted);
  trace(hash, "submitted", submitted, options, { reason: "wallet transaction hash retained" });
  const tracked = await (startMonitor
    ? startMonitor(hash, retain, options)
    : trackAppealableTransaction(client, hash, kind, retain, options));
  return { hash, submitted, ...tracked };
}
