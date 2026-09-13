import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AppealAction } from "../../frontend/lib/slashcourt/AppealAction.ts";
import {
  appealEligibility,
  findAppealableAdjudication,
  findRefreshableAdjudications,
  mergeTransaction,
  requestVerifiedAppeal,
  trackAppealableTransaction,
  transactionStorageKey,
} from "../../frontend/lib/slashcourt/transactions.ts";
import type { TxSnapshot } from "../../frontend/lib/slashcourt/types.ts";

function snapshot(hash: string, overrides: Partial<TxSnapshot> = {}): TxSnapshot {
  return {
    hash,
    status: "ACCEPTED",
    execution: "SUCCESS",
    appealable: false,
    appealEligibility: "unknown",
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
  const accepted = snapshot("0x1", {
    kind: "adjudication",
    appealable: true,
    appealEligibility: "eligible",
  });
  assert.deepEqual(mergeTransaction([first], accepted), [accepted]);
});

test("an accepted adjudication remains the appeal target after an unrelated transaction", () => {
  const accepted = snapshot("0xcurrent", {
    kind: "adjudication",
    appealable: true,
    appealEligibility: "eligible",
    updatedAt: 2,
  });
  const history = mergeTransaction(
    [snapshot("0xold", { kind: "adjudication", status: "FINALIZED" }), accepted],
    snapshot("0xresponse", { kind: "response", updatedAt: 3 }),
  );
  assert.equal(findAppealableAdjudication(history)?.hash, "0xcurrent");
});

test("terminal status overrides stale browser eligibility", () => {
  const finalized = snapshot("0xfinal", {
    kind: "adjudication",
    status: "FINALIZED",
    appealable: true,
    appealEligibility: "eligible",
  });
  assert.equal(appealEligibility(finalized), "ineligible");
  assert.equal(findAppealableAdjudication([finalized]), undefined);
});

test("legacy nonterminal adjudications are refreshed even when appealable was false", () => {
  const legacy = snapshot("0xlegacy", {
    kind: "adjudication",
    status: "ACCEPTED",
    appealable: false,
    appealEligibility: undefined,
  });
  assert.equal(appealEligibility(legacy), "unknown");
  assert.deepEqual(findRefreshableAdjudications([legacy]), [legacy]);
});

test("appeal submission fails closed when eligibility cannot be read", async () => {
  const calls: string[] = [];
  const sdk = {
    async canAppeal() {
      calls.push("canAppeal");
      throw new Error("RPC unavailable");
    },
    async getMinAppealBond() {
      calls.push("getMinAppealBond");
      return 1n;
    },
    async appealTransaction() {
      calls.push("appealTransaction");
      return "0xappeal";
    },
  };
  await assert.rejects(
    requestVerifiedAppeal(sdk, "0xadjudication"),
    /temporarily unavailable; no appeal was submitted/,
  );
  assert.deepEqual(calls, ["canAppeal"]);
});

test("appeal submission rechecks eligibility immediately before sending", async () => {
  const calls: string[] = [];
  const ineligibleSdk = {
    async canAppeal() {
      calls.push("canAppeal");
      return false;
    },
    async getMinAppealBond() {
      calls.push("getMinAppealBond");
      return 1n;
    },
    async appealTransaction() {
      calls.push("appealTransaction");
      return "0xappeal";
    },
  };
  await assert.rejects(
    requestVerifiedAppeal(ineligibleSdk, "0xadjudication"),
    /no longer appealable; no appeal was submitted/,
  );
  assert.deepEqual(calls, ["canAppeal"]);

  calls.length = 0;
  const eligibleSdk = {
    ...ineligibleSdk,
    async canAppeal() {
      calls.push("canAppeal");
      return true;
    },
  };
  assert.equal(await requestVerifiedAppeal(eligibleSdk, "0xadjudication"), "0xappeal");
  assert.deepEqual(calls, ["canAppeal", "getMinAppealBond", "appealTransaction"]);
});

test("appealable tracking returns after ACCEPTED and retains FINALIZED later", async () => {
  const retained: TxSnapshot[] = [];
  let resolveFinalized!: (snapshot: TxSnapshot) => void;
  const pendingFinality = new Promise<TxSnapshot>((resolve) => {
    resolveFinalized = resolve;
  });
  const provisional = snapshot("0xadjudication", {
    status: "PROPOSING",
    execution: "PENDING",
    success: false,
    kind: "adjudication",
  });
  const accepted = snapshot("0xadjudication", {
    status: "ACCEPTED",
    kind: "adjudication",
    appealable: true,
    appealEligibility: "eligible",
  });
  const finalized = snapshot("0xadjudication", {
    status: "FINALIZED",
    kind: "adjudication",
    appealable: false,
    appealEligibility: "ineligible",
  });
  const tracked = await trackAppealableTransaction(
    {
      async snapshot() {
        return provisional;
      },
      async waitForAppealWindow() {
        return accepted;
      },
      async wait() {
        return pendingFinality;
      },
    },
    accepted.hash,
    "adjudication",
    (entry) => retained.push(entry),
  );

  assert.equal(tracked.accepted.status, "ACCEPTED");
  assert.deepEqual(retained.map((entry) => entry.status), ["PROPOSING", "ACCEPTED"]);
  resolveFinalized(finalized);
  assert.equal((await tracked.finalized).status, "FINALIZED");
  assert.deepEqual(retained.map((entry) => entry.status), ["PROPOSING", "ACCEPTED", "FINALIZED"]);
});

test("rendered appeal action stays available while refresh and finality remain pending", async () => {
  const dashboardRefresh = new Promise<void>(() => {});
  const finality = new Promise<TxSnapshot>(() => {});
  const accepted = snapshot("0xretained-adjudication", {
    kind: "adjudication",
    status: "ACCEPTED",
    appealable: true,
    appealEligibility: "eligible",
  });
  let retained: TxSnapshot | undefined;

  const tracked = await trackAppealableTransaction(
    {
      async snapshot() {
        return accepted;
      },
      async waitForAppealWindow() {
        return accepted;
      },
      async wait() {
        return finality;
      },
    },
    accepted.hash,
    "adjudication",
    (entry) => {
      retained = entry;
    },
  );

  const markup = renderToStaticMarkup(
    createElement(AppealAction, {
      transaction: retained,
      busy: false,
      enabled: true,
      onAppeal: () => undefined,
    }),
  );

  assert.equal(tracked.accepted.hash, accepted.hash);
  assert.match(markup, new RegExp(`data-appeal-target="${accepted.hash}"`));
  assert.doesNotMatch(markup, /disabled/);
  void dashboardRefresh;
  void tracked.finalized;
});
