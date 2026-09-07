import type { TxSnapshot } from "./types";

export function transactionStorageKey(network: string, court: string, vault: string) {
  return `slashcourt:transactions:${network}:${court}:${vault}`;
}

export function mergeTransaction(history: TxSnapshot[] | undefined, snapshot: TxSnapshot) {
  return [...(history || []).filter((entry) => entry.hash !== snapshot.hash), snapshot].slice(-20);
}

export function findAppealableAdjudication(history: TxSnapshot[] | undefined) {
  return [...(history || [])]
    .reverse()
    .find((entry) => entry.kind === "adjudication" && entry.appealable);
}
