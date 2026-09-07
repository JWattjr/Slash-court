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

> SlashCourt settles disputes for bonded automation operators. Operators lock bounded exposure behind a service duty; beneficiaries can raise a claim and both sides can submit evidence. GenLayer validators independently fetch that evidence and evaluate responsibility under an immutable versioned rulebook, distinguishing provable misconduct, negligence, legitimate outages, and insufficient evidence. Deterministic contracts map each classification to a fixed, capped penalty instead of letting a model choose money. A separate vault applies resolutions only after finality, with exact case binding and replay protection. The live StudioNet deployment includes four finalized consensus cases covering every verdict and settlement path. The repo provides 28 direct tests, evidence cases, threat and economic models, deployment provenance, and a Next.js console. Evidence fixtures are clearly labelled synthetic; bonds are simulated application funds, not native validator stake or real TVL.

## Demo video

Leave the optional YouTube URL blank unless a polished recording is available.

## How-to

Add these five steps in order.

### 1. Open the live console

Visit [https://slash-court.vercel.app](https://slash-court.vercel.app). Wait for
the StudioNet snapshot to load. Confirm Court `0x576B…bf8e`, Vault
`0x95E4…625B`, rulebook v1, and the fixed 100% / 50% / 0% penalty schedule.

### 2. Inspect a bonded commitment

Open `demo-negligence-20260906`. Review its operator, beneficiary, accepted
terms, 1 GEN locked exposure, and rulebook version. This is application-level
operator accountability, not native protocol validator slashing.

### 3. Compare all verdicts

Open `case-1`, `case-2`, `case-3`, and `case-4`. Confirm
PROVABLE_MISCONDUCT, NEGLIGENT_FAILURE, EXTERNAL_OUTAGE, and
INSUFFICIENT_EVIDENCE. Compare the reasoning, rule references, and clearly
labelled synthetic evidence.

### 4. Trace finalized settlement

Confirm `case-1` applies FULL_SLASH (1 GEN), `case-2` applies PARTIAL_SLASH
(0.5 GEN), and `case-3` and `case-4` apply NO_SLASH. Every case must show
PENALTY_APPLIED, FINALIZED, and APPLIED_FINALIZED. The vault should show 2.5 GEN
remaining bond, 1.2 GEN beneficiary awards, 0.3 GEN safety pool, and zero
locked exposure.

### 5. Inspect the proof

Open the repository and review `docs/DEMO_SCRIPT.md`, `docs/THREAT_MODEL.md`,
`docs/ECONOMICS.md`, `deploy/last-deployment.json`, `deploy/live-demo.json`,
and `tests/`. The README distinguishes mocked local tests from live StudioNet
consensus and records the deployed-source provenance.

## Expected verification outcome

> The steward should see rulebook v1, the current Court and Vault addresses, and four finalized cases. case-1 applies a 1 GEN full slash; case-2 applies a 0.5 GEN partial slash; case-3 and case-4 apply zero. All show PENALTY_APPLIED, FINALIZED, and APPLIED_FINALIZED. The vault ends with 2.5 GEN operator bond, 1.2 GEN beneficiary awards, 0.3 GEN safety pool, and zero locked exposure. Evidence is clearly labelled synthetic.

## Contract links

1. SlashCourt: [https://explorer-studio.genlayer.com/address/0x576Bef923bbDd6ACb6aA7b5D183FF277abeFbf8e](https://explorer-studio.genlayer.com/address/0x576Bef923bbDd6ACb6aA7b5D183FF277abeFbf8e)
2. OperatorBondVault: [https://explorer-studio.genlayer.com/address/0x95E438A856c70a138824c37F937e0f436461625B](https://explorer-studio.genlayer.com/address/0x95E438A856c70a138824c37F937e0f436461625B)

## Project links

- **Website:** [https://slash-court.vercel.app](https://slash-court.vercel.app)
- **GitHub:** [https://github.com/JWattjr/Slash-court](https://github.com/JWattjr/Slash-court)

## Evidence and supporting information

The required repository evidence is:

[https://github.com/JWattjr/Slash-court](https://github.com/JWattjr/Slash-court)

If the form accepts more links, add these in order:

1. [https://slash-court.vercel.app](https://slash-court.vercel.app)
2. [https://explorer-studio.genlayer.com/address/0x576Bef923bbDd6ACb6aA7b5D183FF277abeFbf8e](https://explorer-studio.genlayer.com/address/0x576Bef923bbDd6ACb6aA7b5D183FF277abeFbf8e)
3. [https://explorer-studio.genlayer.com/tx/0x2fca7b681784f8281612b077dc2e2eb3c1dbdf8adc552d7f5014a1648480f19f](https://explorer-studio.genlayer.com/tx/0x2fca7b681784f8281612b077dc2e2eb3c1dbdf8adc552d7f5014a1648480f19f)

## Final check

- Keep the YouTube field blank unless a polished recording exists.
- Confirm the selected tags match the portal's exact taxonomy.
- Open the website, repository, both contracts, and adjudication transaction.
- Confirm the four case IDs and final vault totals still load.
- Review the portal preview for truncation or broken links before submitting.
