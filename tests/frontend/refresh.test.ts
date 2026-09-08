import assert from "node:assert/strict";
import test from "node:test";

import {
  REFRESH_SUCCESS_MS,
  classifyReadFailure,
  nextRefreshDelay,
} from "../../frontend/lib/slashcourt/refresh.ts";

test("classifies nested StudioNet rate-limit responses and preserves retry guidance", () => {
  const failure = classifyReadFailure({
    message: "RPC request failed",
    data: {
      code: -32029,
      message: "Rate limit exceeded: 5000 requests per day",
      retry_after_seconds: 90,
    },
  });
  assert.equal(failure.kind, "rate_limit");
  assert.equal(failure.retryAfterSeconds, 90);
});

test("distinguishes network and contract execution failures", () => {
  assert.equal(classifyReadFailure(new TypeError("Failed to fetch")).kind, "network");
  assert.equal(classifyReadFailure(new Error("gen_call execution failed")).kind, "contract");
});

test("uses a bounded five-minute healthy interval and exponential failure backoff", () => {
  assert.equal(nextRefreshDelay(0), REFRESH_SUCCESS_MS);
  assert.equal(nextRefreshDelay(1), 2 * 60_000);
  assert.equal(nextRefreshDelay(2), 5 * 60_000);
  assert.equal(nextRefreshDelay(99), 30 * 60_000);
  assert.equal(nextRefreshDelay(1, 600), 10 * 60_000);
});
