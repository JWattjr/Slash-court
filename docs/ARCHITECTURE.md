# Architecture

## Boundary

SlashCourt has two application contracts and one off-chain presentation layer.
The vault owns balances and commitment exposure. The court owns rulebook and
case state. Neither contract grants the governor a manual guilty button.

```text
EOA operator --register/deposit/offer--> OperatorBondVault
EOA beneficiary --accept/open/respond--> SlashCourt
SlashCourt --accepted bind_case--> OperatorBondVault
SlashCourt --finalized apply_resolution--> OperatorBondVault
OperatorBondVault --finalized callback--> SlashCourt
```

## Vault invariants

For every registered operator:

1. `total_bond = available_bond + locked_exposure`.
2. A commitment can lock no more than the operator's available bond.
3. A resolution can consume only that commitment's locked exposure.
4. `beneficiary_award + safety_pool_amount = penalty_amount`.
5. `penalty_amount <= locked_exposure`.
6. A case ID can create only one settlement record.

The vault stores a separate address-indexed award map because beneficiaries do
not need to be registered operators.

## Court invariants

1. A commitment is tied to the rulebook version stored at creation.
2. A beneficiary alone can open its commitment's case.
3. The operator receives a response window before adjudication.
4. Evidence is canonicalized and immutable once adjudication begins.
5. Model output contains no monetary fields and cannot invent IDs or URLs.
6. Validator comparison covers substantive settlement fields.
7. A model/web failure returns a no-slash insufficient-evidence result.
8. The court emits the financial application only with `on="finalized"`.

## Consensus boundary

`_produce_independent_result` re-fetches the same bounded public evidence and
constructs the instruction inside the contract. The evidence is delimited as
data and explicitly cannot issue instructions. `run_nondet_unsafe` then runs a
leader result plus an independent validator function. Validators compare the
closed classification, derived outcome, violated rules, and supported
exemptions. The amount is always derived by `_bps_for` and the vault's
commitment exposure.

## Frontend data boundary

The Next.js client reads `get_statistics`, `get_case`, `get_current_rulebook`,
`get_operator`, and `get_balance_breakdown` from configured addresses. Writes
display the EVM submission, accepted/provisional, finality, queued message,
and applied state separately. A missing address disables live actions rather
than showing a fabricated success state.
