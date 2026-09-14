# SlashCourt submission guide

## Submission gate

**Do not submit yet: RESUBMIT-READY = NO.** The current Court/Vault pair and
the last verified frontend release are deployed, with finalized negligence and
external-outage/no-slash proofs plus the bounded case-3 and case-4 attempts.
The appeal-monitor fixes are pushed in candidate revision
`3aea5dbd1f42a473b9b8aa3c5f699ead579b8f0f`, but the Vercel production update
is not independently verified from this checkout. Four bounded ACCEPTED-window
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

> SlashCourt settles bonded-automation disputes. Each case is hash-bound to its vault duty, trigger, deadlines, expected action, parties, exposure, rulebook, and alleged rules. GenLayer validators fetch allowlisted evidence and preserve every citation's party, hash, type, domain, and rule metadata. Deterministic contracts map responsibility to fixed, capped penalties; the vault applies each result once, only after finality. The current StudioNet deployment proves three finalized synthetic negligence cases plus a finalized R4 external-outage case with no slash. Historical predecessor deployments provide clearly labelled misconduct and insufficient-evidence contrasts. The console exposes case facts, evidence, response, adjudication transaction, finality, and actual Vault accounting wallet-free. This is demo bond accounting, not real incidents, real TVL, or native validator stake.

## Demo video

Leave blank unless a polished recording is available.

## How-to

### 1. Open the upgraded console

Visit [https://slash-court.vercel.app](https://slash-court.vercel.app). Confirm
the header identifies Court `0x56e2…e955a` and Vault `0xb1fD…9Aa7`, StudioNet
chain `61999`, rulebook v1, and the current deployment status. The current
release is expected to contain four synthetic current cases. After the
candidate Vercel deployment, inspect the root element's `data-source-revision`
and confirm it equals `3aea5dbd1f42a473b9b8aa3c5f699ead579b8f0f`. If an RPC read
fails, the UI labels it unavailable or partial and keeps writes locked.

### 2. Open the current cases

Open [case-1](https://slash-court.vercel.app/#case/current/case-1),
[case-2](https://slash-court.vercel.app/#case/current/case-2), and
[case-3](https://slash-court.vercel.app/#case/current/case-3), and
[case-4](https://slash-court.vercel.app/#case/current/case-4). Confirm each
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
four current cases: three negligence proofs and an excusable external outage.

## Expected verification outcome

> The steward should see fresh Court `0x56e26ec256afe37199fe9845e039f5DEdd9e955a`, Vault `0xb1fD046CA7D92b84b16f66bdE676f442cA599Aa7`, rulebook v1, and four current synthetic cases. Case-1 shows a finalized 0.5 GEN negligence penalty; case-2 shows finalized R4 external outage with no slash; case-3 shows a finalized 0.25 GEN negligence penalty; and case-4 shows a finalized 0.125 GEN negligence penalty with a 0.1/0.025 beneficiary/safety split. Aggregate bond accounting is 1.125 GEN available, zero locked, 0.875 GEN penalties, and 0.175 GEN in the safety pool. Historical cases are labelled historical. The ACCEPTED appeal-window screenshot remains unverified.

## Contract links

1. Court: [https://explorer-studio.genlayer.com/address/0x56e26ec256afe37199fe9845e039f5DEdd9e955a](https://explorer-studio.genlayer.com/address/0x56e26ec256afe37199fe9845e039f5DEdd9e955a)
2. Vault: [https://explorer-studio.genlayer.com/address/0xb1fD046CA7D92b84b16f66bdE676f442cA599Aa7](https://explorer-studio.genlayer.com/address/0xb1fD046CA7D92b84b16f66bdE676f442cA599Aa7)

## Project links

- **Website:** [https://slash-court.vercel.app](https://slash-court.vercel.app)
- **GitHub:** [https://github.com/JWattjr/Slash-court](https://github.com/JWattjr/Slash-court)
- **Current case:** [https://slash-court.vercel.app/#case/current/case-1](https://slash-court.vercel.app/#case/current/case-1)
- **Current outage contrast:** [https://slash-court.vercel.app/#case/current/case-2](https://slash-court.vercel.app/#case/current/case-2)
- **Additional bounded case:** [https://slash-court.vercel.app/#case/current/case-4](https://slash-court.vercel.app/#case/current/case-4)
- **Case-4 adjudication:** [https://explorer-studio.genlayer.com/tx/0x492d5254686ae2155465ac180b794f889ec5b17570ef1c4192df028b69fb1ede](https://explorer-studio.genlayer.com/tx/0x492d5254686ae2155465ac180b794f889ec5b17570ef1c4192df028b69fb1ede)
- **Adjudication:** [https://explorer-studio.genlayer.com/tx/0x003e75129584a8a044f86a50b79f1f34cc8e48de5c5ad91daeb52c47eed550c2](https://explorer-studio.genlayer.com/tx/0x003e75129584a8a044f86a50b79f1f34cc8e48de5c5ad91daeb52c47eed550c2)
- **Vault application:** [https://explorer-studio.genlayer.com/tx/0xb317a13f944b9165d5b851cd889050ea06bf39ed9fd0233513de7d95403c915c](https://explorer-studio.genlayer.com/tx/0xb317a13f944b9165d5b851cd889050ea06bf39ed9fd0233513de7d95403c915c)
- **Outage adjudication:** [https://explorer-studio.genlayer.com/tx/0x27350a2b64cd0dce7c505678787c9e6d7085b064446e224ea03d591b8fa06d3b](https://explorer-studio.genlayer.com/tx/0x27350a2b64cd0dce7c505678787c9e6d7085b064446e224ea03d591b8fa06d3b)
- **Outage Vault application:** [https://explorer-studio.genlayer.com/tx/0x42493f6116efb397dd78202174df0ada3d2a7861e046492c4eda06f69cde7645](https://explorer-studio.genlayer.com/tx/0x42493f6116efb397dd78202174df0ada3d2a7861e046492c4eda06f69cde7645)

## Steward requirement map

| Requirement | Local implementation | Current evidence |
| --- | --- | --- |
| Canonical duty binding | `contracts/slash_court.py` and `contracts/operator_bond_vault.py` | Current Court/Vault reads for case-1 through case-4 carry the commitment digest and duty-bound application |
| Fetched citation metadata | `_authoritative_citation`, `_canonicalize_adjudication_result`, `_consensus_bound_result` | Current finalized records preserve evidence ID, party, type, domain, hash, and rule metadata; case-4 independently proves both parties |
| Appealable ACCEPTED retention | `frontend/app/page.tsx`, `frontend/lib/slashcourt/client.ts`, `frontend/lib/slashcourt/transactions.ts` | Candidate tests pass with immediate hash retention/background monitoring; Vercel deployment and live enabled-control capture remain blockers |
| Finality-safe one-time penalty | `acknowledge_adjudication_finalized` and `apply_resolution` | Four finalized applications; case-4 reads `APPLIED_FINALIZED` and aggregate penalties are 0.875 GEN |
| Wallet-free public review | Case hash route, Explorer links, advanced metadata section | Production case-1 through case-4 links and public captures |

## Evidence links

- [Pre-adjudication capture](evidence/pre-adjudication-case-1.png)
- [Finalized production capture](evidence/finalized-case-1.png)
- [Finalized case-3 capture](evidence/case-3-finalized-no-appeal-window.png) (not ACCEPTED-window proof)
- [Finalized case-4 capture](evidence/case-4-finalized-no-appeal-window.png) (not ACCEPTED-window proof)
- No ACCEPTED-window capture or recording is available; do not present a finalized view as that proof.
- [Full deployment and case record](../deploy/current-demo.json)
- [Deployment provenance](../deploy/last-deployment.json)
- [Candidate source revision](https://github.com/JWattjr/Slash-court/commit/3aea5dbd1f42a473b9b8aa3c5f699ead579b8f0f)

## Final check

- Keep the YouTube field blank.
- Confirm exact portal taxonomy before submitting.
- Confirm current Court/Vault links open on StudioNet and the candidate
  `data-source-revision` is visible in the production DOM.
- Keep all predecessor cases labelled historical and all fixtures labelled synthetic.
- Do not claim an enabled ACCEPTED appeal control; it was not captured in any of the four bounded runs.
- Submit only after replacing the gate with **YES** following a verified
  candidate deployment and one bounded live ACCEPTED-window capture.
