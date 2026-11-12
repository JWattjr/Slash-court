# Pipeline Court release review — 2026-11-12

The original Court and Vault source are unchanged. This review concerns only
the three new pipeline contracts and the new route.

## Findings corrected before deployment

1. Native bonds now activate only after each deposit's finalized callback.
   Pending deposits cannot activate a job, and late callbacks cannot activate
   after the frozen funding deadline. Any caller can recover a missed callback
   using the exact successful finalized deposit receipt.
2. The reserved rejected-value claim identifier cannot be compiled as a job.
3. Operator profiles retain at most 20 recent job identifiers. The independent
   replay map retains exact record membership for pricing. Charter creation is
   capped at 256 jobs, with paginated reads. Existing funded jobs still have
   their permissionless refund exits when capacity is exhausted.
4. OperatorRecord one-time binding rejects zero, duplicate, and self addresses.
5. The Court enforces both ends of the evidence/adjudication time window.
6. Older dashboard responses cannot replace a newer selection. Navigation no
   longer restarts every transaction monitor. Accepted appeal controls remain
   available while unrelated dashboard reads are pending. Financial reads fail
   closed, and finalized zero credits are displayed as zero rather than unknown.

## Native custody and finality review

Business-invalid payable deposits and filing calls retain sender-owned refund
credits instead of throwing after StudioNet may credit value. Total receipts
are counted even for invalid business calls. Claims reserve before emission,
can be triggered by a third party for the fixed recipient, and require full
unpaid backing. Duplicate pending/paid claims are rejected. Verified failed
claims can retry with a monotonic attempt. Rejected-value attempts retain the
nonce across later deposits to prevent replay of an earlier paid receipt.

verify_claim binds finalized parent execution, sender, exact method/arguments,
attempt, parent-child linkage, native transfer type, amount, fixed recipient,
and an explicit boolean native credit. Unknown credit never becomes paid or a
retry authorization. Only a finalized verification callback changes total_paid.
Recovery checks the exact successful finalized source action and current claim
hash; delayed callbacks cannot finalize another attempt. Court decisions must
finalize before settlement, and settlement must finalize before claims and
operator history. Deadline refunds require no model or evidence availability.

## Verification

- 217 direct tests pass, including every stored assessment leaf, independent
  re-fetch, forged ordering/snapshot, malformed model results, injection data,
  complete byte/body/status boundaries, missing/tampered evidence, min/max
  steps, authorization, deadline boundaries, refunds, exact native receipts,
  claims/retries, rejected-value nonce replay, callback recovery, and growth.
- GenVM AST and SDK validation pass for all three contracts with the requested
  immutable runner; Python SDK 0.18.0 and JS SDK 1.1.8 retained.
- Existing frontend tests plus the cumulative 0.1 GEN budget regression pass.
- Production webpack build and TypeScript pass. Local Turbopack crashed in its
  CSS worker, so browser checks use the supported webpack production build.
- Headless Playwright passes at 1440x960 and 390x844 against next start. Tests
  cover builder changes, ordered assessment, no overflow, claim control,
  retained accepted hash, appeal during held refresh, failed financial reads,
  and reload recovery. RPC fixtures are mocks and are not live proof.

Screenshots and machine-readable results are in pipeline-browser/. Native
credit, distributed consensus, deployed source identity, and Explorer records
are separate live release gates; none is established by these local tests.
