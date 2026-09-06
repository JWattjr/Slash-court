# Engineering decisions

## Application-layer slashing

SlashCourt deliberately manages bonds for external service operators. It does
not claim authority over GenLayer validator stake or native protocol slashing.
This keeps the product honest and makes the vault permission model auditable.

## Classification, not amount

The evaluator returns one of four closed classifications. Amounts, recipients,
shares, and caps are deterministic contract logic. Any model result containing
`penalty_bps`, `penalty_amount`, `amount`, or `percentage` is rejected.

## Rulebook pinning

The commitment stores its rulebook version. Publishing v2 changes future
commitments only; it cannot rewrite an existing case's interpretation.

## Finality-safe settlement

Adjudication stores a provisional result but emits the vault call with
`on="finalized"`. A callback records the application only after the message
has finalized. Retry is idempotent and never recomputes money from mutable
frontend state.

## Runner pin

The brief requested `py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6`.
The current public SDK API reference advertises a newer hash, but the local
GenVM linter cache and installed v0.18 toolchain can validate and execute the
requested concrete hash. We keep the concrete local pin, never use `test` or
`latest`, and isolate the upgrade to a deliberate toolchain change.

## Simulator compatibility

The installed v0.29 GLSim records a transaction's user value but does not pass
it into its direct engine message context. `tools.glsim_compat` patches that
test runner plumbing and preserves the contract's production use of
`gl.message.value`. It is not a contract bypass or a test-only mint path.

## Evidence policy

Evidence must be public HTTPS content under a governor-approved domain. The
contract stores bounded claims and hashes, while validators independently
retrieve the public source. Mutable pages remain a residual risk; a future
version should accept fixed-block RPC proofs and content-addressed snapshots.

## Deployment status

The current StudioNet deployment is recorded locally in the ignored
`deploy/last-deployment.json` and in the README. The deployment script writes
addresses and every successful deployment/configuration transaction only after
consensus and GenVM execution succeed. The frontend's local environment uses
the public addresses; no private key or funded-wallet secret is stored.
