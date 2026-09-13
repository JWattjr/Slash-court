# Demo readiness and RPC diagnosis

Verified 2026-09-09 against `https://slash-court.vercel.app` and the current
StudioNet deployment. The wallet journey below was explicitly authorized.

**Resubmission gate: NOT READY.** The current local source closes the steward's
citation-consensus and appeal-state objections, but those changes are not yet
deployed. A new mutually bound Court/Vault deployment, a frontend deployment,
and one captured live ACCEPTED appeal window are still required.

## Current deployment

- Court: `0xA4636860ea78c6E29179E7893e1bDa68133D15aB`
- Vault: `0x5eAba41b27560505A45fD51a301f01f30832E7E4`
- StudioNet chain ID: `61999` (`0xf22f`)
- Rulebook: v1, hash
  `sha256:348b2debe2571df5f0bf482ec15b1c78299b17b79c05797d91fbbd572fb1233d`
- Approved evidence domain: `slash-court.vercel.app`
- Current cases: 5. Cases 1–3 are cancelled setup attempts; cases 4–5 are the
  canonical finalized demo pair.

The Court/Vault bindings, rulebook, methods, and environment addresses are
compatible. Direct reads verified the current cases and Vault accounting.

## Current finalized proof

| URL | Classification | Result | Penalty | Beneficiary | Safety pool |
| --- | --- | --- | ---: | ---: | ---: |
| `#case/current/case-4` | Negligent failure | Partial slash | 0.5 GEN | 0.4 GEN | 0.1 GEN |
| `#case/current/case-5` | External outage | No slash | 0 GEN | 0 GEN | 0 GEN |

Case-4 finalized with R1/R3 violations. Case-5 finalized with the R4 exemption
and no violated rules. Both Vault applications are finalized. The operator ends
with 1.5 GEN available, zero locked exposure, and two resolved commitments.
Exact transactions are recorded in `deploy/current-demo.json`.

The complete case-5 adjudication transaction is
`0x03b193ad13f8bee3f4dc855a5070c7a09c28f50d26c16d3ff4954b47cb5ff366`.
It was recovered from the Studio explorer's finalized `adjudicate_case`
receipt and independently accepted by `genlayer receipt`; the previous
40-hex-character value was a truncated identifier, not a different receipt.

The current deployed Court still contains an `E1`-specific prompt example and
does not independently bind the leader's structured citation metadata through
validator comparison. The canonical demo pair uses exact E1/E2 identifiers and
therefore completed successfully, but its stored citation trail must not be
described as fully consensus-bound. The repository now removes the prompt bias,
canonicalizes both proposed and independent results against hash-verified
fetched evidence, and binds evidence ID, rule, party, type, domain, content
hash, and relevant-rule metadata into validator agreement. This source is not
deployed; redeployment requires a new Court and a new one-time-bound Vault.

## Appeal-window evidence

The local console now distinguishes `unknown`, `eligible`, and `ineligible`
appeal state. It retains the exact adjudication hash at ACCEPTED, returns UI
control while finality continues in the background, refreshes nonterminal
adjudications after reload, and rechecks `canAppeal` immediately before asking
the wallet to submit. A failed eligibility read is explicitly unavailable and
cannot silently become a permanent `false`.

`tests/frontend/transactions.test.ts` proves accepted-state retention after an
unrelated transaction, the correct appeal target, nonblocking background
finality, reload recovery, fail-closed RPC handling, pre-submit eligibility
recheck, and terminal-state rejection. This is local mocked workflow evidence,
not proof that the deployed console displayed an enabled appeal action. The
required live screenshot/recording and accepted transaction hash remain open.

## Demonstrated live failure

The deployed browser reproduced both `gen_call: execution failed` and subsequent
`Failed to fetch` errors. An origin-aware HTTP check showed:

- the endpoint is reachable;
- CORS allows `https://slash-court.vercel.app`, POST, and `content-type`;
- Vercel production environment values match `deploy/last-deployment.json`;
- a JSON-RPC response returned HTTP 429, code `-32029`, message
  `Rate limit exceeded: 5000 requests per day`, zero remaining requests, and a
  retry header.

The demonstrated cause of the public outage is therefore shared StudioNet RPC
rate-limit exhaustion, not CORS or a wrong address. The former UI multiplied the
problem by reading six summaries plus as many as 50 complete cases every 12
seconds per open tab.

## Repair

The console now performs isolated summary reads, fetches eight case IDs at a
time, loads a case and its Vault application only when opened, refreshes healthy
state every five minutes, pauses while hidden, backs off transient failures, and
stops after eight automatic refreshes. Successful slices remain useful when
another read fails. Unavailable financial/policy slices disable every write.

Loading, unavailable, partial, stale, and proven-empty states are distinct. The
app never infers an empty case list or tells a reviewer to publish a rulebook
after a failed read. A rulebook version is shown only from a successful or
explicitly stale read.

## Historical finalized proof

The four cases in `deploy/live-demo.json` belong to the predecessor Court
`0x576Bef923bbDd6ACb6aA7b5D183FF277abeFbf8e`, not the current Court. They used
synthetic incident fixtures but real StudioNet consensus and finalized Vault
application.

| URL | Classification | Result | Penalty | Beneficiary | Safety pool |
| --- | --- | --- | ---: | ---: | ---: |
| `#case/historical/case-1` | Provable misconduct | Full slash | 1 GEN | 0.8 GEN | 0.2 GEN |
| `#case/historical/case-2` | Negligent failure | Partial slash | 0.5 GEN | 0.4 GEN | 0.1 GEN |
| `#case/historical/case-3` | External outage | No slash | 0 GEN | 0 GEN | 0 GEN |
| `#case/historical/case-4` | Insufficient evidence | No slash | 0 GEN | 0 GEN | 0 GEN |

Aggregate historical accounting is 4 GEN initial bond, 1.5 GEN penalties, 1.2
GEN beneficiary awards, 0.3 GEN safety pool, 2.5 GEN remaining bond, and zero
locked exposure.

## Limits of this verification

Direct-mode tests prove deterministic accounting, canonical duty preservation,
citation validation, and duplicate-application rejection. With the project’s
Windows GLSim 0.29 compatibility wrapper, all eight integration tests now
pass. They exercise deployment and reciprocal binding, all four
classifications, canonical commitment/citation forwarding, the
original-adjudication finality callback,
the gated retry path, one-time penalty application, timeout readiness, and case
cancellation. GLSim drops a sibling PostMessage, so the financial-path test
deliberately exercises the contract’s retry recovery after the independent
finality acknowledgement; it does not substitute for a live StudioNet
ACCEPTED-window capture. An earlier authorized browser-wallet journey on
StudioNet verified that both existing financial applications followed finalized
cases; it did not capture an open appeal window. The shared public RPC can still
rate-limit or fail transiently, so truthful partial/stale states and fail-closed
writes remain necessary.
