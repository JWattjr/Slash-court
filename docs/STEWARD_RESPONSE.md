# Steward response draft

Thank you. SlashCourt runs a fresh mutually bound StudioNet Court/Vault pair
at `0x56e26ec256afe37199fe9845e039f5DEdd9e955a` and
`0xb1fD046CA7D92b84b16f66bdE676f442cA599Aa7`. The deployed contract source is
recorded at revision `cdaba784931d4cd4020bb66bebe795c22f47efa5`. The last
verified production console is deployment `dpl_BfjU5sgnRCD7iBZYwxwHf4WKdiDw`
from frontend revision `6423dfb950468fd63f1c6f518fb3e85fb8fec82e`.

The appeal-workflow candidate is pushed at frontend revision
`3aea5dbd1f42a473b9b8aa3c5f699ead579b8f0f`, but its Vercel deployment is not
claimed yet: the current checkout is not linked to the existing SlashCourt
Vercel project. The candidate exposes a `data-source-revision` marker populated
from Vercel's Git commit SHA for post-deployment verification.

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

A final bounded authorized synthetic run was then opened specifically to test
the ACCEPTED-window workflow. Case-3,
`demo-appeal-window-negligence-rc-20260914`, is bound to the canonical duty
`scheduled-rc-final-appeal-window` / `maintenance-action-final-rc`, exposure
`0.5 GEN`, dispute deadline `2026-09-16T02:00:00Z`, and alleged rules R1/R3.
The fetched claimant and operator citations preserve IDs
`negligence-appeal-rc-01` and `operator-appeal-rc-01`, their parties, the
`slash-court.vercel.app` domain, the SHA-256 content hash, and rule metadata.
The adjudication finalized at
`0xd315d43889d5c0be676490504ce88c604fe72448058d948f8ef832a5e8e04203` as
`NEGLIGENT_FAILURE` / `PARTIAL_SLASH`. The production console shows the Vault
application as **Applied once**, with `0.2 GEN` beneficiary compensation and
`0.05 GEN` safety-pool allocation. The aggregate console read after this case
shows `1.25 GEN` available, `0 GEN` locked exposure, and `0.75 GEN` penalties.
The public UI does not expose the child application hash, so no child hash is
invented or presented.

An additional authorized capture attempt created case-4,
`demo-appeal-capture-negligence-20260914`, bound to duty
`scheduled-accepted-capture` / `maintenance-action-accepted-capture`, exposure
`0.25 GEN`, and alleged rules R1/R3. Both fetched citations preserve their
claimant/operator party, evidence type, domain, hash, and rule metadata. It
finalized at
`0x492d5254686ae2155465ac180b794f889ec5b17570ef1c4192df028b69fb1ede`
as `NEGLIGENT_FAILURE` / `PARTIAL_SLASH`. The Court read reports
`APPLIED_FINALIZED`; the console shows **Applied once**, `0.1 GEN` beneficiary
compensation, and `0.025 GEN` safety-pool allocation. The direct Vault read
after case-4 shows `1.125 GEN` available, zero locked exposure, `0.875 GEN`
total penalties, and `0.175 GEN` in the safety pool across four applications.
No child application hash is exposed, so none is claimed.

The console retains the exact adjudication hash after ACCEPTED and releases
its busy state while finality continues in the background. Across four
bounded runs, the eligibility/control capture was not completed before
finality: the first eligibility read was unavailable for case-1, the browser
connection reset during the case-2 Appeal window, and the next poll for the
case-3 run observed FINALIZED. For case-4, the real MetaMask confirmation was
inspected and explicitly confirmed, but the console was already FINALIZED
when control returned. The appeal control was not captured enabled. No appeal
was clicked or submitted. Historical predecessor cases
remain clearly labelled synthetic and historical; they are not claimed as
cases of the fresh deployment.

Checks: 14 frontend workflow tests, 43 direct contract tests, typecheck, lint,
production build, `git diff --check`, GenVM lint, and schema checks passed. The
rendered frontend regression covers immediate busy-state release after
ACCEPTED, delayed eligibility recovery, exact hash targeting, unrelated
transactions, and terminal finality. No integration suite or
transaction-producing test was run in this final pass. The optional pyright
check was unavailable because the binary is not installed.

**Resubmit-ready: NO.** Exact blockers: verify the candidate Vercel deployment
at revision `3aea5dbd1f42a473b9b8aa3c5f699ead579b8f0f`, then capture one
bounded live ACCEPTED adjudication with the appeal control enabled before
finality. The four finalized case attempts and their screenshots are not
substitutes for that proof. No appeal was clicked or submitted, and no Portal
submission was made.
