import type { AppealEligibility } from "./types";

export type AppealTracePhase =
  | "submitted"
  | "accepted"
  | "monitor_started"
  | "eligibility"
  | "finalized"
  | "stopped";

export type AppealTraceObservation = {
  observedAt: string;
  network: string;
  courtAddress: string;
  vaultAddress: string;
  transactionHash: string;
  phase: AppealTracePhase;
  receiptStatus: string;
  eligibility: AppealEligibility;
  error?: string;
  reason?: string;
};

export function appealTraceStorageKey(network: string, courtAddress: string, vaultAddress: string) {
  return `slashcourt:appeal-trace:${network}:${courtAddress}:${vaultAddress}`;
}

export function appendAppealTrace(
  history: AppealTraceObservation[] | undefined,
  observation: AppealTraceObservation,
) {
  return [...(history || []), observation].slice(-100);
}

export function exportAppealTrace(trace: AppealTraceObservation[]) {
  if (typeof window === "undefined" || !trace.length) return false;
  const first = trace[0];
  const payload = {
    exportedAt: new Date().toISOString(),
    network: first.network,
    courtAddress: first.courtAddress,
    vaultAddress: first.vaultAddress,
    transactionHash: first.transactionHash,
    observations: trace,
    note: "Observed browser workflow evidence. Eligibility is recorded only when the RPC returned true; finality does not imply an eligible appeal window.",
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `slashcourt-appeal-trace-${first.transactionHash.slice(0, 10)}.json`;
  link.click();
  URL.revokeObjectURL(url);
  return true;
}
