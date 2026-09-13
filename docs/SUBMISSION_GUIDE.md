# SlashCourt submission guide

## Submission gate

**Do not submit yet: RESUBMIT-READY = NO.** The current Court/Vault pair and
frontend are deployed and the finalized negligence proof is verified. The live
ACCEPTED-window capture was missed because eligibility was temporarily
unavailable before finality. No appeal was submitted. See
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

> SlashCourt settles bonded-automation disputes. Each case is hash-bound to its vault duty, trigger, deadlines, expected action, parties, exposure, rulebook, and alleged rules. GenLayer validators fetch allowlisted evidence and preserve every citation's party, hash, type, domain, and rule metadata. Deterministic contracts map responsibility to fixed, capped penalties; the vault applies each result once, only after finality. The current StudioNet deployment proves a finalized synthetic negligence case with a 0.5 GEN penalty and a 0.4/0.1 GEN beneficiary/safety split. Historical predecessor deployments provide clearly labelled misconduct, external-outage, and insufficient-evidence contrasts. The console exposes case facts, evidence, response, adjudication transaction, finality, and actual Vault accounting wallet-free. This is demo bond accounting, not real incidents, real TVL, or native validator stake.

## Demo video

Leave blank unless a polished recording is available.

## How-to

### 1. Open the upgraded console

Visit [https://slash-court.vercel.app](https://slash-court.vercel.app). Confirm
the header identifies Court `0x56e2…e955a` and Vault `0xb1fD…9Aa7`, StudioNet
chain `61999`, rulebook v1, and the current deployment status. If an RPC read
fails, the UI labels it unavailable or partial and keeps writes locked.

### 2. Open the current case

Open [case-1](https://slash-court.vercel.app/#case/current/case-1). Confirm the
synthetic negligence claim, canonical duty, trigger, deadlines, expected
action, alleged rules R1/R3, claimant evidence, and operator response.

### 3. Verify finalized settlement

Confirm `NEGLIGENT_FAILURE`, `PARTIAL_SLASH`, `0.5 GEN`, `FINALIZED`, and the
adjudication transaction
[`0x003e…50c2`](https://explorer-studio.genlayer.com/tx/0x003e75129584a8a044f86a50b79f1f34cc8e48de5c5ad91daeb52c47eed550c2).
The console must show Vault application **Applied once**, `0.4 GEN`
beneficiary compensation, and `0.1 GEN` safety-pool allocation.

### 4. Inspect the proof

Open the evidence link, Court address, finality acknowledgement, and Vault
application receipt. Review [deploy/current-demo.json](../deploy/current-demo.json),
[deploy/last-deployment.json](../deploy/last-deployment.json), the tests, and
the [finalized capture](evidence/finalized-case-1.png). The safety pool is a
protocol reserve, not platform revenue.

### 5. Compare historical classifications

Use the console's explicitly labelled historical section for synthetic
predecessor examples of provable misconduct, external outage, and insufficient
evidence. Do not describe those case IDs as belonging to the fresh Court. The
fresh release currently has one verified negligence case.

## Expected verification outcome

> The steward should see fresh Court `0x56e26ec256afe37199fe9845e039f5DEdd9e955a`, Vault `0xb1fD046CA7D92b84b16f66bdE676f442cA599Aa7`, rulebook v1, and one current synthetic case. Case-1 must show finalized NEGLIGENT_FAILURE, PARTIAL_SLASH, a 0.5 GEN penalty, and a 0.4/0.1 beneficiary/safety split. Historical predecessor cases provide the other classifications and are labelled historical. The ACCEPTED appeal-window screenshot is not yet verified; RPC failures never appear as empty state.

## Contract links

1. Court: [https://explorer-studio.genlayer.com/address/0x56e26ec256afe37199fe9845e039f5DEdd9e955a](https://explorer-studio.genlayer.com/address/0x56e26ec256afe37199fe9845e039f5DEdd9e955a)
2. Vault: [https://explorer-studio.genlayer.com/address/0xb1fD046CA7D92b84b16f66bdE676f442cA599Aa7](https://explorer-studio.genlayer.com/address/0xb1fD046CA7D92b84b16f66bdE676f442cA599Aa7)

## Project links

- **Website:** [https://slash-court.vercel.app](https://slash-court.vercel.app)
- **GitHub:** [https://github.com/JWattjr/Slash-court](https://github.com/JWattjr/Slash-court)
- **Current case:** [https://slash-court.vercel.app/#case/current/case-1](https://slash-court.vercel.app/#case/current/case-1)
- **Adjudication:** [https://explorer-studio.genlayer.com/tx/0x003e75129584a8a044f86a50b79f1f34cc8e48de5c5ad91daeb52c47eed550c2](https://explorer-studio.genlayer.com/tx/0x003e75129584a8a044f86a50b79f1f34cc8e48de5c5ad91daeb52c47eed550c2)
- **Vault application:** [https://explorer-studio.genlayer.com/tx/0xb317a13f944b9165d5b851cd889050ea06bf39ed9fd0233513de7d95403c915c](https://explorer-studio.genlayer.com/tx/0xb317a13f944b9165d5b851cd889050ea06bf39ed9fd0233513de7d95403c915c)

## Steward requirement map

| Requirement | Local implementation | Current evidence |
| --- | --- | --- |
| Canonical duty binding | `contracts/slash_court.py` and `contracts/operator_bond_vault.py` | Current Court case-1 record and application digest match |
| Fetched citation metadata | `_authoritative_citation`, `_canonicalize_adjudication_result`, `_consensus_bound_result` | Current receipt and Vault application preserve evidence ID, party, type, domain, hash, and R1/R3 |
| Appealable ACCEPTED retention | `frontend/app/page.tsx`, `frontend/lib/slashcourt/client.ts`, `frontend/lib/slashcourt/transactions.ts` | Tests pass; live hash retained, but enabled-control capture remains a blocker |
| Finality-safe one-time penalty | `acknowledge_adjudication_finalized` and `apply_resolution` | Finalized child receipts and `APPLIED_FINALIZED`; `0.5 GEN` applied once |
| Wallet-free public review | Case hash route, Explorer links, advanced metadata section | Production case-1 and public screenshots |

## Evidence links

- [Pre-adjudication capture](evidence/pre-adjudication-case-1.png)
- [Finalized production capture](evidence/finalized-case-1.png)
- [Full deployment and case record](../deploy/current-demo.json)
- [Deployment provenance](../deploy/last-deployment.json)

## Final check

- Keep the YouTube field blank.
- Confirm exact portal taxonomy before submitting.
- Confirm current Court/Vault links open on StudioNet.
- Keep all predecessor cases labelled historical and all fixtures labelled synthetic.
- Do not claim an enabled ACCEPTED appeal control until it is captured live.
- Submit only after replacing the gate with **YES** following a bounded capture.
