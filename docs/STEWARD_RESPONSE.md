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

The console retains the exact adjudication hash after ACCEPTED and releases
its busy state while finality continues in the background. In this bounded
run, the first appeal-eligibility read was unavailable and finality completed
before the recheck returned, so the appeal control was not captured enabled.
No appeal was clicked or submitted. Historical predecessor cases remain
clearly labelled synthetic and historical; they are not claimed as cases of
the fresh deployment.

Checks: 13 frontend tests, focused direct contract tests, full local direct and
GLSim integration suites, typecheck, lint, production build, GenVM lint, and
schema checks passed. The optional pyright check was unavailable because the
binary is not installed.

**Resubmit-ready: NO.** Exact blocker: one live screenshot/recording proving
an ACCEPTED adjudication with the appeal control enabled before finality.
