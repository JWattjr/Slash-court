# GenLayer project submission

Paste the following copy into the project portal. The demo video is optional and
should be left blank unless a polished recording is available before the deadline.

## Identity

- **Logo:** `frontend/public/slashcourt-logo.png` (512 × 512 PNG, 17,981 bytes)
- **Project name:** SlashCourt
- **Primary tag:** Infrastructure (or the closest `Infrastructure & Tooling` option)
- **Tag 1:** Security
- **Tag 2:** Governance (use the closest exact option offered by the portal)

## One-liner

161 of 180 characters:

> Accountability for bonded automation: GenLayer validators assess disputed evidence under a shared rulebook, while deterministic contracts cap operator penalties.

## Description

Use this copy (under 1,000 characters):

> SlashCourt settles bonded-automation disputes. Each case is hash-bound to its vault duty, trigger, deadlines, expected action, parties, exposure, rulebook, and alleged rules. GenLayer validators fetch allowlisted evidence and preserve every citation's party, hash, type, domain, and rule metadata. Deterministic contracts map responsibility to fixed, capped penalties; the vault applies each result once, only after finality. The current StudioNet deployment proves the core contrast: case-4 is finalized negligence with a 0.5 GEN penalty, while case-5 is a finalized external outage with zero penalty. The console exposes case facts, evidence, response, consensus transaction, finality, and actual vault accounting without requiring a wallet. All incidents and bonds are explicitly synthetic demo data—not native validator stake, real incidents, or real TVL.

## Demo video

Leave the optional YouTube URL blank unless a polished recording is available.

## How-to

Add these five steps in order.

### 1. Open the upgraded console

Visit [https://slash-court.vercel.app](https://slash-court.vercel.app). Confirm
the console identifies current Court `0xA463…15aB` and Vault `0x5eAb…E7E4`.
On a successful StudioNet read it shows rulebook v1 and five indexed cases.
Cases 1–3 are cancelled setup attempts; cases 4–5 are the canonical finalized
demo pair. If the public RPC is limited, the UI labels unavailable or stale
fields and keeps writes disabled instead of presenting guessed state.

### 2. Compare negligence with an excusable outage

Open [case-4](https://slash-court.vercel.app/#case/current/case-4). Confirm
`NEGLIGENT_FAILURE`, `PARTIAL_SLASH`, violated rules R1/R3, and finalized
0.5 GEN accounting. Then open
[case-5](https://slash-court.vercel.app/#case/current/case-5) and confirm
`EXTERNAL_OUTAGE`, the supported R4 exemption, `NO_SLASH`, and zero penalty.

### 3. Trace evidence and finality

In each case file inspect claimant evidence E1, operator evidence E2, response,
classification, rule findings, adjudication transaction, finality, and Vault
application. The fixtures are labelled synthetic; the StudioNet consensus and
accounting transactions are real.

### 4. Verify actual Vault accounting

Case-4 routes 0.4 GEN to beneficiary compensation and 0.1 GEN to the safety
pool. Case-5 routes zero. The operator ends with 1.5 GEN available, zero locked
exposure, and two resolved commitments. The safety pool is protocol accounting,
not platform revenue.

### 5. Inspect source and predecessor proof

Review `deploy/last-deployment.json`, `deploy/current-demo.json`, the direct and
integration tests, and `docs/THREAT_MODEL.md`. The separately labelled
predecessor deployment remains available for misconduct and insufficient-
evidence examples; never describe its synthetic fixtures as real incidents.

## Expected verification outcome

Use this copy (under 500 characters):

> The steward should see rulebook v1, the current Court/Vault addresses, and five indexed cases. Case-4 must show finalized NEGLIGENT_FAILURE, a 0.5 GEN penalty, and a 0.4/0.1 beneficiary/safety split. Case-5 must show finalized EXTERNAL_OUTAGE, R4 exemption, and zero penalty. Operator accounting ends at 1.5 GEN available with zero locked exposure. Fixtures are synthetic; RPC failures never appear as empty state.

## Contract links

1. SlashCourt: [https://explorer-studio.genlayer.com/address/0xA4636860ea78c6E29179E7893e1bDa68133D15aB](https://explorer-studio.genlayer.com/address/0xA4636860ea78c6E29179E7893e1bDa68133D15aB)
2. OperatorBondVault: [https://explorer-studio.genlayer.com/address/0x5eAba41b27560505A45fD51a301f01f30832E7E4](https://explorer-studio.genlayer.com/address/0x5eAba41b27560505A45fD51a301f01f30832E7E4)

## Project links

- **Website:** [https://slash-court.vercel.app](https://slash-court.vercel.app)
- **GitHub:** [https://github.com/JWattjr/Slash-court](https://github.com/JWattjr/Slash-court)

## Evidence and supporting information

The required repository evidence is:

[https://github.com/JWattjr/Slash-court](https://github.com/JWattjr/Slash-court)

If the form accepts more links, add these in order:

1. [https://slash-court.vercel.app](https://slash-court.vercel.app)
2. [https://explorer-studio.genlayer.com/address/0xA4636860ea78c6E29179E7893e1bDa68133D15aB](https://explorer-studio.genlayer.com/address/0xA4636860ea78c6E29179E7893e1bDa68133D15aB)
3. [https://slash-court.vercel.app/#case/current/case-4](https://slash-court.vercel.app/#case/current/case-4)
4. [https://slash-court.vercel.app/#case/current/case-5](https://slash-court.vercel.app/#case/current/case-5)
5. [https://explorer-studio.genlayer.com/tx/0x4749fcc86e4e6bb07970ec3ff08f43ccb41bfebfa2531242ec51171c009844be](https://explorer-studio.genlayer.com/tx/0x4749fcc86e4e6bb07970ec3ff08f43ccb41bfebfa2531242ec51171c009844be)

## Final check

- Keep the YouTube field blank unless a polished recording exists.
- Confirm the selected tags match the portal's exact taxonomy.
- Open the website, repository, both upgraded contracts, and rulebook transaction.
- Confirm cases 1–3 are labelled cancelled setup attempts and historical cases
  are described only as predecessor-deployment proof.
- Keep the deployed-source limitation in `docs/DEMO_READINESS.md`; the latest
  prompt hardening is tested source code and is not represented as deployed.
- Review the portal preview for truncation or broken links before resubmitting.
