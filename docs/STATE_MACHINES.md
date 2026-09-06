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

## Case

```text
OPEN/AWAITING_RESPONSE --operator response + mark ready--> READY_FOR_ADJUDICATION
READY --adjudicate--> ADJUDICATING
ADJUDICATING --consensus result--> RESOLUTION_RECORDED
RESOLUTION_RECORDED --finalized vault message--> PENALTY_APPLIED
OPEN/AWAITING_RESPONSE/READY --authorized cancel--> CANCELLED
```

`network_status` is separate from the case state. An accepted result is
`ACCEPTED_PROVISIONAL`; only the finalized callback sets `FINALIZED` and
`APPLIED_FINALIZED`.
