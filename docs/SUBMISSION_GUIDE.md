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

993 of 1,000 characters:

> SlashCourt settles bonded-automation disputes. Every case is hash-bound to the vault duty, trigger, deadlines, expected action, parties, exposure, rulebook, and alleged rules. GenLayer validators fetch allowlisted evidence and preserve each citation's submitting party, content hash, type, domain, and rule metadata. A slash is invalid unless findings cite fetched evidence for every violated rule. Deterministic contracts map classifications to fixed, capped penalties; a separate vault applies them only after finality with case binding and replay protection. The console retains the adjudication transaction at ACCEPTED, exposes the appeal window, and tests recovery after reload. Upgraded contracts are live on StudioNet; four finalized outcomes remain verifiable on the labelled predecessor deployment. The repo includes 32 direct tests, focused frontend tests, integration scenarios, and a threat model. Fixtures and bonds are synthetic demo data, not native validator stake or real TVL.

## Demo video

Leave the optional YouTube URL blank unless a polished recording is available.

## How-to

Add these five steps in order.

### 1. Open the upgraded console

Visit [https://slash-court.vercel.app](https://slash-court.vercel.app). Confirm
the console identifies current Court `0xA463…15aB` and Vault `0x5eAb…E7E4`.
On a successful StudioNet read it shows rulebook v1 and a proven-empty current
case index. If the shared public RPC is limited, it labels unavailable or stale
fields and keeps every write disabled instead of presenting guessed state.

### 2. Verify canonical adjudication binding

Open the repository's `tests/direct/test_case_lifecycle.py` and
`tests/direct/test_adjudication.py`. Confirm the court snapshots and rechecks
the vault's canonical duty, trigger, deadlines, expected action, parties,
exposure, rulebook, case ID, and alleged rules before validator evaluation.

### 3. Verify attributable slash evidence

Review `tests/direct/test_adversarial_evidence.py` and
`tests/direct/test_resolution_application.py`. Confirm slash findings must cite
fetched evidence and that the court and vault preserve submitting party,
content hash, evidence type, domain, and relevant rule IDs.

### 4. Verify the appealable transaction flow

Review `tests/frontend/transactions.test.ts`, then open the console. The app
stores the exact adjudication hash at ACCEPTED, exposes Appeal before finality,
restores that transaction after reload, and tracks finalization in the
background.

### 5. Inspect live and historical proof

Review `deploy/last-deployment.json` for the upgraded pair and
`deploy/live-demo.json` for the explicitly labelled predecessor deployment.
The latter contains four real finalized StudioNet outcomes covering full,
partial, and zero-slash settlement; all incident evidence is labelled synthetic.
Open negligence at
[case-2](https://slash-court.vercel.app/#case/historical/case-2) and the excusable
outage at [case-3](https://slash-court.vercel.app/#case/historical/case-3).

## Expected verification outcome

443 of 500 characters:

> The steward should see the upgraded Court and Vault addresses, truthful read health, and explicit current-versus-historical labels. A successful read proves the current zero-case index and rulebook v1; an RPC failure never masquerades as empty state. Historical case-2 shows a finalized 0.5 GEN negligence penalty and case-3 an excusable outage with zero penalty. The 0.4/0.1 GEN beneficiary/safety split is accounting, not platform revenue.

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
3. [https://explorer-studio.genlayer.com/tx/0xf47ec484113e69f450877dfa633174ed857c88503a7b75fc63549fa892a9355f](https://explorer-studio.genlayer.com/tx/0xf47ec484113e69f450877dfa633174ed857c88503a7b75fc63549fa892a9355f)

## Final check

- Keep the YouTube field blank unless a polished recording exists.
- Confirm the selected tags match the portal's exact taxonomy.
- Open the website, repository, both upgraded contracts, and rulebook transaction.
- Confirm historical cases are described only as predecessor-deployment proof.
- Review the portal preview for truncation or broken links before resubmitting.
