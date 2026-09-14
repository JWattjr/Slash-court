# SlashCourt demo readiness and release verification

Verified 2026-09-14 against the fresh StudioNet deployment and the production
console at https://slash-court.vercel.app.

## Gate

**Resubmit-ready: NO.** The hardened Court/Vault pair and production console
are live, and the finalized negligence and external-outage paths are evidenced.
The remaining blocker is live ACCEPTED-window proof: three bounded authorized
synthetic attempts are recorded, including the final case-3 run, but no enabled
appeal control was captured before finality. No appeal was submitted and no
finalized screenshot is being presented as ACCEPTED proof.

## Current deployment

- Network: GenLayer Studio Network, chain ID `61999` (`0xf22f`)
- Court: `0x56e26ec256afe37199fe9845e039f5DEdd9e955a`
- Vault: `0xb1fD046CA7D92b84b16f66bdE676f442cA599Aa7`
- Rulebook: v1, hash `sha256:348b2debe2571df5f0bf482ec15b1c78299b17b79c05797d91fbbd572fb1233d`
- Approved evidence domain: `slash-court.vercel.app`
- Contract source revision: `cdaba784931d4cd4020bb66bebe795c22f47efa5`
- Frontend source revision: `6423dfb950468fd63f1c6f518fb3e85fb8fec82e`
- Vercel deployment: `dpl_BfjU5sgnRCD7iBZYwxwHf4WKdiDw`

The deployment record is [deploy/last-deployment.json](../deploy/last-deployment.json).
The full case and historical evidence index is
[deploy/current-demo.json](../deploy/current-demo.json).

The fresh Court and Vault were deployed as a new pair, bound reciprocally once,
configured with the rulebook and evidence domain, and read back on StudioNet.
The explorer cannot independently prove a Git commit-to-bytecode mapping here;
the exact source revision is recorded from the deployment run.

## Verified current case

The fresh deployment has three cases, `case-1`, `case-2`, and `case-3`; all are
synthetic release fixtures—not real incidents or real TVL.

- Commitment: `demo-negligence-rc-20260913`
- Classification: `NEGLIGENT_FAILURE`
- Outcome: `PARTIAL_SLASH`
- Violated/alleged rules: `R1`, `R3`
- Penalty: `0.5 GEN` (`5000` bps), calculated by the contract
- Status: `PENALTY_APPLIED`, protocol `FINALIZED`
- Canonical duty: Synthetic failover keeper duty for release verification
- Trigger: `scheduled-rc-negligence`
- Duty deadline: `2026-09-14T00:00:00Z`
- Dispute deadline: `2026-09-15T00:00:00Z`
- Expected action: `maintenance-action-rc`
- Commitment digest: `sha256:91904956c93defdf5560bf1e28015dc430242fa865bb9f53eb799dc26a3080cb`
- Evidence: `negligence-rc-01`, `PUBLIC_STATUS`, party `CLAIMANT`, domain
  `slash-court.vercel.app`, hash
  `sha256:9e9220900a2c6f44d32fddb8e1ac208646fca106f216537f7f1a7b0300873b97`,
  rules `R1/R3`

### Wallet journey and receipts

The authorized synthetic journey used the existing StudioNet test accounts:

| Action | Finalized transaction |
| --- | --- |
| Register operator | `0x1bfff91d042aa408b3ec066a7e9b5224c481e7313707574bd1a34aa6d8a884da` |
| Deposit 2 GEN bond | `0x53c950f3aa555e11cbb72df296fe60a5b42c40de1d0e4f199a88fcbc09826415` |
| Create commitment | `0x54dd695d5bdacc92a77a416684a639f805a581132a42444e18119752caa4cd45` |
| Accept commitment | `0x0fa604c96683651009d34d27d912d9c57d300c00841d8a0be5a2da1ce53fbf33` |
| Open case | `0x4fa88b8c842c519c7435cbed9b3b1c8cc8fcda138ebc67b708b3fc28ea4d861e` |
| Operator response | `0xfb1c6bc5f8773917eac3fa919d56416f2e91e3234f0577d58b1318100443996a` |
| Freeze evidence | `0xaa13813c0bd2bd282c363d487e3917b9f36be4a0b403514f420610fb2de019ce` |
| Adjudication | `0x003e75129584a8a044f86a50b79f1f34cc8e48de5c5ad91daeb52c47eed550c2` |
| Finality acknowledgement | `0xde154a09b3a4648dfee7fecc2f3c3a3dd1af261d804ed0bd339557ef130f7899` |
| Vault application | `0xb317a13f944b9165d5b851cd889050ea06bf39ed9fd0233513de7d95403c915c` |

All listed receipts are FINALIZED. The adjudication receipt contains the
finality-triggered Vault messages. The Vault application read is
`APPLIED_FINALIZED`, with citation metadata preserved:

- beneficiary award: `0.4 GEN`
- safety-pool allocation: `0.1 GEN`
- remaining available bond: `1.5 GEN`
- locked exposure: `0 GEN`
- total penalties: `0.5 GEN`
- application count: `1`

The final Court read reports `adjudication_finalized: true`,
`application_status: APPLIED_FINALIZED`, and `network_status: FINALIZED`.

## Verified current case 2: excusable external outage

`case-2` is the current deployment's contrasting no-slash example. It is a
synthetic fixture, not a real provider incident.

- Commitment: `demo-appeal-window-outage-rc-20260913`
- Classification: `EXTERNAL_OUTAGE`
- Outcome: `NO_SLASH`
- Supported exemption: `R4`
- Alleged rules: `R1`, `R4`; violated rules: none
- Penalty: `0 GEN` (`0` bps), calculated by the contract
- Canonical duty: Synthetic external-outage keeper duty for appeal-window verification
- Trigger: `scheduled-rc-appeal-window`
- Duty deadline: `2026-09-14T03:00:00Z`
- Dispute deadline: `2026-09-14T04:00:00Z`
- Expected action: `outage-recovery-action-rc`
- Commitment digest: `sha256:c349b7cd19bc3f5922a4af87309b3aa0da676db3d6d4168b94c7f7f06691ce8d`
- Evidence: `outage-appeal-rc-01` (`CLAIMANT`) and
  `outage-operator-rc-01` (`OPERATOR`), both `slash-court.vercel.app`, the
  recorded SHA-256 content hash, and rules `R1/R4`.
- Response: both configured providers were reported unavailable in the same
  regional incident; the operator reported no reasonable failover path.

### Case 2 receipts and accounting

| Action | Finalized transaction |
| --- | --- |
| Create commitment | `0x6a4f24be7593952a02703b6f463330d55c4835170b4a474f61d9a5d6056dabd4` |
| Accept commitment | `0x8cab20aeefb5efd0b20502504ca17d46dfcde093bcc490ef42226def7215385a` |
| Record duty | `0x3ef4826ce4e351b225cf30f2feb5f7f103cb59eb2e854f4343f047c260d5ea95` |
| Open case | `0xf9814481886b338c96072dfa242180bb3eaca8cc6fb7114ad11c735f613c03f7` |
| Operator response | `0xaac8ea69e09ddcb7d15eb72d3121578c2b23d14ff5894ad8bf464a079ed7691f` |
| Freeze evidence | `0x3f3e419f6fc0a010cd305b50c7809f0b0c8aa48c638e3b64ed4a49c8330f237e` |
| Adjudication | [`0x2735…6d3b`](https://explorer-studio.genlayer.com/tx/0x27350a2b64cd0dce7c505678787c9e6d7085b064446e224ea03d591b8fa06d3b) |
| Finality acknowledgement | [`0x7590…58ebf`](https://explorer-studio.genlayer.com/tx/0x75908f2e5f104fdb5e0cb6c36f876ba237f4c516d55cb74cccd7ebf4a5f58ebf) |
| Vault application | [`0x4249…7645`](https://explorer-studio.genlayer.com/tx/0x42493f6116efb397dd78202174df0ada3d2a7861e046492c4eda06f69cde7645) |

The adjudication, finality acknowledgement, and Vault application receipts
are FINALIZED. The finalized `apply_resolution` payload preserved both
citation parties and their R1/R4 metadata. The Vault read independently showed
`applied=true`, zero penalty, zero beneficiary award, zero safety-pool
allocation, and zero locked exposure. Aggregate fresh-pair accounting after
case-1 and case-2 is 1.5 GEN available, 0 GEN locked, 0.5 GEN total penalties,
and two applied resolution records. A post-finality direct Court read was
temporarily unavailable, so this record does not infer any additional Court
field from that failed RPC call.

## Verified current case 3: final bounded appeal-window attempt

`case-3` is the one final authorized synthetic run requested for live appeal
workflow capture. It is a release fixture, not a real incident.

- Commitment: `demo-appeal-window-negligence-rc-20260914`
- Classification: `NEGLIGENT_FAILURE`
- Outcome: `PARTIAL_SLASH`
- Violated/alleged rules: `R1`, `R3`
- Exposure: `0.5 GEN`; contract-determined penalty: `0.25 GEN` (`5000` bps)
- Status: `PENALTY_APPLIED`, protocol `FINALIZED`
- Canonical duty: Synthetic failover keeper duty for final appeal-window verification
- Trigger: `scheduled-rc-final-appeal-window`
- Duty deadline: `2026-09-15T02:00:00Z`
- Dispute deadline: `2026-09-16T02:00:00Z`
- Expected action: `maintenance-action-final-rc`
- Commitment digest: `sha256:8b8dcc20aeba05e38f0bc03fd841f0ead839ba7cb317fc774345f681e4daaf67`
- Evidence: claimant `negligence-appeal-rc-01` and operator
  `operator-appeal-rc-01`, both fetched from `slash-court.vercel.app`, with
  the recorded SHA-256 hash and R1/R3 metadata.
- Response: the primary provider failed; the operator checked the secondary
  path but did not complete the maintenance action before the deadline.

### Case 3 receipts and accounting

| Action | Finalized transaction |
| --- | --- |
| Create commitment | `0x0c52d7673a11664866ee665f5270fef717f2c94630566b6486f81572a6b39942` |
| Accept commitment | `0x18ecf6e0346079059d3d88036583e21ebbce855b53b480517488c8ca9d5f1f2e` |
| Record duty | `0x80c6b21722aa28026eb1da5b0b1477c24ede2fbecb75c90cce5cf7d027d7da58` |
| Open case | `0x78d0ed0b7018443cc90218f9233bf9850073bc83e1d607c29e7fecfb9902389c` |
| Operator response | `0x027acb1f2d16184826c05c65ecedd3edeeaff03f970caffcbc73564914c1652e` |
| Freeze evidence / rules | `0xc6788019124d679fc5ef8b134800fb9e93a5bafbcbd707ae67fe7d40d0f5c531` |
| Adjudication | [`0xd315…4203`](https://explorer-studio.genlayer.com/tx/0xd315d43889d5c0be676490504ce88c604fe72448058d948f8ef832a5e8e04203) |

The adjudication receipt is FINALIZED and the console reports successful
execution. The finality-triggered Vault application is shown as **Applied
once**, with `0.2 GEN` beneficiary compensation and `0.05 GEN` safety-pool
allocation. The public console does not expose the child application hash, so
none is inferred or presented as a link. A direct StudioNet
`get_vault_statistics` read independently returned `1.25 GEN` available,
`0 GEN` locked, `0.75 GEN` total penalties, and `0.15 GEN` safety-pool balance
with one operator. The case read independently returned
`network_status: FINALIZED`, `adjudication_finalized: true`, and
`application_status: APPLIED_FINALIZED`.

## Appeal-window evidence

The live console retained the exact adjudication hash for the final case-3
attempt, but the next bounded browser poll observed FINALIZED. The prior
case-1 and case-2 runs are also retained in the evidence index; case-2 reached
the external-outage Appeal window before the browser connection reset. The UI
release-after-ACCEPTED behavior remains covered by the workflow regression
test. No enabled appeal control was captured in any bounded run, and the
appeal button was never clicked.

This is recorded as `MISSED` in `deploy/current-demo.json`. Do not claim an
enabled ACCEPTED appeal control until a future bounded run captures it.

## Public captures

- [Pre-adjudication case capture](evidence/pre-adjudication-case-1.png): wallet-free case facts, canonical duty, evidence, and enabled Run consensus control.
- [Finalized case capture](evidence/finalized-case-1.png): production console showing the finalized classification, penalty, citations, and actual Vault split.
- [Finalized case-3 capture](evidence/case-3-finalized-no-appeal-window.png): the final bounded synthetic case showing finality, one-time Vault application, citation metadata, and accounting. It is not ACCEPTED-window proof.

The captures are supporting artifacts, not substitutes for chain reads. No
ACCEPTED-window capture or recording is available for any current case; leave
the portal video field blank.

## Historical examples

The fresh deployment contains the current negligence and external-outage
classifications. The console labels the remaining classifications as
historical predecessor proof:

- predecessor `0x576Bef923bbDd6ACb6aA7b5D183FF277abeFbf8e`: provable misconduct
  and insufficient evidence, plus an older external-outage contrast, all
  synthetic fixtures with real finalized StudioNet transactions;
- predecessor current pair `0xA4636860ea78c6E29179E7893e1bDa68133D15aB`: an older
  negligence/outage pair, also synthetic and not current deployment state.

These historical cases must not be described as cases belonging to the fresh
Court.

## Checks completed

- 13 frontend workflow tests passed, including the rendered appeal-action
  regression, exact hash targeting, reload recovery, fail-closed reads, and
  terminal ineligibility.
- Typecheck, lint, production build, and `git diff --check` passed.
- Focused direct contract tests: 22 passed. The full local direct suite had 43
  passes; the 8-test GLSim integration suite passed with the documented Windows
  compatibility wrapper.
- GenVM lint and contract schema checks passed. The optional GenVM pyright
  check remains unavailable because `pyright` is not installed.
- Current on-chain reads prove no penalty before finality for this case because
  the application was triggered on `finalized`; direct tests prove replay
  rejection and finality gating. No duplicate application attempt was sent in
  production.
- No appeal was submitted and no Portal submission was made.

## Requirement status

| Steward requirement | Status |
| --- | --- |
| Bind canonical duty, trigger, deadlines, expected action, parties, exposure, rulebook, digest, and alleged rules | Satisfied in fresh Court/Vault source and current finalized case read |
| Bind fetched-evidence citations with party and rule metadata | Satisfied in fresh source, finalized receipt payloads, and Vault application reads for both current cases |
| Retain an ACCEPTED adjudication and expose an appeal control before finality | UI retention and background-finality fix deployed; live enabled-control capture remains unsatisfied |
| Apply deterministic penalty only after finality and only once | Satisfied by current finalized receipts, `APPLIED_FINALIZED` read, accounting, and direct/integration tests |
| Make public review wallet-free and easy to inspect | Satisfied; current case hash route, Explorer links, advanced metadata, and screenshots are public |

## Next exact action

The exact remaining blocker is a live screenshot or recording of an ACCEPTED
adjudication with the enabled appeal control before finality. No further
on-chain run is authorized by this record; if the portal requires that proof,
obtain fresh authorization before attempting another synthetic case. Until
then, submit only with the gate marked NO.
