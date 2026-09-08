import assert from "node:assert/strict";
import test from "node:test";

import { historicalArtifactBundle } from "../../frontend/lib/slashcourt/historical.ts";

test("historical negligence fallback preserves finalized penalty accounting", () => {
  const bundle = historicalArtifactBundle("case-2");
  assert.ok(bundle);
  assert.equal(bundle.caseRecord.data?.classification, "NEGLIGENT_FAILURE");
  assert.equal(bundle.caseRecord.data?.penalty_amount, "500000000000000000");
  assert.equal(bundle.application.data?.beneficiary_award, "400000000000000000");
  assert.equal(bundle.application.data?.safety_pool_amount, "100000000000000000");
  assert.equal(bundle.application.state, "error", "artifact fallback must remain visibly distinct from a live read");
});

test("historical outage fallback preserves the no-penalty result", () => {
  const bundle = historicalArtifactBundle("case-3");
  assert.ok(bundle);
  assert.equal(bundle.caseRecord.data?.classification, "EXTERNAL_OUTAGE");
  assert.equal(bundle.caseRecord.data?.outcome, "NO_SLASH");
  assert.equal(bundle.application.data?.penalty_amount, "0");
});
