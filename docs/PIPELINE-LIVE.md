# Pipeline Court live evidence

Verified 2026-11-12T15:29:45.711Z. StudioNet 61999. All incident logs are synthetic.

Source revision: 0d6ef16bcadd77d9a16a12dddb797676e09fab87.

The a36e0c8 deployment is the **previous attempt**; see [historical evidence](PIPELINE-PREVIOUS-ATTEMPT.md). Its 53 wei was recovered through [timeout settlement](https://explorer-studio.genlayer.com/tx/0x243492427cc3b27514f62c7959b18063fbade003655fdb8e79815635a069964e) and four individually verified native credits recorded in the historical manifest.

- [OperatorRecord: 0x20Dd0686FA5d377a5D26E37eD7D5a711DBb528bb](https://explorer-studio.genlayer.com/address/0x20Dd0686FA5d377a5D26E37eD7D5a711DBb528bb) — separate GenLayer Explorer Contract evidence.
- [PipelineCharter: 0xDf5CFd4E68a5DdFc13c0795D7096370A23d2f430](https://explorer-studio.genlayer.com/address/0xDf5CFd4E68a5DdFc13c0795D7096370A23d2f430) — separate GenLayer Explorer Contract evidence.
- [PipelineCourt: 0x282e3a9E52Ec05fDaE32DF787D88Ac3d5Ce70C41](https://explorer-studio.genlayer.com/address/0x282e3a9E52Ec05fDaE32DF787D88Ac3d5Ce70C41) — separate GenLayer Explorer Contract evidence.

## Finalized cases

- pipeline-subjective-v2: REJECTED. [Compilation](https://explorer-studio.genlayer.com/tx/0x20fd0fd6d810c93acd97f03fc97d9387b3b33c3080f607e918b28731f6ccf1e6).
- pipeline-b-fault-v2: PIPELINE_FAULT. [Compilation](https://explorer-studio.genlayer.com/tx/0x6cf250dfce38d10216c944af6ccea44dfd56ad76c398c453971d2d75b0f1fc68). [Adjudication](https://explorer-studio.genlayer.com/tx/0xbf48f171990b956d6d64c286bbd814ff73adf67132880edc88077c9998412d02). [Settlement](https://explorer-studio.genlayer.com/tx/0xede90d9fc12a4e962862d30cdbace8b5c94078e9913f50e0f6853249bcfad5c2).
- pipeline-a-fault-v2: PIPELINE_FAULT. [Compilation](https://explorer-studio.genlayer.com/tx/0xee68c2df2e2709d3cfe0ee9885c8bece57145a1c76e0e174f85e3dd9f38adb28). [Adjudication](https://explorer-studio.genlayer.com/tx/0x58d8d86f0be8deb5d42aee30d0eeab72514b08efe3acdd3e89f48ab4405ec454). [Settlement](https://explorer-studio.genlayer.com/tx/0xb28b3c88cecef6eb81f496bc1a4af04aa95a4a328547ffce6e741c198c288ddf).
- pipeline-faithful-v2: NO_PIPELINE_FAULT. [Compilation](https://explorer-studio.genlayer.com/tx/0xb0fbf07fcc53df026bd9f9c4d4a60a5d8ab3d94a1a4a5ed3401226c4916bf3d0). [Adjudication](https://explorer-studio.genlayer.com/tx/0x8190d11555bcd8d96bccdf01b78ec1696cb226632c5e60b3e7a52d66bd6ff349). [Settlement](https://explorer-studio.genlayer.com/tx/0xd184f07c5ef5fd42a4d0aaf3780f334b1bc7fb926ccf475b9c756e8178acb5fb).
- pipeline-unclear-v2: VOID_EARLIER_UNCERTAINTY. [Compilation](https://explorer-studio.genlayer.com/tx/0x537e154474661ee4b3c62c2df4f18a3aa7b57ede9dc6eb3548186f72515edafe). [Adjudication](https://explorer-studio.genlayer.com/tx/0x39aa06840d2932015e0b0c4937b4d63e65ca9234f8377723420289962aee7289). [Settlement](https://explorer-studio.genlayer.com/tx/0x5050d4ddf2d7be6a90bc63217e8377bdfb61326503e3802d1fb3219513728f0f).
- pipeline-history-price-v2: Higher bond verified. [Compilation](https://explorer-studio.genlayer.com/tx/0xc843ecb866cd95dcdeebe96a1289e049cf47a19aa2dd4be10757f488f540dfe1).

All above parent transactions are protocol FINALIZED with successful execution. The accepted charter's own-wallet bond deposit receipts are retained individually in the manifest. The eight required milestones share these six charters; they are not described as eight separate adjudications.

## Deterministic accounting (wei)

| Case | A credit | B credit | C credit | Claimant credit | Liable step |
| --- | ---: | ---: | ---: | ---: | --- |
| pipeline-b-fault-v2 | 10 | 0 | 10 | 13 | B |
| pipeline-a-fault-v2 | 0 | 20 | 10 | 13 | A |
| pipeline-faithful-v2 | 21 | 21 | 11 | 0 | None |
| pipeline-unclear-v2 | 20 | 20 | 10 | 3 | None |

## Native credit

[Claim](https://explorer-studio.genlayer.com/tx/0x6eb2fd46560881d79903c880f7af0fc255daa80fa928d8841c2ccc66c31cd284), [native child](https://explorer-studio.genlayer.com/tx/0x23d67ea5cd398f53367d6c607fbf778d7d56309600580ed5ea200e938d8d0e99), [verification](https://explorer-studio.genlayer.com/tx/0xdfab29cbab70a0266e71999d0d2e10e117c1f01b6a91b6bc88213971777efcc0). Positive value_credited verified; amount 13 wei. Unclaimed operator refunds remain pull credits.

## Appeal window

Exact hash 0xbf48f171990b956d6d64c286bbd814ff73adf67132880edc88077c9998412d02; enabled control captured during ACCEPTED at 2026-11-12T10:56:36.398Z. No appeal sent. Actual existing StudioNet test account through EIP-1193 bridge; not the MetaMask extension. Screenshot: [capture](../docs/pipeline-live/pipeline-b-fault-v2-accepted.png).

## Budget and verification

Deposits reserved/used: 311 wei against the 100000000000000000 wei (0.1 GEN) cap. Every write intent counts toward the cap even if a later transaction fails. Read-only npm run verify:pipeline checks source identity, bindings, finality, accounting, native credit and Explorer identity. Original Court/Vault regression passes.
