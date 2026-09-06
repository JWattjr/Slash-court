# Keeper rulebook v1

The deployed v1 text is also stored in `config/rulebook_v1.txt`.

- **R1 — DUTY_WINDOW:** submit the agreed maintenance transaction within ten
  minutes of the scheduled trigger.
- **R2 — AUTHORIZED_PAYLOAD:** the submitted action must match the authorized
  target and permitted operation.
- **R3 — FAILOVER_DUTY:** if the primary RPC or provider fails, make a
  reasonable attempt to use the configured secondary provider.
- **R4 — EXTERNAL_OUTAGE_EXEMPTION:** a missed duty is excused only when
  credible evidence indicates a widespread external outage and reasonable
  mitigation was unavailable or unsuccessful.
- **R5 — EVIDENCE_INTEGRITY:** contradictory signed reports, fabricated
  evidence, or a knowingly unauthorized payload is provable misconduct.
- **R6 — BURDEN_OF_PROOF:** financial penalties require sufficient
  independently verifiable evidence; material uncertainty resolves to
  `INSUFFICIENT_EVIDENCE`.
- **R7 — PROPORTIONALITY:** provable misconduct receives the full commitment
  penalty, preventable negligence receives the partial penalty, and covered
  outages receive no penalty.

## Fixed mapping

| Classification | Outcome | Exposure basis points |
| --- | --- | ---: |
| `PROVABLE_MISCONDUCT` | `FULL_SLASH` | 10,000 |
| `NEGLIGENT_FAILURE` | `PARTIAL_SLASH` | 5,000 |
| `EXTERNAL_OUTAGE` | `NO_SLASH` | 0 |
| `INSUFFICIENT_EVIDENCE` | `NO_SLASH` | 0 |

The model selects only the classification. The contract rejects monetary
fields in model output and derives the penalty from the frozen rulebook and
pre-locked exposure.
