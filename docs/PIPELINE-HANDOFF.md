# Pipeline Court milestone handoff — 2026-11-11

Status: LOCAL CANDIDATE; NOT READY FOR PORTAL.

## Completed

- Added contracts/pipeline_charter.py, contracts/pipeline_court.py,
  contracts/operator_record.py. Original two contracts were not modified.
- Added /pipeline with charter builder, bond checklist, ordered case list,
  evidence links, operator records, settlement/claim controls, retained
  transaction tracking, appeal control, and separately labelled recorded proof.
- Added a single canonical Explorer helper with record-based API checks and
  read-only `npm run verify:pipeline` (requires a real LIVE_PASS manifest).
- Added a dated draft manifest and an explicitly incomplete milestone draft.
- Preserved the preexisting untracked root .vercel directory.

## Checks actually run

| Check | Result |
| --- | --- |
| New contract genvm-lint check (AST + SDK semantic validation) | All three PASS |
| Python environment | covenant-sentinel/.venv; genlayer-py 0.18.0; genlayer-test 0.29.2 |
| JS version | genlayer-js 1.1.8 |
| Initial new direct tests | 45 PASS |
| Expanded complete tests/direct suite | 96 PASS (53 new + 43 existing) |
| Existing frontend tests | 16 PASS |
| Typecheck | PASS |
| Production build | PASS; routes / and /pipeline generated |
| Original-only network verifier | PASS using network escalation after sandbox DNS denial |
| Original Explorer address records | Both verified as CONTRACT |
| Original rulebook and case-1 | v1; adjudication_finalized true |
| Requested desktop/mobile browser flows | BLOCKED; first local navigation timed out |
| New deployment / native credit / live cases | NOT RUN |

No new deposit, contract deployment, wallet transaction, commit, push, Vercel
production update, or Portal submission occurred during this milestone pass.
The deposit approval question was presented separately; do not infer approval
from this file or its 1,000-wei proposed budget.

## Stop condition

The brief says to stop at a failed check. The in-app browser could not open
http://localhost:3108/pipeline and returned net::ERR_CONNECTION_TIMED_OUT.
The local Next server reported Ready. No browser screenshots or responsive
verification are claimed. Fix access to the local server before advancing the
release phase; the failure is not evidence of a Vercel or contract problem.

## Required continuation

1. Review new contracts, especially claims, rejected-value recovery, callback
   recovery, bounded record growth, cross-contract finality, and pricing sync.
   Port the remaining applicable Liability Cascade adversarial matrix.
2. Add focused frontend workflow tests for this new route. The 16 existing
   tests cover the old console, not the entire new pipeline page.
3. Verify each new flow at 1440x960 and 390x844. Fix any findings in one batch.
   New native-credit controls require wallet fixtures or a later authorized
   StudioNet walkthrough; do not call unconfigured screenshots a full-flow pass.
4. Confirm deposit approval and establish an enforceable global 1 GEN cap.
5. Commit only reviewed SlashCourt changes. Record that exact source revision.
6. Deploy Record and Charter, then Court(charter); one-time bind Charter and
   Record. Verify all deployed bytes and bindings. No old Court/Vault redeploy.
7. Run each required live case once, save each hash before waiting, and resume
   only saved hashes after timeout. Publish fixture text only in the existing
   public evidence repository. Do not expose the private prototype repository.
8. Capture ACCEPTED appeal state for the new judgment flow and verify finality,
   escrow conservation, record pricing, and one positive native-credit claim.
9. Populate deploy/pipeline-2026-11-11.json with actual addresses and receipts;
   update frontend deployment configuration and public proof. The verifier
   needs review against the observed RPC receipt and deployed-code encoding.
10. Verify every contract/transaction Explorer record; new deployed contracts
    each need their own GenLayer Explorer Contract evidence entry.
11. Clean git archive frontend deployment with source revision build variable,
    production verification, docs refresh, reviewed commit/push. Owner submits.

The new manifest deliberately cannot pass `verify:pipeline` before real proof.
`node scripts/verify-pipeline.mjs --original-only` is the independent old-contract
regression command and has passed.

## Existing contracts — verified address evidence

- [Original SlashCourt](https://explorer-studio.genlayer.com/address/0x56e26ec256afe37199fe9845e039f5DEdd9e955a)
- [Original OperatorBondVault](https://explorer-studio.genlayer.com/address/0xb1fD046CA7D92b84b16f66bdE676f442cA599Aa7)

Base repository revision before these uncommitted additions:
cdbbe9aa159bd806c99a6ab3cb4c4a4aaee4c6c9. This is not a new deployment revision.
