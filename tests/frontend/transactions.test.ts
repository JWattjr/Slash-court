import assert from "node:assert/strict";
import test from "node:test";

import {
  findAppealableAdjudication,
  mergeTransaction,
  transactionStorageKey,
} from "../../frontend/lib/slashcourt/transactions.ts";
import type { TxSnapshot } from "../../frontend/lib/slashcourt/types.ts";

function snapshot(hash: string, overrides: Partial<TxSnapshot> = {}): TxSnapshot {
  return {
    hash,
    status: "ACCEPTED",
    execution: "SUCCESS",
    appealable: false,
    success: true,
    kind: "operator",
    updatedAt: 1,
    ...overrides,
  };
}

test("transaction history is deployment-scoped and replaces snapshots by hash", () => {
  assert.equal(
    transactionStorageKey("studionet", "0xcourt", "0xvault"),
    "slashcourt:transactions:studionet:0xcourt:0xvault",
  );
  const first = snapshot("0x1", { status: "SUBMITTED", success: false });
  const accepted = snapshot("0x1", { kind: "adjudication", appealable: true });
  assert.deepEqual(mergeTransaction([first], accepted), [accepted]);
});

test("the latest retained appealable adjudication is the appeal target", () => {
  const history = [
    snapshot("0xold", { kind: "adjudication", appealable: true }),
    snapshot("0xresponse", { kind: "response" }),
    snapshot("0xcurrent", { kind: "adjudication", appealable: true, updatedAt: 3 }),
  ];
  assert.equal(findAppealableAdjudication(history)?.hash, "0xcurrent");
  assert.equal(
    findAppealableAdjudication([snapshot("0xfinal", { kind: "adjudication", appealable: false })]),
    undefined,
  );
});
