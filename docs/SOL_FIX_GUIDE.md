# SlashCourt: focused fix guide for ChatGPT Sol

## Review verdict

Strong GenLayer fit; not yet competition-ready. Natural-language obligations, contested evidence, validator consensus, and deterministic bonded consequences make a compelling demonstration. The strongest pitch is a narrow operator-accountability workflow, not a general-purpose AI court. Winning potential depends on an honest, reproducible end-to-end demo; this review does not establish current competition eligibility or predict judges' decisions.

This is a quick source review, not a security audit. Existing mocked tests do not establish real model accuracy, appeal safety, or a working browser-wallet journey.

## Copy this instruction into Sol

Work in `C:\Users\User\Desktop\Genlayer apps\slash-court`. Read this guide and the relevant source before editing. Fix P0 items first, with regression tests. Preserve unrelated work and existing deployment records. Use the applicable GenLayer contract, lint, and test skills. Do not redesign the app, add infrastructure, introduce new features, or deploy transactions without my explicit approval. Check installed SDK/runtime interfaces before relying on them. Report exactly what passed and what remains unverified. Never describe mocked outcomes as live consensus.

## P0 — correctness before demo polish

### 1. Stop cases and exposure from getting stuck

Evidence: `contracts/slash_court.py`, `mark_case_ready` requires an operator response unconditionally (around line 811). `cancel_case` (around 907) only updates court state; it does not notify the vault.

- Define a bounded response window, using deterministic transaction time. Allow progression after it expires even if the operator stays silent. Silence alone must not prove misconduct.
- Preserve a meaningful opportunity to respond when a claim is filed near the commitment's dispute deadline.
- Add an authenticated, idempotent court-to-vault cancellation transition. Validate case/commitment binding; never cancel an already applied resolution. Specify whether cancellation restores the live commitment or permits release after expiry, then implement that policy consistently.
- Tests: silent respondent progresses only after timeout; third parties cannot cancel/unbind; repeated cancellation does not change accounting; cancellation/release races cannot double-release exposure.

### 2. Enforce real deadlines

Evidence: `contracts/operator_bond_vault.py`, `_validate_deadline` accepts short strings such as `window`; `_expired` compares dates only. `release_undisputed_commitment` conditionally skips expiry validation. Court `open_case` lacks a dispute-expiry check.

- Use one strict, canonical timestamp representation and full-resolution comparisons. Reject invalid dates, ambiguous formats, impossible ordering, and missing transaction-time context; do not silently use the Unix epoch.
- Enforce expiry in both court and vault state transitions, including binding, so cross-contract timing cannot bypass the boundary.
- Replace permissive test fixtures with real timestamps. Test before/at/after boundaries, same-day deadlines, invalid short strings, late claims, and release-versus-bind ordering.

### 3. Fix token units and precision

Evidence: `frontend/lib/slashcourt/client.ts` converts bigint values to Number (around line 15); `depositBond` uses `BigInt(amount)` (around 137), while UI labels amounts GEN.

- Verify the configured chain's decimals. Parse user-facing GEN into base units with exact string/bigint utilities, and format base units back for display. Apply this to deposits, exposure, penalties, balances, and awards.
- Keep monetary values as bigint or decimal strings throughout; reserve Number for genuinely bounded non-monetary fields.
- Tests: decimal input, one GEN, smallest unit, malformed/negative input, excessive precision, and amounts above JavaScript's safe integer range.

### 4. Stop the modal refresh loop

Evidence: `frontend/app/page.tsx` around 220–236: refresh depends on `selectedCase`, replaces it with a fresh object, and retriggers the polling effect.

- Store selected case ID and derive its object from dashboard data. Make polling dependencies stable; avoid overlapping reads and stale updates after unmount.
- Verify that opening a case does not cause continuous requests and closing it leaves only the intended polling timer.

### 5. Make transaction and finality claims truthful

Evidence: client `wait` stops at ACCEPTED; the page converts receipt-wait failures to SUBMITTED and retains transaction records only in memory. `tests/integration/test_finalized_resolution.py` verifies eventual application and replay, not absence of pre-finality movement.

- Decode actual SDK receipt and execution states, including reverts. Show pending, accepted/provisional, finalized, and failed distinctly. Surface polling errors as unknown/retryable, not successful execution.
- Persist transaction hashes scoped by chain, contract, and case. Track the adjudication hash separately; appeals must target that transaction, not the most recent case action.
- Verify that retrying application cannot use a retry transaction's finality to bypass the original adjudication's appeal/finality requirements. Treat this as an unresolved safety question until tested on the actual execution model.
- Test no penalty before original adjudication finality, exactly-once application, failed callback recovery, and early retry. If the simulator cannot prove the timing property, state that limitation and leave live verification explicitly outstanding.

## P1 — make the demonstration credible

- Replace `status.example.org` / other placeholder evidence URLs with reachable, clearly labelled synthetic demo fixtures. Provide all four outcomes: misconduct, negligence, legitimate outage, and insufficient evidence. Never present fixtures as real incidents.
- Remove fake digests such as `sha256:ui-submitted` and `sha256:slashcourt-rulebook-v1`. Compute real digests over explicitly defined bytes. Do not claim evidence is immutable or verified unless the evaluator actually checks the fetched content against the committed digest.
- Let respondents enter counterevidence in the UI. Show commitment terms and maximum exposure before acceptance. Disable writes on the wrong network. Label readiness and evidence freezing according to actual contract behavior.
- Run at least one complete wallet journey and all four real evaluator scenarios. Record transaction IDs and outcomes, including failures. Mocked tests remain useful but are a separate category.
- Check current-state dashboard counts; increments for opened/ready cases must not masquerade as counts of cases still in those states.

## Completion gate

Run relevant regression tests, GenVM lint, TypeScript checks, and the frontend build. Add browser verification of deposit → commitment → acceptance → claim → response/timeout → adjudication → finalized application. Confirm balances and unspent exposure afterward. Existing deployed contracts will not change when local Python files change: prepare a fresh paired deployment plan, preserve old addresses, and request approval before deploying or changing live configuration.

Spend effort on these repairs and a clear three-minute demo before adding pages, animations, tokens, or more AI features.
