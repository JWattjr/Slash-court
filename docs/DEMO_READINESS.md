# Demo readiness and RPC diagnosis

Verified 2026-09-08 against `https://slash-court.vercel.app` and the deployment
artifacts in this repository. No contract deployment or wallet transaction was
performed during this pass.

## Current deployment

- Court: `0xA4636860ea78c6E29179E7893e1bDa68133D15aB`
- Vault: `0x5eAba41b27560505A45fD51a301f01f30832E7E4`
- StudioNet chain ID: `61999` (`0xf22f`)
- Rulebook: v1, hash
  `sha256:348b2debe2571df5f0bf482ec15b1c78299b17b79c05797d91fbbd572fb1233d`
- Approved evidence domain: `slash-court.vercel.app`
- Current cases: 0. A successful complete dashboard read proved the zero case
  index before a later refresh hit the shared RPC limit.

The current Court/Vault bindings, rulebook, methods, and environment addresses
are compatible: the deployed client completed all summary reads and displayed
the zeroed Court/Vault state, rulebook v1, and allowlist before the shared limit
was exhausted.

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

Direct-mode tests prove deterministic accounting and duplicate-application
rejection, but direct mode has no network-finality semantics. The integration
test proves finalized application and replay-safe retry in its GLSim flow. This
pass did not submit a live transaction, so it does not independently prove the
timing boundary on the current StudioNet deployment. A complete wallet journey
still requires explicit transaction authorization and funded operator and
beneficiary accounts.
