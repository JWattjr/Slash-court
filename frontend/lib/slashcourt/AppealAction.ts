"use client";

import { createElement } from "react";

import type { TxSnapshot } from "./types";

export function AppealAction({
  transaction,
  busy,
  enabled,
  onAppeal,
}: {
  transaction?: TxSnapshot;
  busy: boolean;
  enabled: boolean;
  onAppeal: (hash: string) => void;
}) {
  if (!transaction || transaction.kind !== "adjudication" || transaction.status.toUpperCase() !== "ACCEPTED") return null;
  if (transaction.appealEligibility !== "eligible" && !(transaction.appealEligibility === undefined && transaction.appealable)) return null;

  return createElement(
    "button",
    {
      className: "primary-button",
      "data-appeal-target": transaction.hash,
      disabled: busy || !enabled,
      onClick: () => onAppeal(transaction.hash),
    },
    "Appeal accepted adjudication",
  );
}
