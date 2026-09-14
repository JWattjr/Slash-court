# Steward response draft

Thank you. SlashCourt runs a fresh mutually bound StudioNet Court/Vault pair
at `0x56e26ec256afe37199fe9845e039f5DEdd9e955a` and
`0xb1fD046CA7D92b84b16f66bdE676f442cA599Aa7`. The deployed contract source is
recorded at revision `cdaba784931d4cd4020bb66bebe795c22f47efa5`. The verified
production console is deployment `dpl_FLyQqLt8AJkpJ5ecj7XMqpNAaPzU` from
frontend revision `c9e97bd6c1e50efa5eaf5b4b1ef74bfe4b97f376`; the browser root
marker matched that exact revision.

The appeal-workflow fix is therefore deployed, not merely a local candidate.
The production alias is [slash-court.vercel.app](https://slash-court.vercel.app).

Every adjudication rebinds the Vault's canonical duty, trigger, duty/dispute
deadlines, expected action, parties, exposure, rulebook version, commitment
digest, and alleged rule IDs. The hardened consensus path canonicalizes each
fetched evidence citation and binds evidence ID, party, type, source domain,
content hash, and relevant rules. The fresh live case proves this with
`negligence-rc-01`, `CLAIMANT`, `slash-court.vercel.app`, the recorded SHA-256
hash, and R1/R3 metadata in both Court and Vault records.

The first authorized synthetic case finalized as `NEGLIGENT_FAILURE` /
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

The final bounded synthetic capture attempt created case-5,
`demo-final-accepted-window-20260914`, bound to
`scheduled-final-accepted-window` / `maintenance-action-final-accepted-window`,
with `0.25 GEN` exposure and alleged rules R1/R3. The finalized adjudication
is
`0xf9a3bca4fd27533252a28cefed0f82aa1ae556b9c7bfcf509ce67b7129e906d2`,
`NEGLIGENT_FAILURE` / `PARTIAL_SLASH`, with a deterministic `0.125 GEN`
penalty. The finality acknowledgement is
`0x5531989db9a2d133a970e5f94d2f5046fab37471c3f5326bffd10eba9e863d3d`, and
the finality-triggered Vault application is
`0x23d99e6c3848f6bbd0d2e741100650b5c66f449265e32903e240dd453573c21f`.
Both child receipts are FINALIZED. The Vault read preserves the canonical
commitment digest, R1/R3, claimant citation `negligence-final-accepted-01`,
operator citation `operator-final-accepted-01`, their party/type/domain/hash
metadata, and applies `0.1 GEN` to the beneficiary plus `0.025 GEN` to the
safety pool exactly once. The operator read shows `1.0 GEN` available and zero
locked exposure.

The console retains the exact adjudication hash after ACCEPTED and releases
its busy state while finality continues in the background. Across five bounded
runs, the eligibility/control capture was not completed before finality: the
earlier runs are retained as historical attempts, and case-5's next usable
browser state was already FINALIZED. The appeal control was not captured
enabled. No appeal was clicked or submitted. Historical predecessor cases
remain clearly labelled synthetic and historical; they are not claimed as
cases of the fresh deployment.

Checks: 14 frontend workflow tests, 43 direct contract tests, typecheck, lint,
production build, `git diff --check`, GenVM lint, and schema checks passed. The
rendered frontend regression covers immediate busy-state release after
ACCEPTED, delayed eligibility recovery, exact hash targeting, unrelated
transactions, and terminal finality. The production deployment is READY and
its source marker was verified in the browser. No integration suite or
transaction-producing test was run as a test suite; the separately authorized
case-5 live workflow is recorded above. The optional pyright check was
unavailable because the binary is not installed.

**Resubmit-ready: NO.** Exact blocker: the live case-5 attempt reached
FINALIZED before an enabled ACCEPTED-window appeal control could be captured.
The deployed source, finality-safe penalty, canonical duty, citations, and
one-time accounting are verified, but the live appeal-window proof remains
missing. No appeal was clicked or submitted, and no Portal submission was made.
