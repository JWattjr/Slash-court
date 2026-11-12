# Pipeline Court live evidence — blocked release

Resubmit-ready: **NO**. Verified 2026-11-12T10:16:08.858Z. StudioNet 61999. Every incident log is synthetic.

Contract source revision: baebfbe56bafed7b1d2d5ca068bffa723a1dd330. Original Court/Vault unchanged. No production update or Portal submission.

## Contract evidence

- [OperatorRecord: 0x714812d639c07f11A4A831a19461BC18BFa44154](https://explorer-studio.genlayer.com/address/0x714812d639c07f11A4A831a19461BC18BFa44154) — separate GenLayer Explorer Contract evidence.
- [PipelineCharter: 0xa80Aae4d2f3a7d57CCDe588804d6bd44227cd3e0](https://explorer-studio.genlayer.com/address/0xa80Aae4d2f3a7d57CCDe588804d6bd44227cd3e0) — separate GenLayer Explorer Contract evidence.
- [PipelineCourt: 0x98aa6DD4D02D0734C986FA05501CDA8ac120E258](https://explorer-studio.genlayer.com/address/0x98aa6DD4D02D0734C986FA05501CDA8ac120E258) — separate GenLayer Explorer Contract evidence.

## Required milestones

| Requirement | Actual result | Reference |
| --- | --- | --- |
| Subjective charter rejected | PASS | pipeline-subjective-v2 |
| Accepted charter and own-wallet finalized bonds | PASS | pipeline-b-fault-v2 |
| B liable; A/C pull refunds allocated | PASS | pipeline-b-fault-v2 |
| A liable; B/C faithful propagation | PASS | pipeline-a-fault-v2 |
| All-faithful finalized adjudication and filing allocation | FAILED_CONSENSUS | pipeline-faithful-v2 |
| Earlier uncertainty and deadline refunds | NOT_RUN | pipeline-unclear-v2 |
| Finalized record and higher next bond | PASS | pipeline-history-price-v2 |
| Native pull claim with positive verified credit | PASS | 0x32de291edc9b1c388b55f628bb63b36cbdb918465832db2ea6f9876df31c995b |

## Finalized receipts

- pipeline-subjective-v2: [compilation](https://explorer-studio.genlayer.com/tx/0xea10a8669caa1545710af18c818325818c5c6d1216b7e308ded1428d1bf4c3d3) FINALIZED/MAJORITY_AGREE. 
- pipeline-b-fault-v2: [compilation](https://explorer-studio.genlayer.com/tx/0x1bd279ebeb811d2cce5bcf9a4d47efe7b66bfd0f7730d6d86c4ad924b7b4710a) FINALIZED/MAJORITY_AGREE. [Adjudication](https://explorer-studio.genlayer.com/tx/0x8e60eaca45fbc1f2ba55700186e2277c61c3bd6eaac2532cdb18de46565fcf4e) and [settlement](https://explorer-studio.genlayer.com/tx/0x881c3692fd85ef898fdb58431e8fde7c88fcf7ca507e57bfcaaa6b939ca1a828) FINALIZED/MAJORITY_AGREE; PIPELINE_FAULT. 
- pipeline-history-price-v2: [compilation](https://explorer-studio.genlayer.com/tx/0xc67f2b06d80a963ec10203e5c04c8c7d84da4485d9416a4a3890239363a285f5) FINALIZED/MAJORITY_AGREE. 
- pipeline-a-fault-v2: [compilation](https://explorer-studio.genlayer.com/tx/0x1c81025b047530370036d0d2867994c728d472b58a44f6a61298eda82093fc09) FINALIZED/MAJORITY_AGREE. [Adjudication](https://explorer-studio.genlayer.com/tx/0x85089349981f1ebdd2d7da8ef9c853330940290b5f0a915a186e64f99a8f3614) and [settlement](https://explorer-studio.genlayer.com/tx/0x8176755511f7454d90303245835fb498ae160ae4a00a3654c6ca8e380e5dbfcf) FINALIZED/MAJORITY_AGREE; PIPELINE_FAULT. 
- pipeline-faithful-v2: [compilation](https://explorer-studio.genlayer.com/tx/0xc6e58767102ac1593395295f585cd600712ce9cbb5fea918fb6d616b7fed4670) FINALIZED/MAJORITY_AGREE. [Adjudication](https://explorer-studio.genlayer.com/tx/0xc368f549117703f9d0c6540ccecd4911f19a6f30c6751f2207696c78f9e1cb4e) failed consensus: FINALIZED/MAJORITY_DISAGREE, previously observed UNDETERMINED. 

## Accounting (wei)

| Case | A credit | B credit | C credit | Claimant credit |
| --- | ---: | ---: | ---: | ---: |
| pipeline-b-fault-v2 | 10 | 0 | 10 | 13 |
| pipeline-a-fault-v2 | 0 | 20 | 10 | 13 |

Credits are pull entitlements; A/C and B/C refunds are not claimed native payouts. The failed all-faithful job remains DISPUTED with empty credits and no penalty. Its frozen deadline has passed; permissionless settle can open timeout refund credits, but no further write was sent after the failed gate.

## Native claim

[Claim](https://explorer-studio.genlayer.com/tx/0x32de291edc9b1c388b55f628bb63b36cbdb918465832db2ea6f9876df31c995b), [child](https://explorer-studio.genlayer.com/tx/0x2e9008503e38bec0ce9dbcec3e66851ff4da52f37a3a309e7f8a2756f222bcb6), [verification](https://explorer-studio.genlayer.com/tx/0x90516b0fd2cb7e209e8ee535c6952e039132174fdb2d37a5235a253ba758911c): 13 wei, FINALIZED positive value_credited, accounting paid. Native-refund UI journey was not run.

## ACCEPTED appeal window

[Actual screenshot](pipeline-live/pipeline-b-fault-v2-accepted.png) retained exact hash 0x8e60eaca45fbc1f2ba55700186e2277c61c3bd6eaac2532cdb18de46565fcf4e with enabled appeal control at 2026-11-12T09:32:25.697Z. Independent protocol timestamps place capture inside ACCEPTED, before finality. No appeal was submitted. Account supplied through an EIP-1193 test signer bridge, not the MetaMask extension.

## Failure and next release

[Saved analysis](pipeline-live/faithful-failure-analysis.json) shows three successful leaders had identical assessments except for valid quote selection. Exact comparison of independently selected prose creates a consensus liveness risk; validator disagreement's complete internal cause cannot be proven from votes alone. A further leader failed local assessment validation. No prompt variant or second adjudication was sent.

Before another release: fix citation convergence while preserving exact ordered responsibility/evidence metadata and independent fetched-quote validation; add an adversarial test where validators choose different valid spans for the same verdict. Distinguish successful leader execution from consensus acceptance in transaction tracking. Recover the timed-out faithful escrow, then use a reviewed revised Court deployment and an explicitly authorized bounded live run. Never redeploy the original Court/Vault.

## Budget and checks

129 wei used/reserved against 100000000000000000 wei (0.1 GEN). No new deposit after the failure. 5 contract Explorer records and 39 transaction records verified through the real Explorer API; source bytes, bindings, completed accounting, fresh native child, operator records, appeal timing and original deployment regression passed. See [partial verifier](pipeline-live/partial-verification.json). The full release verifier deliberately refuses readiness.

Local checks: 217 direct tests; 18 frontend tests; TypeScript; three GenVM AST/SDK checks; webpack production build; desktop1440x960/mobile390x844 headless mocked workflows. Real production deployment/browser verification was not run because the live gate failed.
