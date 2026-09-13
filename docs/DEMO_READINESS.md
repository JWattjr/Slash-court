# SlashCourt demo readiness and release verification

Verified 2026-09-13 against the fresh StudioNet deployment and the production
console at https://slash-court.vercel.app.

## Gate

**Resubmit-ready: NO.** The hardened Court/Vault pair and production console
are live, and the finalized negligence path is fully evidenced. The remaining
blocker is live ACCEPTED-window proof: the authorized adjudication reached
ACCEPTED, but its first eligibility read was temporarily unavailable and the
transaction finalized before the explicit recheck returned. No appeal was
submitted and no finalized screenshot is being presented as ACCEPTED proof.

## Current deployment

- Network: GenLayer Studio Network, chain ID `61999` (`0xf22f`)
- Court: `0x56e26ec256afe37199fe9845e039f5DEdd9e955a`
- Vault: `0xb1fD046CA7D92b84b16f66bdE676f442cA599Aa7`
- Rulebook: v1, hash `sha256:348b2debe2571df5f0bf482ec15b1c78299b17b79c05797d91fbbd572fb1233d`
- Approved evidence domain: `slash-court.vercel.app`
- Contract source revision: `cdaba784931d4cd4020bb66bebe795c22f47efa5`
- Frontend source revision: `6423dfb950468fd63f1c6f518fb3e85fb8fec82e`
- Vercel deployment: `dpl_BfjU5sgnRCD7iBZYwxwHf4WKdiDw`

The deployment record is [deploy/last-deployment.json](../deploy/last-deployment.json).
The full case and historical evidence index is
[deploy/current-demo.json](../deploy/current-demo.json).

The fresh Court and Vault were deployed as a new pair, bound reciprocally once,
configured with the rulebook and evidence domain, and read back on StudioNet.
The explorer cannot independently prove a Git commit-to-bytecode mapping here;
the exact source revision is recorded from the deployment run.

## Verified current case

The fresh deployment has one case, `case-1`, and it is a synthetic release
fixture—not a real incident or real TVL.

- Commitment: `demo-negligence-rc-20260913`
- Classification: `NEGLIGENT_FAILURE`
- Outcome: `PARTIAL_SLASH`
- Violated/alleged rules: `R1`, `R3`
- Penalty: `0.5 GEN` (`5000` bps), calculated by the contract
- Status: `PENALTY_APPLIED`, protocol `FINALIZED`
- Canonical duty: Synthetic failover keeper duty for release verification
- Trigger: `scheduled-rc-negligence`
- Duty deadline: `2026-09-14T00:00:00Z`
- Dispute deadline: `2026-09-15T00:00:00Z`
- Expected action: `maintenance-action-rc`
- Commitment digest: `sha256:91904956c93defdf5560bf1e28015dc430242fa865bb9f53eb799dc26a3080cb`
- Evidence: `negligence-rc-01`, `PUBLIC_STATUS`, party `CLAIMANT`, domain
  `slash-court.vercel.app`, hash
  `sha256:9e9220900a2c6f44d32fddb8e1ac208646fca106f216537f7f1a7b0300873b97`,
  rules `R1/R3`

### Wallet journey and receipts

The authorized synthetic journey used the existing StudioNet test accounts:

| Action | Finalized transaction |
| --- | --- |
| Register operator | `0x1bfff91d042aa408b3ec066a7e9b5224c481e7313707574bd1a34aa6d8a884da` |
| Deposit 2 GEN bond | `0x53c950f3aa555e11cbb72df296fe60a5b42c40de1d0e4f199a88fcbc09826415` |
| Create commitment | `0x54dd695d5bdacc92a77a416684a639f805a581132a42444e18119752caa4cd45` |
| Accept commitment | `0x0fa604c96683651009d34d27d912d9c57d300c00841d8a0be5a2da1ce53fbf33` |
| Open case | `0x4fa88b8c842c519c7435cbed9b3b1c8cc8fcda138ebc67b708b3fc28ea4d861e` |
| Operator response | `0xfb1c6bc5f8773917eac3fa919d56416f2e91e3234f0577d58b1318100443996a` |
| Freeze evidence | `0xaa13813c0bd2bd282c363d487e3917b9f36be4a0b403514f420610fb2de019ce` |
| Adjudication | `0x003e75129584a8a044f86a50b79f1f34cc8e48de5c5ad91daeb52c47eed550c2` |
| Finality acknowledgement | `0xde154a09b3a4648dfee7fecc2f3c3a3dd1af261d804ed0bd339557ef130f7899` |
| Vault application | `0xb317a13f944b9165d5b851cd889050ea06bf39ed9fd0233513de7d95403c915c` |

All listed receipts are FINALIZED. The adjudication receipt contains the
finality-triggered Vault messages. The Vault application read is
`APPLIED_FINALIZED`, with citation metadata preserved:

- beneficiary award: `0.4 GEN`
- safety-pool allocation: `0.1 GEN`
- remaining available bond: `1.5 GEN`
- locked exposure: `0 GEN`
- total penalties: `0.5 GEN`
- application count: `1`

The final Court read reports `adjudication_finalized: true`,
`application_status: APPLIED_FINALIZED`, and `network_status: FINALIZED`.

## Appeal-window evidence

The live console retained the exact ACCEPTED hash:
`0x003e75129584a8a044f86a50b79f1f34cc8e48de5c5ad91daeb52c47eed550c2`.
The UI released the blocking state after ACCEPTED and continued finality in the
background, as covered by the workflow regression test. In this run the first
eligibility read failed closed as `unknown`; before the manual recheck could
return, finality completed. The appeal control was never enabled, and the
appeal button was not clicked.

This is recorded as `MISSED` in `deploy/current-demo.json`. Do not claim an
enabled ACCEPTED appeal control until a future bounded run captures it.

## Public captures

- [Pre-adjudication case capture](evidence/pre-adjudication-case-1.png): wallet-free case facts, canonical duty, evidence, and enabled Run consensus control.
- [Finalized case capture](evidence/finalized-case-1.png): production console showing the finalized classification, penalty, citations, and actual Vault split.

The captures are supporting artifacts, not substitutes for chain reads. No
recording is available; leave the portal video field blank.

## Historical examples

The fresh deployment does not contain the other three classifications. The
console labels them as historical predecessor proof:

- predecessor `0x576Bef923bbDd6ACb6aA7b5D183FF277abeFbf8e`: provable misconduct,
  external outage, and insufficient evidence, all synthetic fixtures with real
  finalized StudioNet transactions;
- predecessor current pair `0xA4636860ea78c6E29179E7893e1bDa68133D15aB`: an older
  negligence/outage pair, also synthetic and not current deployment state.

These historical cases must not be described as cases belonging to the fresh
Court.

## Checks completed

- 13 frontend workflow tests passed, including the rendered appeal-action
  regression, exact hash targeting, reload recovery, fail-closed reads, and
  terminal ineligibility.
- Typecheck, lint, production build, and `git diff --check` passed.
- Focused direct contract tests: 22 passed. The full local direct suite had 43
  passes; the 8-test GLSim integration suite passed with the documented Windows
  compatibility wrapper.
- GenVM lint and contract schema checks passed. The optional GenVM pyright
  check remains unavailable because `pyright` is not installed.
- Current on-chain reads prove no penalty before finality for this case because
  the application was triggered on `finalized`; direct tests prove replay
  rejection and finality gating. No duplicate application attempt was sent in
  production.
- No appeal was submitted and no Portal submission was made.

## Requirement status

| Steward requirement | Status |
| --- | --- |
| Bind canonical duty, trigger, deadlines, expected action, parties, exposure, rulebook, digest, and alleged rules | Satisfied in fresh Court/Vault source and current finalized case read |
| Bind fetched-evidence citations with party and rule metadata | Satisfied in fresh source, receipt payload, Court record, and Vault application read |
| Retain an ACCEPTED adjudication and expose an appeal control before finality | UI retention and background-finality fix deployed; live enabled-control capture remains unsatisfied |
| Apply deterministic penalty only after finality and only once | Satisfied by current finalized receipts, `APPLIED_FINALIZED` read, accounting, and direct/integration tests |
| Make public review wallet-free and easy to inspect | Satisfied; current case hash route, Explorer links, advanced metadata, and screenshots are public |

## Next exact action

Run one more bounded synthetic case only if an ACCEPTED-window screenshot is
required for the portal. Capture the retained hash and enabled appeal button
immediately after the eligibility read returns `eligible`; do not click Appeal
unless separately authorized. Until then, submit only with the gate marked NO.
