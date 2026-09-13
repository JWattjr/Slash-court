# GenLayer project submission

Paste the following copy into the project portal. The demo video is optional and
should be left blank unless a polished recording is available before the deadline.

## Resubmission gate

**Resubmit-ready: NO. Do not paste the staged copy yet.** The citation-consensus
and appeal-state repairs exist only in the local source. Before resubmitting,
deploy a new mutually bound Court/Vault pair, deploy the updated frontend,
seed and finalize the negligence/outage proof on that pair, and capture one
adjudication while it is ACCEPTED with the appeal control enabled. Replace all
addresses, case URLs, transaction links, and accounting below with the new
verified values. The existing StudioNet pair remains honest predecessor proof;
it is not proof that the local repairs are live.

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
6. [https://explorer-studio.genlayer.com/tx/0x03b193ad13f8bee3f4dc855a5070c7a09c28f50d26c16d3ff4954b47cb5ff366](https://explorer-studio.genlayer.com/tx/0x03b193ad13f8bee3f4dc855a5070c7a09c28f50d26c16d3ff4954b47cb5ff366)

## Steward requirement map

| Steward requirement | Local source | Named tests | Production evidence |
| --- | --- | --- | --- |
| Bind duty, trigger, deadlines, expected action, parties, exposure, rulebook, digest, and alleged rules | `contracts/slash_court.py`: `_canonical_commitment_context`, `_require_adjudication_binding`, `_deterministic_facts`; `contracts/operator_bond_vault.py`: `_commitment_digest`, `apply_resolution` | `test_court_preserves_every_canonical_vault_duty_field`; `test_deterministic_facts_are_bounded_and_do_not_make_a_judgment`; `test_resolution_requires_canonical_duty_digest_and_fetched_citation` | Verified on the existing Court/Vault pair and current finalized case-4/case-5. Preserve those records as predecessor proof after redeployment. |
| Bind slash citations to successfully fetched evidence with party and rule metadata | `contracts/slash_court.py`: `_authoritative_citation`, `_canonicalize_adjudication_result`, `_consensus_bound_result`, `_evaluate_with_consensus` | `test_validator_rejects_each_forged_citation_property`; `test_consensus_binds_evidence_references_but_not_explanatory_prose`; `test_slash_rejects_missing_citation_and_malformed_or_oversized_results`; `test_canonical_result_sorts_and_deduplicates_evidence_references`; `test_prompt_supports_non_e1_evidence_ids` | **Not deployed.** Existing case citations were produced by the leader path but were not fully bound in validator comparison. New Court/Vault receipt and finalized slash case required. |
| Retain and target an appealable adjudication before finality | `frontend/lib/slashcourt/transactions.ts`, `frontend/lib/slashcourt/client.ts`, `frontend/app/page.tsx` | `an accepted adjudication remains the appeal target after an unrelated transaction`; `appealable tracking returns after ACCEPTED and retains FINALIZED later`; `appeal submission fails closed when eligibility cannot be read`; `appeal submission rechecks eligibility immediately before sending` | **Not deployed and not live-captured.** Need accepted hash plus console screenshot/recording showing the enabled appeal control. An actual appeal is optional and requires separate authorization. |
| Apply deterministic penalty once and only after adjudication finality | `contracts/slash_court.py`: finalized message emission; `contracts/operator_bond_vault.py`: `acknowledge_adjudication_finalized`, `apply_resolution` | `test_full_resolution_is_capped_and_allocated`; `test_unauthorized_or_arbitrary_penalty_is_rejected`; `test_resolution_application_and_callback_are_finalized_and_replay_safe` (passed locally with five-validator GLSim) | Existing finalized case-4 applied 0.5 GEN once; case-5 applied zero. Local integration also proves the finality-gated retry and one-time application path; fresh production evidence still requires the authorized redeployment below. |
| Provide valid case-5 adjudication proof | `deploy/current-demo.json`, `frontend/app/page.tsx` | Frontend type/build checks validate use of the full identifier | Full finalized receipt: `0x03b193ad13f8bee3f4dc855a5070c7a09c28f50d26c16d3ff4954b47cb5ff366`, verified via Studio explorer and `genlayer receipt`. |

## Minimal separately authorized live verification

1. Deploy a fresh Vault, then Court, and complete their one-time reciprocal
   binding; publish the rulebook and approved evidence domains. Record source
   commit/digest and every configuration receipt.
2. Update frontend production environment variables and deploy the console.
   Verify the displayed addresses, rulebook, bindings, and public wallet-free
   reads against the explorer.
3. Run a new synthetic negligence case. At ACCEPTED, record the exact
   adjudication hash and capture the enabled appeal control before finality.
4. Do not submit an appeal unless separately authorized. If an appeal is needed
   as evidence, authorize that exact hash and bond as a separate action.
5. After finality, capture the canonical duty, attributed citations, outcome,
   adjudication receipt, one-time Vault application, and resulting balances.
6. Run the excusable-outage contrast, update every placeholder/current link in
   this guide, then and only then resubmit.

## Final check

- Keep the YouTube field blank unless a polished recording exists.
- Confirm the selected tags match the portal's exact taxonomy.
- Open the website, repository, both upgraded contracts, and rulebook transaction.
- Confirm cases 1–3 are labelled cancelled setup attempts and historical cases
  are described only as predecessor-deployment proof.
- Keep the deployed-source limitation in `docs/DEMO_READINESS.md`; the latest
  prompt, citation-consensus, and appeal hardening are tested source code and
  are not represented as deployed.
- Do not resubmit while the gate at the top of this file remains `NO`.
- Review the portal preview for truncation or broken links before resubmitting.
