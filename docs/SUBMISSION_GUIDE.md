# GenLayer project submission — SlashCourt

Draft in the requested portal format. Replace every bracketed placeholder before submitting. Public hosting, repository availability, explorer links, and live verdicts have not been verified for this guide. Do not copy Covenant Sentinel's links or results into this submission.

## Identity

- **Logo:** [Upload a SlashCourt 512 × 512 PNG under 2 MB. Only a favicon.svg was found in frontend/public; a submission PNG is still needed.]
- **Project name:** SlashCourt
- **Primary tag:** Infrastructure (or the closest Infrastructure & Tooling option)
- **Tag 1:** Security
- **Tag 2:** Governance (or the closest applicable option actually offered)

## One-liner

161 of 180 characters:

> Accountability for bonded automation: GenLayer validators assess disputed evidence under a shared rulebook, while deterministic contracts cap operator penalties.

## Description

871 of 1,000 characters:

> SlashCourt is an application-layer dispute-resolution prototype for bonded automation operators. Operators commit bounded exposure to a duty; beneficiaries can raise a claim and operators can respond with evidence. GenLayer validators evaluate responsibility under a versioned rulebook, distinguishing provable misconduct, negligence, legitimate outages, and insufficient evidence. Deterministic contract logic maps classifications to capped penalties instead of letting the model choose an amount. A separate bond vault is designed to apply resolutions through finalized messages. The project includes intelligent contracts, a Next.js operator console, direct and simulated integration tests, and architecture, economics, and threat-model documentation. It is a StudioNet prototype, not GenLayer's native validator-slashing system or a production-ready security service.

## Demo video

Leave the optional YouTube URL blank unless a polished recording is available before the deadline.

## How-to

Add these five steps in order after preparing and verifying the demo. The bracketed URLs and case IDs are required replacements, not existing live artifacts.

### 1. Open the live console

Visit https://slash-court.vercel.app. Wait for the StudioNet snapshot to load. Confirm the court and bond-vault addresses match the current deployment record and the published versioned rulebook is visible.

### 2. Inspect a bonded commitment

Open [VERIFIED DEMO COMMITMENT ID]. Review the operator, beneficiary, duty, accepted terms, locked exposure, and rulebook version. This is application-level operator accountability, not native protocol validator slashing.

### 3. Compare all verdicts

Open [MISCONDUCT CASE ID], [NEGLIGENCE CASE ID], [OUTAGE CASE ID], and [INSUFFICIENT-EVIDENCE CASE ID]. Compare each recorded classification, reasoning, rule references, and submitted evidence. Demo evidence must be explicitly labelled synthetic.

### 4. Trace the settlement

For the finalized misconduct and negligence cases, compare the fixed penalty with the commitment's exposure and inspect the vault application record. Confirm the outage and insufficient-evidence cases produce no penalty. Distinguish provisional adjudication from finalized vault application.

### 5. Inspect the proof

Open https://github.com/JWattjr/Slash-court. Review docs/DEMO_SCRIPT.md, docs/THREAT_MODEL.md, docs/ECONOMICS.md, deploy/last-deployment.json, and tests/. Distinguish mocked local tests from transactions executed with real StudioNet evaluation.

## Expected verification outcome

Under 500 characters; use only after the four live cases are verified:

> The steward should see the current court and vault addresses, a versioned rulebook, and four finalized demo cases. Misconduct and negligence should apply their fixed penalties within committed exposure; legitimate outage and insufficient evidence should apply zero penalty. Vault records and operator balances should agree, and retrying an applied resolution should not deduct funds twice. Synthetic evidence must be clearly labelled.

## Contract links

These addresses are copied from the existing local deployment record, not freshly verified on the explorer. Replace them if contract fixes require redeployment; confirm the full addresses against deployment receipts before submission.

1. SlashCourt: https://explorer-studio.genlayer.com/address/0x8F842611d83C760675bfBA4eBA50e736bf64ae90
2. OperatorBondVault: https://explorer-studio.genlayer.com/address/0xAe26BE38b58CaFf8d9297E124C0Bd7d5F0d8B92D

## Project links

- **Website:** https://slash-court.vercel.app
- **GitHub:** https://github.com/JWattjr/Slash-court

## Evidence and supporting information

The required repository evidence is:

https://github.com/JWattjr/Slash-court

If the form accepts more links, add these in order:

1. https://slash-court.vercel.app
2. [VERIFIED CURRENT COURT EXPLORER URL]
3. [VERIFIED FINALIZED ADJUDICATION OR VAULT-APPLICATION TRANSACTION URL]

Prefer a transaction demonstrating the claimed settlement behavior over a deployment-only transaction. Do not use a synthetic or guessed hash.

## Final check

- Resolve the critical findings in docs/SOL_FIX_GUIDE.md before presenting settlement safety as established.
- Create the required logo PNG and verify its dimensions and file size.
- Publish and open the website and repository; confirm no secrets are included.
- Replace placeholder evidence domains with reachable, labelled fixtures and verify all four live outcomes. Do not claim they already exist.
- Populate every case ID and URL above from actual verified results.
- Verify both deployed addresses and source provenance; use new addresses after any redeployment.
- Keep the YouTube field blank unless a polished recording exists.
- Confirm tags against the portal's actual taxonomy.
- Open the website, repository, and both contract links before submitting.
- Review the portal preview for truncation, broken links, and leftover placeholders.
- If live verification is incomplete at the deadline, describe the submission as a prototype and remove unsupported live-demo instructions or claims instead of implying completion.
