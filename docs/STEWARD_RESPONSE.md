# Steward response draft

Thank you. SlashCourt now runs a fresh mutually bound StudioNet Court/Vault
pair at `0x56e26ec256afe37199fe9845e039f5DEdd9e955a` and
`0xb1fD046CA7D92b84b16f66bdE676f442cA599Aa7`. The deployed contract source is
recorded at revision `cdaba784931d4cd4020bb66bebe795c22f47efa5`, and the
production console is deployed as `dpl_BfjU5sgnRCD7iBZYwxwHf4WKdiDw` from
frontend revision `6423dfb950468fd63f1c6f518fb3e85fb8fec82e`.

Every adjudication rebinds the Vault's canonical duty, trigger, duty/dispute
deadlines, expected action, parties, exposure, rulebook version, commitment
digest, and alleged rule IDs. The hardened consensus path canonicalizes each
fetched evidence citation and binds evidence ID, party, type, source domain,
content hash, and relevant rules. The fresh live case proves this with
`negligence-rc-01`, `CLAIMANT`, `slash-court.vercel.app`, the recorded SHA-256
hash, and R1/R3 metadata in both Court and Vault records.

The authorized synthetic case finalized as `NEGLIGENT_FAILURE` /
`PARTIAL_SLASH`. The adjudication is
`0x003e75129584a8a044f86a50b79f1f34cc8e48de5c5ad91daeb52c47eed550c2`; the
finality acknowledgement is
`0xde154a09b3a4648dfee7fecc2f3c3a3dd1af261d804ed0bd339557ef130f7899`; and the
Vault application is
`0xb317a13f944b9165d5b851cd889050ea06bf39ed9fd0233513de7d95403c915c`. All
are FINALIZED. The Vault applied one deterministic 0.5 GEN penalty: 0.4 GEN
beneficiary compensation and 0.1 GEN safety pool, leaving 1.5 GEN available
and zero locked exposure. No penalty was applied before finality and no
duplicate application was submitted.

A second authorized synthetic case provides the outage contrast. Case-2,
`demo-appeal-window-outage-rc-20260913`, finalized as `EXTERNAL_OUTAGE` /
`NO_SLASH` under supported exemption `R4`, with alleged rules R1/R4 and no
violated rules. Its canonical duty is
`scheduled-rc-appeal-window` / `outage-recovery-action-rc`, with a 0.5 GEN
locked exposure. The adjudication is
`0x27350a2b64cd0dce7c505678787c9e6d7085b064446e224ea03d591b8fa06d3b`; the
finality acknowledgement is
`0x75908f2e5f104fdb5e0cb6c36f876ba237f4c516d55cb74cccd7ebf4a5f58ebf`; and the
finalized Vault application is
`0x42493f6116efb397dd78202174df0ada3d2a7861e046492c4eda06f69cde7645`. The
application payload preserved both claimant and operator citations with their
party, type, domain, hash, and R1/R4 metadata. The Vault applied zero penalty,
zero award, and zero safety-pool allocation; aggregate accounting remains 1.5
GEN available and zero locked exposure. A subsequent direct Court read was
transiently unavailable, so the evidence record relies on the finalized
receipts and independent Vault read for this case.

The console retains the exact adjudication hash after ACCEPTED and releases
its busy state while finality continues in the background. In two bounded
runs, the eligibility/control capture was not completed before finality: the
first eligibility read was unavailable for case-1, and the browser connection
reset during the case-2 Appeal window. The appeal control was not captured
enabled. No appeal was clicked or submitted. Historical predecessor cases
remain clearly labelled synthetic and historical; they are not claimed as
cases of the fresh deployment.

Checks: 13 frontend tests, focused direct contract tests, full local direct and
GLSim integration suites, typecheck, lint, production build, GenVM lint, and
schema checks passed. The optional pyright check was unavailable because the
binary is not installed.

**Resubmit-ready: NO.** Exact blocker: one live screenshot/recording proving
an ACCEPTED adjudication with the appeal control enabled before finality. The
current record must not substitute a finalized transaction for that proof.
