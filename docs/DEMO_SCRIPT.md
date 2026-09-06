# Three-minute demo script

## 0:00–0:30 — problem

“A log can prove that an automation keeper missed a task. It cannot tell us
whether the keeper was negligent or whether a widespread provider outage made
the task impossible. SlashCourt turns that responsibility question into an
appealable, evidence-based application-layer settlement.”

## 0:30–1:00 — commitment

Show the operator registry: 100 GEN bonded, a 20 GEN keeper commitment, one
beneficiary, a duty deadline, a failover obligation, and the exact maximum
penalty. Have the beneficiary accept. Point out that the 20 GEN exposure is
locked before the duty begins.

## 1:00–1:50 — negligence

Open a case with a public incident record: primary provider failed, secondary
provider remained available, and no credible failover attempt was supplied.
Show the operator response window, evidence freeze, the R3 finding, and the
`NEGLIGENT_FAILURE -> PARTIAL_SLASH` mapping. Submit adjudication and show the
transaction timeline: EVM submitted, consensus pending, accepted/provisional,
appeal window, finalized, resolution message queued, then applied. The 20 GEN
exposure becomes a 10 GEN penalty; the operator's other 80 GEN is untouched.

## 1:50–2:20 — external outage

Use the outage preset with multiple public sources and no available
mitigation. The model can select `EXTERNAL_OUTAGE`, but cannot supply a number.
The deterministic mapping returns `NO_SLASH`; the entire 20 GEN exposure is
released without a beneficiary award.

## 2:20–2:45 — misconduct and uncertainty

Show the adversarial evidence fixture that says “ignore the rulebook.” It is
delimited as data. A fabricated or contradictory signed report can produce
`PROVABLE_MISCONDUCT` and a full commitment-level slash. An ambiguous record
produces `INSUFFICIENT_EVIDENCE` and zero slash.

## 2:45–3:00 — close

“SlashCourt converts application-specific service bonds from rigid uptime
counters into evidence-based, appealable commitments. Logs prove failure;
SlashCourt determines responsibility.”
