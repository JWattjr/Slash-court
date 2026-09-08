# Bond economics

All values are integer native GEN units in tests and `u256` in contracts.
Production deployments should pass the correct wei-denominated values for the
network's GEN token.

Example operator balance:

```text
total bond             100 GEN
commitment exposure     20 GEN
uncommitted available   80 GEN
```

Settlement is scoped to the 20 GEN exposure:

| Result | Penalty | Beneficiary (80%) | Safety pool (20%) | Remaining operator bond |
| --- | ---: | ---: | ---: | ---: |
| Full slash | 20 | 16 | 4 | 80 |
| Partial slash | 10 | 8 | 2 | 90 |
| No slash | 0 | 0 | 0 | 100 |

Integer rounding uses floor division. The safety allocation is calculated as
`penalty - beneficiary_award`, so the two allocations can never exceed the
penalty. Small penalties may produce a zero beneficiary award while still
assigning the remainder to the safety pool; this is tested with one-unit
partial penalties.

The vault subtracts the penalty from `total_bond`, removes the full locked
exposure, and returns unused exposure to `available_bond`. It updates balances
before queuing finality-safe transfers, preventing a second provisional
withdrawal from spending the same claim.

## Initial customer and payer

The initial customer is a bonded automation operator—keeper networks, treasury
automation providers, and agent operators—whose beneficiaries need a credible
remedy when an agreed duty fails. A protocol or treasury may sponsor the same
integration on behalf of its beneficiaries.

Operators or sponsoring protocols would pay for integration, monitoring, and
case administration. They receive a reusable commitment/Vault layer, public
evidence records, consensus-based responsibility classification, an appealable
decision, and deterministic settlement accounting.

The deployed contracts do **not** implement a SlashCourt platform fee or revenue
share. Commercial pricing is therefore a proposed service model, not current
on-chain revenue.

## Do not conflate the three money flows

- **Beneficiary compensation** is the claimant-facing share of an applied
  operator penalty.
- **Safety-pool allocation** is a protocol reserve held by the Vault. It is not
  platform revenue by default.
- **Platform revenue** is currently zero in the contract design. It would need a
  separate, explicit fee mechanism and governance disclosure before the product
  could claim on-chain revenue.
