import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { AppealAction } from "../../frontend/lib/slashcourt/AppealAction.ts";
import {
  appealEligibility,
  findAppealableAdjudication,
  findRefreshableAdjudications,
  isAcceptedAppealWindow,
  mergeTransaction,
  requestVerifiedAppeal,
  submitAndTrackAppealableTransaction,
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

test("Studio appeal fallback treats only a fresh ACCEPTED receipt as appealable", () => {
  assert.equal(isAcceptedAppealWindow({ status: "ACCEPTED" }), true);
  assert.equal(isAcceptedAppealWindow({ status: "FINALIZED" }), false);
  assert.equal(isAcceptedAppealWindow({ status: "PENDING" }), false);
});

test("a late nonterminal response cannot replace a finalized adjudication", () => {
  const finalized = snapshot("0xrace", {
    kind: "adjudication",
    status: "FINALIZED",
    appealEligibility: "ineligible",
    appealable: false,
    updatedAt: 2,
  });
  const lateAccepted = snapshot("0xrace", {
    kind: "adjudication",
    status: "ACCEPTED",
    appealEligibility: "eligible",
    appealable: true,
    updatedAt: 3,
  });
  const history = mergeTransaction([finalized], lateAccepted);
  assert.deepEqual(history, [finalized]);
  assert.equal(findAppealableAdjudication(history), undefined);
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

test("Studio appeal submission uses a verified ACCEPTED receipt and zero bond", async () => {
  const calls: string[] = [];
  const sdk = {
    async canAppeal() {
      calls.push("freshReceipt");
      return isAcceptedAppealWindow({ status: "ACCEPTED" });
    },
    async getAppealCharge() {
      calls.push("studioCharge");
      return 0n;
    },
    async appealTransaction({ value }: { value: bigint }) {
      calls.push(`appeal:${value}`);
      return "0xappeal";
    },
  };

  assert.equal(await requestVerifiedAppeal(sdk, "0xadjudication"), "0xappeal");
  assert.deepEqual(calls, ["freshReceipt", "studioCharge", "appeal:0"]);
});

test("appealable tracking retains ACCEPTED before eligibility recovery and finality", async () => {
  const retained: TxSnapshot[] = [];
  const accepted = snapshot("0xadjudication", {
    status: "ACCEPTED",
    kind: "adjudication",
    appealable: false,
    appealEligibility: "unknown",
  });
  let reads = 0;
  const finalized = snapshot("0xadjudication", {
    status: "FINALIZED",
    kind: "adjudication",
    appealable: false,
    appealEligibility: "ineligible",
  });
  const tracked = await trackAppealableTransaction(
    {
      async snapshot() {
        reads += 1;
        return reads === 1 ? { ...accepted, appealable: true, appealEligibility: "eligible" } : finalized;
      },
      async waitForAppealWindow() {
        return accepted;
      },
    },
    accepted.hash,
    "adjudication",
    (entry) => retained.push(entry),
    { intervalMs: 50, maxDurationMs: 2000 },
  );

  assert.equal(tracked.accepted.status, "ACCEPTED");
  assert.equal(tracked.accepted.appealEligibility, "unknown");
  assert.equal((await tracked.finalized).status, "FINALIZED");
  assert.deepEqual(retained.map((entry) => entry.status), ["ACCEPTED", "ACCEPTED", "FINALIZED"]);
});

test("mocked actual-page workflow releases busy, recovers eligibility, and targets the retained hash", async () => {
  const controller = new AbortController();
  const accepted = snapshot("0xretained-adjudication", {
    kind: "adjudication",
    status: "ACCEPTED",
    appealable: false,
    appealEligibility: "unknown",
  });
  const unrelated = snapshot("0xunrelated", { kind: "response", status: "FINALIZED" });
  let busy = true;
  let retained: TxSnapshot[] = [];
  let resolveEligible!: () => void;
  const eligibleSeen = new Promise<void>((resolve) => { resolveEligible = resolve; });
  let reads = 0;
  const workflow = await submitAndTrackAppealableTransaction(
    async () => accepted.hash,
    {
      async snapshot() {
        reads += 1;
        if (reads === 1) throw new Error("temporary canAppeal RPC failure");
        const next = { ...accepted, appealable: true, appealEligibility: "eligible" as const };
        setTimeout(resolveEligible, 0);
        return next;
      },
      async waitForAppealWindow() {
        return accepted;
      },
    },
    "adjudication",
    (entry) => {
      retained = mergeTransaction(retained, entry);
      if (entry.status === "ACCEPTED") busy = false;
    },
    { intervalMs: 50, maxDurationMs: 5000, signal: controller.signal },
  );

  assert.equal(workflow.accepted.status, "ACCEPTED");
  assert.equal(busy, false, "busy must be released immediately after ACCEPTED");
  await eligibleSeen;
  retained = mergeTransaction(retained, unrelated);
  const target = findAppealableAdjudication(retained);
  const markup = renderToStaticMarkup(
    createElement(AppealAction, {
      transaction: target,
      busy: false,
      enabled: true,
      onAppeal: () => undefined,
    }),
  );

  assert.equal(target?.hash, accepted.hash);
  assert.match(markup, new RegExp(`data-appeal-target="${accepted.hash}"`));
  assert.doesNotMatch(markup, /disabled/);
  controller.abort();
  await workflow.monitoring;
});
