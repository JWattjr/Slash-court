# Demo readiness and RPC diagnosis

Verified 2026-09-09 against `https://slash-court.vercel.app` and the current
StudioNet deployment. The wallet journey below was explicitly authorized.

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

The current deployed Court still contains an `E1`-specific prompt example. The
canonical demo pair uses exact E1/E2 identifiers and therefore completed
successfully. The repository now removes that bias, lists exact allowed IDs and
evidence/rule pairs in the prompt, and includes a non-E1 regression test. That
source hardening is not deployed; redeploying contracts requires separate
authorization and would create a new Court/Vault provenance record.

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
rejection, while integration tests exercise the finality flow in GLSim. This
pass also completed an authorized browser-wallet journey on StudioNet and
verified that both financial applications followed finalized adjudications.
The shared public RPC can still rate-limit or fail transiently, so truthful
partial/stale states and fail-closed writes remain necessary.
