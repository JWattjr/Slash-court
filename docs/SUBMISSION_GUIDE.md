# SlashCourt submission guide

## Submission gate

**Do not submit yet: RESUBMIT-READY = NO.** Verified on 2026-09-19:

- The deployed Court and Vault source is byte-identical to `068ac47`.
- Production runs `dpl_rWzPfcYssEurAPw1PmG1xNkECHF2`, created one minute
  after `068ac47`. Its marker reads `local-candidate` because it was a CLI
  deploy.
- Seven finalized current cases prove canonical binding, citation metadata,
  and one-time accounting.

The newest case-7, adjudication `0x093fcb32…d170fcdd`, went from ACCEPTED to
finality in about 30 seconds on 2026-09-14. No enabled ACCEPTED-window appeal
control was captured in any run. No appeal was submitted. See
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
release contains seven synthetic current cases. The root element's
`data-source-revision` currently reads `local-candidate` because production was
a CLI deploy of `068ac47`. The deployed contract source can be checked with
`gen_getContractCode`. If an RPC read
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

> The steward should see fresh Court `0x56e26ec256afe37199fe9845e039f5DEdd9e955a`, Vault `0xb1fD046CA7D92b84b16f66bdE676f442cA599Aa7`, rulebook v1, and seven current synthetic cases. Case-1 shows a finalized 0.5 GEN negligence penalty; case-2 shows finalized R4 external outage with no slash; case-3 shows a finalized 0.25 GEN negligence penalty; case-4 and case-5 each show a finalized 0.125 GEN negligence penalty with a 0.1/0.025 beneficiary/safety split; case-6 and case-7 each show a finalized 0.05 GEN negligence penalty with a 0.04/0.01 split. Aggregate bond accounting is 0.9 GEN available, zero locked, 1.1 GEN penalties, and 0.22 GEN in the safety pool across seven applications. Historical cases are labelled historical. The ACCEPTED appeal-window screenshot remains unverified.

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
- **Current Vercel deployment:** [dpl_rWzPfcYssEurAPw1PmG1xNkECHF2](https://vercel.com/wattxs-projects/slash-court/rWzPfcYssEurAPw1PmG1xNkECHF2)
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
| Canonical duty binding | `contracts/slash_court.py` and `contracts/operator_bond_vault.py` | Current Court/Vault reads for case-1 through case-7 carry the commitment digest and duty-bound application; case-7 shows the exact duty, trigger, deadlines, expected action, and R1/R3 |
| Fetched citation metadata | `_authoritative_citation`, `_canonicalize_adjudication_result`, `_consensus_bound_result` | Current finalized records preserve evidence ID, party, type, domain, hash, and rule metadata; case-5 independently proves both parties |
| Appealable ACCEPTED retention | `frontend/app/page.tsx`, `frontend/lib/slashcourt/client.ts`, `frontend/lib/slashcourt/transactions.ts` | Production runs `068ac47`, supported by evidence as described above, and the rendered workflow test passes. No live capture of an enabled control exists across seven runs; this is the only blocker. |
| Finality-safe one-time penalty | `acknowledge_adjudication_finalized` and `apply_resolution` | Seven finalized applications. Case-7 has one `apply_resolution`, created only after finality, and no retry. Aggregate penalties are 1.1 GEN |
| Wallet-free public review | Case hash route, Explorer links, advanced metadata section | Production case-1 through case-7 links and public captures |

## Evidence links

- [Pre-adjudication capture](evidence/pre-adjudication-case-1.png)
- [Finalized production capture](evidence/finalized-case-1.png)
- [Finalized case-3 capture](evidence/case-3-finalized-no-appeal-window.png) (not ACCEPTED-window proof)
- [Finalized case-4 capture](evidence/case-4-finalized-no-appeal-window.png) (not ACCEPTED-window proof)
- [Case-5 ready-state capture](evidence/case-5-ready-before-consensus.png)
- [Finalized case-5 capture](evidence/case-5-finalized.png) (not ACCEPTED-window proof)
- No ACCEPTED-window capture or recording is available; do not present a finalized view as that proof.
- [Full deployment and case record](../deploy/current-demo.json)
- [Deployment provenance](../deploy/last-deployment.json)
- [Current source revision 068ac47](https://github.com/JWattjr/Slash-court/commit/068ac471bd365aee0a3c4a7a78ea334a90a7ed09)
- [Historical production source revision c9e97bd](https://github.com/JWattjr/Slash-court/commit/c9e97bd6c1e50efa5eaf5b4b1ef74bfe4b97f376)

## Final check

- Keep the YouTube field blank.
- Confirm exact portal taxonomy before submitting.
- Confirm current Court/Vault links open on StudioNet. Note that the
  production `data-source-revision` reads `local-candidate`.
  Redeploy from Git if an exact SHA marker is required.
- Keep all predecessor cases labelled historical and all fixtures labelled synthetic.
- Do not claim an enabled ACCEPTED appeal control; it was not captured in any of
  the seven bounded runs.
- Submit only after replacing the gate with **YES** following one bounded live
  ACCEPTED-window capture. Keep the YouTube field blank unless a polished
  recording exists.
