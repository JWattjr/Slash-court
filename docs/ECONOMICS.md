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
