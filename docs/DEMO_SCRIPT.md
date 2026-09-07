# Three-minute demo script

## 0:00–0:30 — problem

“A log can prove that an automation keeper missed a task. It cannot tell us
whether the keeper was negligent or whether a widespread provider outage made
the task impossible. SlashCourt turns that responsibility question into an
appealable, evidence-based application-layer settlement.”

## 0:30–1:00 — commitment

Show the operator registry: 4 GEN deposited across four 1 GEN commitments, one
beneficiary, duty deadlines, failover obligations, and exact maximum penalties.
Point out that each 1 GEN exposure was locked before its duty began.

## 1:00–1:50 — negligence

Open a case with the labelled synthetic fixture at
`https://slash-court.vercel.app/evidence-fixtures/negligent-failure.txt`:
primary provider failed, secondary provider remained available, and no credible
failover attempt was supplied.
Open `case-2`. Show the operator response, evidence freeze, the R3 finding, and the
`NEGLIGENT_FAILURE -> PARTIAL_SLASH` mapping. Submit adjudication and show the
transaction timeline: EVM submitted, consensus pending, accepted/provisional,
appeal window, finalized, resolution message queued, then applied. The 1 GEN
exposure becomes a 0.5 GEN penalty; the remaining bond is untouched.

## 1:50–2:20 — external outage

Open `case-3` and use the labelled synthetic outage fixture at
`https://slash-court.vercel.app/evidence-fixtures/external-outage.txt` with no
available mitigation. The model can select `EXTERNAL_OUTAGE`, but cannot supply a number.
The deterministic mapping returns `NO_SLASH`; the entire 1 GEN exposure is
released without a beneficiary award.

## 2:20–2:45 — misconduct and uncertainty

Show the labelled synthetic misconduct fixture at
`https://slash-court.vercel.app/evidence-fixtures/provable-misconduct.txt` in
`case-1` and
the insufficient-evidence fixture at
`https://slash-court.vercel.app/evidence-fixtures/insufficient-evidence.txt` in
`case-4`.
Evidence is delimited as data. A fabricated or contradictory signed report can
produce `PROVABLE_MISCONDUCT` and a full commitment-level slash; an ambiguous
record produces `INSUFFICIENT_EVIDENCE` and zero slash.

The console computes a `sha256:` digest over the fetched fixture bytes before
submission. Validators fetch the same URL and compare the full response body
to that committed digest; the fixtures are synthetic demo inputs, not real
incidents. The committed fixture digest manifest is at
`frontend/public/evidence-fixtures/manifest.json`.

## 2:45–3:00 — close

“SlashCourt converts application-specific service bonds from rigid uptime
counters into evidence-based, appealable commitments. Logs prove failure;
SlashCourt determines responsibility.”
