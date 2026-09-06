# State machines

## Commitment

```text
OFFERED --beneficiary accepts--> ACTIVE
ACTIVE --duty report--> DUTY_REPORTED
ACTIVE/DUTY_REPORTED --court binds case--> DISPUTED
ACTIVE/DUTY_REPORTED --window expires, no case--> RELEASED
OFFERED --operator cancels--> CANCELLED
DISPUTED --finalized resolution--> RESOLVED
```

An offered commitment locks exposure at creation so the operator cannot promise
the same bond twice while the beneficiary considers it. A disputed commitment
cannot be released or withdrawn through the locked portion.

Opening a case before the commitment dispute deadline starts a bounded
24-hour response window when the remaining commitment window is shorter. This
preserves a meaningful operator response opportunity without allowing a late
claim.

## Case

```text
OPEN/AWAITING_RESPONSE --operator response + mark ready--> READY_FOR_ADJUDICATION
AWAITING_RESPONSE --response deadline expires + mark ready--> READY_FOR_ADJUDICATION
READY --adjudicate--> ADJUDICATING
ADJUDICATING --consensus result--> RESOLUTION_RECORDED
RESOLUTION_RECORDED --finalized vault message--> PENALTY_APPLIED
OPEN/AWAITING_RESPONSE/READY --authorized cancel--> CANCELLED
```

`network_status` is separate from the case state. An accepted result is
`ACCEPTED_PROVISIONAL`; only the finalized callback sets `FINALIZED` and
`APPLIED_FINALIZED`. Cancellation emits an authenticated, idempotent vault
unbind that restores the commitment's pre-dispute state without touching bond
accounting. A balance-free finalized vault child emitted by the original
adjudication sets the retry gate; the retry call cannot establish its own
authority.
