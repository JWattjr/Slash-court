# SlashCourt submission guide

## Submission gate

**RESUBMIT-READY = YES** (verified 2026-09-21):

- The deployed Court and Vault source is byte-identical to the repository.
- Production runs `dpl_9hjHjBeGb6PADjmNvDAotN9ynMGE`, built from `f55f083`;
  the page root reports that exact commit in `data-source-revision`.
- Case-8 captured the enabled **Appeal accepted adjudication** control for the
  retained ACCEPTED adjudication `0x16991e32…24b1564`, 12.3 s after ACCEPTED
  and 20.8 s before finality. The appeal was not submitted.
- Eight finalized current cases prove canonical binding, citation metadata,
  and one-time accounting.

See
[docs/DEMO_READINESS.md](DEMO_READINESS.md) for the evidence boundary.

The optional demo-video field should remain blank.

## Identity

- **Logo:** `frontend/public/slashcourt-logo.png`
- **Project name:** SlashCourt
- **Primary tag:** Infrastructure (or the closest `Infrastructure & Tooling` option)
- **Tag 1:** Security
- **Tag 2:** Governance (or the closest exact portal option)

## One-liner

> Accountability for bonded automation: GenLayer validators assess disputed evidence under a shared rulebook, while deterministic contracts cap operator penalties.

## Description

> SlashCourt settles bonded-automation disputes. Each case is hash-bound to its vault duty, trigger, deadlines, expected action, parties, exposure, rulebook, and alleged rules. GenLayer validators fetch allowlisted evidence and preserve every citation's party, hash, type, domain, and rule metadata. Deterministic contracts map responsibility to fixed, capped penalties; the vault applies each result once, only after finality. The current StudioNet deployment proves four finalized synthetic negligence cases plus a finalized R4 external-outage case with no slash. Historical predecessor deployments provide clearly labelled misconduct and insufficient-evidence contrasts. The console exposes case facts, evidence, response, adjudication transaction, finality, and actual Vault accounting wallet-free. This is demo bond accounting, not real incidents, real TVL, or native validator stake.

## Demo video

Leave blank unless a polished recording is available.

## How-to

### 1. Open the upgraded console

Visit [https://slash-court.vercel.app](https://slash-court.vercel.app). Confirm
the header identifies Court `0x56e2…e955a` and Vault `0xb1fD…9Aa7`, StudioNet
chain `61999`, rulebook v1, and the current deployment status. The current
release contains eight synthetic current cases. Inspect the root element's
`data-source-revision` and confirm it equals
`f55f08379c436787f251fe1d11b998240bb48337`. The deployed contract source can be
checked with `gen_getContractCode`. If an RPC read
fails, the UI labels it unavailable or partial and keeps writes locked.

### 2. Open the current cases

Open [case-1](https://slash-court.vercel.app/#case/current/case-1),
[case-2](https://slash-court.vercel.app/#case/current/case-2), and
[case-3](https://slash-court.vercel.app/#case/current/case-3),
[case-4](https://slash-court.vercel.app/#case/current/case-4), and
[case-5](https://slash-court.vercel.app/#case/current/case-5). Confirm each
synthetic claim's canonical duty, trigger, deadlines, expected action, alleged
rules, fetched evidence, and operator response before opening technical
metadata.

### 3. Compare finalized outcomes

For case-1, confirm `NEGLIGENT_FAILURE`, `PARTIAL_SLASH`, `0.5 GEN`,
`FINALIZED`, and the adjudication transaction
[`0x003e…50c2`](https://explorer-studio.genlayer.com/tx/0x003e75129584a8a044f86a50b79f1f34cc8e48de5c5ad91daeb52c47eed550c2).
The console must show Vault application **Applied once**, `0.4 GEN`
beneficiary compensation, and `0.1 GEN` safety-pool allocation.

For case-2, confirm `EXTERNAL_OUTAGE`, `NO_SLASH`, supported exemption `R4`,
`0 GEN`, and the finalized adjudication
[`0x2735…6d3b`](https://explorer-studio.genlayer.com/tx/0x27350a2b64cd0dce7c505678787c9e6d7085b064446e224ea03d591b8fa06d3b). The
Vault application is finalized and applied once with no balance movement.

For case-3, confirm `NEGLIGENT_FAILURE`, `PARTIAL_SLASH`, `0.25 GEN`, and the
finalized adjudication
[`0xd315…4203`](https://explorer-studio.genlayer.com/tx/0xd315d43889d5c0be676490504ce88c604fe72448058d948f8ef832a5e8e04203).
The console shows the Vault application as **Applied once**, with `0.2 GEN`
beneficiary compensation and `0.05 GEN` safety-pool allocation. The linked
[capture](evidence/case-3-finalized-no-appeal-window.png) is finality evidence
only; it is not an ACCEPTED-window capture.

For case-4, confirm `NEGLIGENT_FAILURE`, `PARTIAL_SLASH`, `0.125 GEN`, and the
finalized adjudication
[`0x492d…1ede`](https://explorer-studio.genlayer.com/tx/0x492d5254686ae2155465ac180b794f889ec5b17570ef1c4192df028b69fb1ede).
The console shows **Applied once**, with `0.1 GEN` beneficiary compensation
and `0.025 GEN` safety-pool allocation. Its
[capture](evidence/case-4-finalized-no-appeal-window.png) proves finality only,
not the ACCEPTED window.

For case-5, confirm `NEGLIGENT_FAILURE`, `PARTIAL_SLASH`, `0.125 GEN`, and the
finalized adjudication
[`0xf9a3…06d2`](https://explorer-studio.genlayer.com/tx/0xf9a3bca4fd27533252a28cefed0f82aa1ae556b9c7bfcf509ce67b7129e906d2).
The console shows **Applied once**, with `0.1 GEN` beneficiary compensation
and `0.025 GEN` safety-pool allocation. The
[case-5 capture](evidence/case-5-finalized.png) proves finality and accounting,
not the ACCEPTED window. Its finality-triggered Vault application is
[`0x23d9…c21f`](https://explorer-studio.genlayer.com/tx/0x23d99e6c3848f6bbd0d2e741100650b5c66f449265e32903e240dd453573c21f).

### 4. Inspect the proof

Open each evidence link, Court address, adjudication transaction, and available
Vault application receipt. Review [deploy/current-demo.json](../deploy/current-demo.json),
[deploy/last-deployment.json](../deploy/last-deployment.json), the tests, and
the [finalized capture](evidence/finalized-case-1.png). The safety pool is a
protocol reserve, not platform revenue.

### 5. Compare historical classifications

Use the console's explicitly labelled historical section for synthetic
predecessor examples of provable misconduct and insufficient evidence. Do not
describe those case IDs as belonging to the fresh Court. The fresh release has
five current cases: four negligence proofs and an excusable external outage.

## Expected verification outcome

> The steward should see fresh Court `0x56e26ec256afe37199fe9845e039f5DEdd9e955a`, Vault `0xb1fD046CA7D92b84b16f66bdE676f442cA599Aa7`, rulebook v1, and eight current synthetic cases. Case-1 shows a finalized 0.5 GEN negligence penalty; case-2 shows finalized R4 external outage with no slash; case-3 shows a finalized 0.25 GEN negligence penalty; case-4 and case-5 each show a finalized 0.125 GEN negligence penalty with a 0.1/0.025 beneficiary/safety split; case-6, case-7, and case-8 each show a finalized 0.05 GEN negligence penalty with a 0.04/0.01 split. Aggregate bond accounting is 0.85 GEN available, zero locked, 1.15 GEN penalties, and 0.23 GEN in the safety pool across eight applications. The case-8 capture shows the enabled appeal control during ACCEPTED. Historical cases are labelled historical.

## Contract links

1. Court: [https://explorer-studio.genlayer.com/address/0x56e26ec256afe37199fe9845e039f5DEdd9e955a](https://explorer-studio.genlayer.com/address/0x56e26ec256afe37199fe9845e039f5DEdd9e955a)
2. Vault: [https://explorer-studio.genlayer.com/address/0xb1fD046CA7D92b84b16f66bdE676f442cA599Aa7](https://explorer-studio.genlayer.com/address/0xb1fD046CA7D92b84b16f66bdE676f442cA599Aa7)

## Project links

- **Website:** [https://slash-court.vercel.app](https://slash-court.vercel.app)
- **GitHub:** [https://github.com/JWattjr/Slash-court](https://github.com/JWattjr/Slash-court)
- **Current case:** [https://slash-court.vercel.app/#case/current/case-1](https://slash-court.vercel.app/#case/current/case-1)
- **Current outage contrast:** [https://slash-court.vercel.app/#case/current/case-2](https://slash-court.vercel.app/#case/current/case-2)
- **Additional bounded case:** [https://slash-court.vercel.app/#case/current/case-4](https://slash-court.vercel.app/#case/current/case-4)
- **Final bounded case:** [https://slash-court.vercel.app/#case/current/case-5](https://slash-court.vercel.app/#case/current/case-5)
- **Case-7 (steward appeal-window run):** [https://slash-court.vercel.app/#case/current/case-7](https://slash-court.vercel.app/#case/current/case-7)
- **Case-7 adjudication:** [0x093fcb32c4c2d4a751ad0cdff969f89ac3d85974ff34d9971071d046d170fcdd](https://explorer-studio.genlayer.com/tx/0x093fcb32c4c2d4a751ad0cdff969f89ac3d85974ff34d9971071d046d170fcdd)
- **Case-7 Vault application:** [0xc9237058af58cb64b03fb0393993e82b1e44db579d6048e1d4efb700c83a5a78](https://explorer-studio.genlayer.com/tx/0xc9237058af58cb64b03fb0393993e82b1e44db579d6048e1d4efb700c83a5a78)
- **Case-8 (ACCEPTED-window proof):** [https://slash-court.vercel.app/#case/current/case-8](https://slash-court.vercel.app/#case/current/case-8)
- **Case-8 adjudication:** [0x16991e322679b301b6e6d57e0eca621f029bd791650f6d60b5a5141aa24b1564](https://explorer-studio.genlayer.com/tx/0x16991e322679b301b6e6d57e0eca621f029bd791650f6d60b5a5141aa24b1564)
- **Case-8 Vault application:** [0x54eea353b9bf788e1add183b54392ac2c88863cc6c5a5979365fb81508eeb187](https://explorer-studio.genlayer.com/tx/0x54eea353b9bf788e1add183b54392ac2c88863cc6c5a5979365fb81508eeb187)
- **Current Vercel deployment:** [dpl_9hjHjBeGb6PADjmNvDAotN9ynMGE](https://vercel.com/wattxs-projects/slash-court/9hjHjBeGb6PADjmNvDAotN9ynMGE)
- **Historical Vercel deployment (superseded):** [dpl_rWzPfcYssEurAPw1PmG1xNkECHF2](https://vercel.com/wattxs-projects/slash-court/rWzPfcYssEurAPw1PmG1xNkECHF2)
- **Historical Vercel deployment (superseded):** [dpl_FLyQqLt8AJkpJ5ecj7XMqpNAaPzU](https://vercel.com/wattxs-projects/slash-court/FLyQqLt8AJkpJ5ecj7XMqpNAaPzU)
- **Case-4 adjudication:** [https://explorer-studio.genlayer.com/tx/0x492d5254686ae2155465ac180b794f889ec5b17570ef1c4192df028b69fb1ede](https://explorer-studio.genlayer.com/tx/0x492d5254686ae2155465ac180b794f889ec5b17570ef1c4192df028b69fb1ede)
- **Case-5 adjudication:** [https://explorer-studio.genlayer.com/tx/0xf9a3bca4fd27533252a28cefed0f82aa1ae556b9c7bfcf509ce67b7129e906d2](https://explorer-studio.genlayer.com/tx/0xf9a3bca4fd27533252a28cefed0f82aa1ae556b9c7bfcf509ce67b7129e906d2)
- **Case-5 Vault application:** [https://explorer-studio.genlayer.com/tx/0x23d99e6c3848f6bbd0d2e741100650b5c66f449265e32903e240dd453573c21f](https://explorer-studio.genlayer.com/tx/0x23d99e6c3848f6bbd0d2e741100650b5c66f449265e32903e240dd453573c21f)
- **Adjudication:** [https://explorer-studio.genlayer.com/tx/0x003e75129584a8a044f86a50b79f1f34cc8e48de5c5ad91daeb52c47eed550c2](https://explorer-studio.genlayer.com/tx/0x003e75129584a8a044f86a50b79f1f34cc8e48de5c5ad91daeb52c47eed550c2)
- **Vault application:** [https://explorer-studio.genlayer.com/tx/0xb317a13f944b9165d5b851cd889050ea06bf39ed9fd0233513de7d95403c915c](https://explorer-studio.genlayer.com/tx/0xb317a13f944b9165d5b851cd889050ea06bf39ed9fd0233513de7d95403c915c)
- **Outage adjudication:** [https://explorer-studio.genlayer.com/tx/0x27350a2b64cd0dce7c505678787c9e6d7085b064446e224ea03d591b8fa06d3b](https://explorer-studio.genlayer.com/tx/0x27350a2b64cd0dce7c505678787c9e6d7085b064446e224ea03d591b8fa06d3b)
- **Outage Vault application:** [https://explorer-studio.genlayer.com/tx/0x42493f6116efb397dd78202174df0ada3d2a7861e046492c4eda06f69cde7645](https://explorer-studio.genlayer.com/tx/0x42493f6116efb397dd78202174df0ada3d2a7861e046492c4eda06f69cde7645)

## Steward requirement map

| Requirement | Local implementation | Current evidence |
| --- | --- | --- |
| Canonical duty binding | `contracts/slash_court.py` and `contracts/operator_bond_vault.py` | Current Court/Vault reads for case-1 through case-8 carry the commitment digest and duty-bound application; case-8 shows the exact duty, trigger, deadlines, expected action, and R1/R3 |
| Fetched citation metadata | `_authoritative_citation`, `_canonicalize_adjudication_result`, `_consensus_bound_result` | Current finalized records preserve evidence ID, party, type, domain, hash, and rule metadata; case-5 independently proves both parties |
| Appealable ACCEPTED retention | `frontend/app/page.tsx`, `frontend/lib/slashcourt/client.ts`, `frontend/lib/slashcourt/transactions.ts` | Verified `f55f083` production build; case-8 screenshot shows the enabled appeal control for the retained ACCEPTED hash inside the window; the rendered workflow test passes |
| Finality-safe one-time penalty | `acknowledge_adjudication_finalized` and `apply_resolution` | Eight finalized applications. Case-8 has one `apply_resolution`, created only after finality, and no retry. Aggregate penalties are 1.15 GEN |
| Wallet-free public review | Case hash route, Explorer links, advanced metadata section | Production case-1 through case-8 links and public captures |

## Evidence links

- [Pre-adjudication capture](evidence/pre-adjudication-case-1.png)
- [Finalized production capture](evidence/finalized-case-1.png)
- [Finalized case-3 capture](evidence/case-3-finalized-no-appeal-window.png) (not ACCEPTED-window proof)
- [Finalized case-4 capture](evidence/case-4-finalized-no-appeal-window.png) (not ACCEPTED-window proof)
- [Case-5 ready-state capture](evidence/case-5-ready-before-consensus.png)
- [Finalized case-5 capture](evidence/case-5-finalized.png) (not ACCEPTED-window proof)
- [Case-8 ACCEPTED-window capture](evidence/case-8-accepted-appeal-window.png) (the ACCEPTED-window proof)
- [Full deployment and case record](../deploy/current-demo.json)
- [Deployment provenance](../deploy/last-deployment.json)
- [Production source revision f55f083](https://github.com/JWattjr/Slash-court/commit/f55f08379c436787f251fe1d11b998240bb48337)
- [Code revision 068ac47](https://github.com/JWattjr/Slash-court/commit/068ac471bd365aee0a3c4a7a78ea334a90a7ed09)
- [Historical production source revision c9e97bd](https://github.com/JWattjr/Slash-court/commit/c9e97bd6c1e50efa5eaf5b4b1ef74bfe4b97f376)

## Final check

- Keep the YouTube field blank.
- Confirm exact portal taxonomy before submitting.
- Confirm current Court/Vault links open on StudioNet and the production
  `data-source-revision` equals `f55f08379c436787f251fe1d11b998240bb48337`.
- Keep all predecessor cases labelled historical and all fixtures labelled synthetic.
- Present case-8 as the ACCEPTED-window proof; do not present finalized
  screenshots of cases 1–7 as that proof.
- Never click Appeal on any case. Keep the YouTube field blank unless a
  polished recording exists.
