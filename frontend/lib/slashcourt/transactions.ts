import type { AppealEligibility, TxSnapshot } from "./types";

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
  wait: (hash: string, kind: TxSnapshot["kind"]) => Promise<TxSnapshot>;
};

export function transactionStorageKey(network: string, court: string, vault: string) {
  return `slashcourt:transactions:${network}:${court}:${vault}`;
}

export function mergeTransaction(history: TxSnapshot[] | undefined, snapshot: TxSnapshot) {
  return [...(history || []).filter((entry) => entry.hash !== snapshot.hash), snapshot].slice(-20);
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
) {
  try {
    retain(await client.snapshot(hash, kind));
  } catch {
    // The ACCEPTED wait below remains authoritative if the provisional read fails.
  }
  const accepted = await client.waitForAppealWindow(hash, kind);
  retain(accepted);
  const finalized = client.wait(hash, kind).then((snapshot) => {
    retain(snapshot);
    return snapshot;
  });
  return { accepted, finalized };
}
