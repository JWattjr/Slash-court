# SlashCourt submission guide

## Submission gate

**Do not submit yet: RESUBMIT-READY = NO.** The current Court/Vault pair and
frontend are deployed, with finalized negligence and external-outage/no-slash
proofs plus the final bounded case-3 attempt. Three bounded ACCEPTED-window
captures were missed before finality. No appeal was submitted. See
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

> SlashCourt settles bonded-automation disputes. Each case is hash-bound to its vault duty, trigger, deadlines, expected action, parties, exposure, rulebook, and alleged rules. GenLayer validators fetch allowlisted evidence and preserve every citation's party, hash, type, domain, and rule metadata. Deterministic contracts map responsibility to fixed, capped penalties; the vault applies each result once, only after finality. The current StudioNet deployment proves finalized synthetic negligence cases plus a finalized R4 external-outage case with no slash; the final case-3 run records a 0.25 GEN penalty and a 0.2/0.05 GEN beneficiary/safety split. Historical predecessor deployments provide clearly labelled misconduct and insufficient-evidence contrasts. The console exposes case facts, evidence, response, adjudication transaction, finality, and actual Vault accounting wallet-free. This is demo bond accounting, not real incidents, real TVL, or native validator stake.

## Demo video

Leave blank unless a polished recording is available.

## How-to

### 1. Open the upgraded console

Visit [https://slash-court.vercel.app](https://slash-court.vercel.app). Confirm
the header identifies Court `0x56e2…e955a` and Vault `0xb1fD…9Aa7`, StudioNet
chain `61999`, rulebook v1, and the current deployment status. The current
release contains three synthetic current cases. If an RPC read
fails, the UI labels it unavailable or partial and keeps writes locked.

### 2. Open the current cases

Open [case-1](https://slash-court.vercel.app/#case/current/case-1),
[case-2](https://slash-court.vercel.app/#case/current/case-2), and
[case-3](https://slash-court.vercel.app/#case/current/case-3). Confirm each
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
three current cases: two negligence proofs and an excusable external outage.

## Expected verification outcome

> The steward should see fresh Court `0x56e26ec256afe37199fe9845e039f5DEdd9e955a`, Vault `0xb1fD046CA7D92b84b16f66bdE676f442cA599Aa7`, rulebook v1, and three current synthetic cases. Case-1 shows finalized NEGLIGENT_FAILURE, PARTIAL_SLASH, a 0.5 GEN penalty, and a 0.4/0.1 beneficiary/safety split. Case-2 shows finalized EXTERNAL_OUTAGE, supported R4, NO_SLASH, and zero movement. Case-3 shows finalized NEGLIGENT_FAILURE, PARTIAL_SLASH, a 0.25 GEN penalty, and a 0.2/0.05 beneficiary/safety split. Historical predecessor cases are labelled historical. The ACCEPTED appeal-window screenshot remains unverified; RPC failures never appear as empty state.

## Contract links

1. Court: [https://explorer-studio.genlayer.com/address/0x56e26ec256afe37199fe9845e039f5DEdd9e955a](https://explorer-studio.genlayer.com/address/0x56e26ec256afe37199fe9845e039f5DEdd9e955a)
2. Vault: [https://explorer-studio.genlayer.com/address/0xb1fD046CA7D92b84b16f66bdE676f442cA599Aa7](https://explorer-studio.genlayer.com/address/0xb1fD046CA7D92b84b16f66bdE676f442cA599Aa7)

## Project links

- **Website:** [https://slash-court.vercel.app](https://slash-court.vercel.app)
- **GitHub:** [https://github.com/JWattjr/Slash-court](https://github.com/JWattjr/Slash-court)
- **Current case:** [https://slash-court.vercel.app/#case/current/case-1](https://slash-court.vercel.app/#case/current/case-1)
- **Current outage contrast:** [https://slash-court.vercel.app/#case/current/case-2](https://slash-court.vercel.app/#case/current/case-2)
- **Final bounded case:** [https://slash-court.vercel.app/#case/current/case-3](https://slash-court.vercel.app/#case/current/case-3)
- **Adjudication:** [https://explorer-studio.genlayer.com/tx/0x003e75129584a8a044f86a50b79f1f34cc8e48de5c5ad91daeb52c47eed550c2](https://explorer-studio.genlayer.com/tx/0x003e75129584a8a044f86a50b79f1f34cc8e48de5c5ad91daeb52c47eed550c2)
- **Vault application:** [https://explorer-studio.genlayer.com/tx/0xb317a13f944b9165d5b851cd889050ea06bf39ed9fd0233513de7d95403c915c](https://explorer-studio.genlayer.com/tx/0xb317a13f944b9165d5b851cd889050ea06bf39ed9fd0233513de7d95403c915c)
- **Outage adjudication:** [https://explorer-studio.genlayer.com/tx/0x27350a2b64cd0dce7c505678787c9e6d7085b064446e224ea03d591b8fa06d3b](https://explorer-studio.genlayer.com/tx/0x27350a2b64cd0dce7c505678787c9e6d7085b064446e224ea03d591b8fa06d3b)
- **Outage Vault application:** [https://explorer-studio.genlayer.com/tx/0x42493f6116efb397dd78202174df0ada3d2a7861e046492c4eda06f69cde7645](https://explorer-studio.genlayer.com/tx/0x42493f6116efb397dd78202174df0ada3d2a7861e046492c4eda06f69cde7645)

## Steward requirement map

| Requirement | Local implementation | Current evidence |
| --- | --- | --- |
| Canonical duty binding | `contracts/slash_court.py` and `contracts/operator_bond_vault.py` | Current Court/Vault reads for case-1, case-2, and case-3 carry the commitment digest and duty-bound application |
| Fetched citation metadata | `_authoritative_citation`, `_canonicalize_adjudication_result`, `_consensus_bound_result` | Finalized case-1, case-2, and case-3 console records preserve evidence ID, party, type, domain, hash, and rule metadata |
| Appealable ACCEPTED retention | `frontend/app/page.tsx`, `frontend/lib/slashcourt/client.ts`, `frontend/lib/slashcourt/transactions.ts` | Tests pass; live hash retained, but enabled-control capture remains a blocker |
| Finality-safe one-time penalty | `acknowledge_adjudication_finalized` and `apply_resolution` | Finalized case-1/case-2 receipts plus case-3 `Applied once` read; deterministic accounting is 0.75 GEN total after three current applications |
| Wallet-free public review | Case hash route, Explorer links, advanced metadata section | Production case-1/case-2/case-3 links and public captures |

## Evidence links

- [Pre-adjudication capture](evidence/pre-adjudication-case-1.png)
- [Finalized production capture](evidence/finalized-case-1.png)
- [Finalized case-3 capture](evidence/case-3-finalized-no-appeal-window.png) (not ACCEPTED-window proof)
- No ACCEPTED-window capture or recording is available; do not present a finalized view as that proof.
- [Full deployment and case record](../deploy/current-demo.json)
- [Deployment provenance](../deploy/last-deployment.json)

## Final check

- Keep the YouTube field blank.
- Confirm exact portal taxonomy before submitting.
- Confirm current Court/Vault links open on StudioNet.
- Keep all predecessor cases labelled historical and all fixtures labelled synthetic.
- Do not claim an enabled ACCEPTED appeal control; it was not captured in the final bounded run.
- Submit only after replacing the gate with **YES** following a bounded live capture.
