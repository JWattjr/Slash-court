# Current continuation — 2026-11-12

All eight milestones passed on the new deployment; source revision 0d6ef16bcadd77d9a16a12dddb797676e09fab87. The 53 wei from the previous attempt was recovered. The current proof and receipts are in [PIPELINE-LIVE.md](PIPELINE-LIVE.md). Production verification is pending. The following prior handoff is historical.

# Pipeline Court continuation — 2026-11-12

Status: **BLOCKED; NOT READY FOR SUBMISSION.**

Continuation steps 1–6 completed in order: custody/finality/growth review and
adversarial matrix, workflow tests, headless desktop/mobile checks, approved
enforced 0.1 GEN cap, reviewed source commit, and new bound deployment.
Step 7 stopped at the first failed live case. No rerun, further case, appeal,
or production promotion was sent. Steps 8–10 have verified partial evidence:
real ACCEPTED capture, native credit, deployed identity and all Explorer links.
Step 11 production release remains blocked.

- Contract source revision: baebfbe56bafed7b1d2d5ca068bffa723a1dd330.
- New addresses, receipts and accounting: [PIPELINE-LIVE.md](PIPELINE-LIVE.md).
- 217 direct tests, 18 frontend tests, TypeScript, pre-deploy GenVM AST/SDK
  checks and webpack production build passed. Headless workflows passed at
  1440x960 and 390x844; mock checks remain separate from real proof.
- B-fault and A-fault judgments/settlements finalized successfully; subjective
  rejection and higher-next-bond pricing verified; 13-wei native credit paid.
- All-faithful judgment ended MAJORITY_DISAGREE, initially UNDETERMINED and
  subsequently FINALIZED without applying the decision. Three successful
  leaders differed only in valid quote selection. Do not treat a successful
  leader receipt as successful protocol consensus.
- Earlier-unclear case and native-refund UI walkthrough were not run. The
  faithful escrow has a passed deadline and permissionless timeout exit;
  no timeout-settlement transaction was sent after the failed gate.
- Used/reserved 129 wei of the approved 100000000000000000 wei cap.
- Read-only partial verification passed five contract and 39 transaction
  records; original Court/Vault regression passed. Full readiness verifier
  intentionally refuses this manifest.
- Root .vercel remains preserved and untracked. Production remains unchanged.

Next release requires citation convergence without weakening independent
fetched-evidence validation, a regression covering different valid quote spans,
and consensus-aware transaction success. Review the saved failure analysis,
recover the timed-out escrow, then obtain authorization for a revised Court
deployment and a new bounded live run. Never alter/redeploy the original pair.
The blocked branch is review material, not an owner-ready Portal update.

## Historical handoff — 2026-11-11

Everything below records the earlier candidate and its original continuation
instructions. The current owner's 0.1 GEN authorization and headless-browser
override supersede its old budget and sandbox timeout gate.

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
