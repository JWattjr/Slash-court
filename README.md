# SlashCourt

> Logs prove that the operator failed; SlashCourt determines who was responsible.

SlashCourt is an application-layer settlement primitive for bonded automation
keepers. An operator pre-commits a bounded amount of GEN to one duty. If the
duty is disputed, the beneficiary submits public evidence and the operator
responds. GenLayer validators independently evaluate responsibility under the
commitment's frozen rulebook. A deterministic contract maps the resulting
classification to a fixed commitment-level penalty, and the vault applies it
only through a finalized message.

SlashCourt is not GenLayer's native validator-slashing system, a legal court,
an insurance product, or a reputation leaderboard. It cannot slash protocol
validators or call privileged protocol-slashing functions.

## Why GenLayer is necessary

Deterministic code can prove that a transaction was late, a heartbeat was
missed, or two signed payloads conflict. It cannot by itself decide whether a
provider-wide outage excused the miss, whether failover was reasonably
attempted, or whether evidence integrity was materially violated. SlashCourt
keeps those judgment questions inside a bounded, appealable consensus
transaction while leaving identity, deadlines, exposure caps, and money
arithmetic deterministic.

## Architecture

```text
 operator wallet                     beneficiary wallet
       |                                      |
       | register / deposit / offer            | accept / open case
       v                                      v
+-----------------------+     finalized     +------------------------+
| OperatorBondVault     | <----------------- | SlashCourt             |
| GEN balances          |  resolution        | rulebooks + evidence   |
| commitments           |  callback          | consensus evaluation   |
| exposure caps         | -----------------> | classification only    |
+-----------------------+                    +------------------------+
             ^                                        |
             | finality-safe award / withdrawal       |
             +----------------------------------------+
```

The vault never accepts an arbitrary amount from the model. `FULL_SLASH`,
`PARTIAL_SLASH`, and `NO_SLASH` are closed mappings from the four supported
classifications, and every amount is capped by the commitment's pre-locked
exposure. It also recomputes the commitment digest before settlement and stores
the alleged rules plus fetched-evidence citations with the application.

## Repository map

- `contracts/operator_bond_vault.py` — application-layer bond accounting,
  commitments, capped settlement, awards, safety pool, and withdrawals.
- `contracts/slash_court.py` — versioned rulebooks, evidence perimeter, case
  lifecycle, deterministic facts, independent validator evaluation, and
  finalized resolution messages.
- `tests/direct/` — fast leader-path tests and hostile-input tests.
- `tests/integration/` — five-validator GLSim flows for deployment and all four
  classifications.
- `frontend/` — responsive dashboard, case composer, rulebook view, and
  lifecycle-aware transaction UI.
- `deploy/deployScript.ts` — ordered deployment and one-time wiring.
- `docs/` — architecture, economics, threat model, test/demo script, and
  pitch materials.

## Lifecycle

Commitments move through `OFFERED -> ACTIVE -> DUTY_REPORTED -> DISPUTED ->
RESOLVED`, with `RELEASED` and `CANCELLED` terminal alternatives. Cases move
through `OPEN/AWAITING_RESPONSE -> READY_FOR_ADJUDICATION -> ADJUDICATING ->
RESOLUTION_RECORDED -> APPLICATION_QUEUED -> PENALTY_APPLIED` or
`CANCELLED`. The network status is stored separately, so `ACCEPTED_PROVISIONAL`
is never presented as irreversible finality.

## Local setup

Use Python 3.11+ and Node.js 20+.

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
pip install -r requirements.txt
npm install
```

Run the contract checks:

```powershell
python -X utf8 -m genvm_linter.cli check contracts\slash_court.py
python -X utf8 -m genvm_linter.cli check contracts\operator_bond_vault.py
python -X utf8 -m genvm_linter.cli schema contracts\slash_court.py
python -X utf8 -m genvm_linter.cli schema contracts\operator_bond_vault.py
python -m pytest tests\direct -v
```

For Windows with the v0.29 GLSim package, start the compatibility wrapper. It
keeps the pinned SDK alive across nested schema reads, unwraps the direct-test
proxy so GLSim caches the real ABI, preserves payable transaction values, and
uses UTF-8 simulator logs:

```powershell
python -m tools.glsim_compat --port 4001 --validators 5 --no-browser --seed slashcourt
python -m pytest tests\integration -v -s
```

The wrapper only repairs local simulator plumbing; it does not alter production
contract behavior. GLSim 0.29 drains only one sibling PostMessage, so the
financial integration test uses the contract's finality-gated retry path after
the acknowledgement callback. The CI workflow runs direct tests by default and
exposes the consensus suite as a manual/local step.

## Frontend

```powershell
cd frontend
npm install
npm run lint
npm run typecheck
npm run build
npm run dev
```

Copy `.env.example` to `.env.local` and set the two deployed addresses. With
no addresses, the UI stays in a clearly labeled configuration state and does
not invent a verdict or pretend that a transaction succeeded.

## Deployment

The official CLI owns the configured account and network; no private key is
stored here.

```powershell
genlayer network set studionet
npm run deploy
```

The script deploys the vault first, deploys the court, binds both addresses,
publishes rulebook v1, configures the approved domains, checks consensus plus
GenVM execution success for every step, and writes
`deploy/last-deployment.json`. Application bond deposits are separate from
transaction fees and require a funded account. No StudioNet or Bradbury
address is claimed by the source code; the current StudioNet deployment is
recorded in `deploy/last-deployment.json` and listed below.

Current steward-response StudioNet deployment (2026-09-07):

- `OperatorBondVault`: [`0x5eAba41b27560505A45fD51a301f01f30832E7E4`](https://explorer-studio.genlayer.com/address/0x5eAba41b27560505A45fD51a301f01f30832E7E4)
- `SlashCourt`: [`0xA4636860ea78c6E29179E7893e1bDa68133D15aB`](https://explorer-studio.genlayer.com/address/0xA4636860ea78c6E29179E7893e1bDa68133D15aB)
- Rulebook publication: [`0xf47ec484113e69f450877dfa633174ed857c88503a7b75fc63549fa892a9355f`](https://explorer-studio.genlayer.com/tx/0xf47ec484113e69f450877dfa633174ed857c88503a7b75fc63549fa892a9355f)

StudioNet reads verified the new pair's bidirectional binding, rulebook v1
digest, fixed penalty schedule, and `slash-court.vercel.app` evidence
allowlist. The four real finalized consensus cases below belong to the
predecessor deployment (`Court 0x576B...bf8e`, `Vault 0x95E4...625B`), retained
as historical end-to-end evidence while the steward-response pair is seeded:

- `case-1`: `PROVABLE_MISCONDUCT -> FULL_SLASH` (1 GEN)
- `case-2`: `NEGLIGENT_FAILURE -> PARTIAL_SLASH` (0.5 GEN)
- `case-3`: `EXTERNAL_OUTAGE -> NO_SLASH`
- `case-4`: `INSUFFICIENT_EVIDENCE -> NO_SLASH`

The operator deposited 4 GEN across four 1 GEN commitments. Final accounting
is 2.5 GEN remaining bond, 1.5 GEN total penalties, 1.2 GEN beneficiary
awards, 0.3 GEN safety pool, and zero locked exposure. The incident fixtures
are explicitly synthetic; adjudication, finality, and settlement are live.
Exact predecessor addresses and receipts are recorded in
`deploy/live-demo.json`; they are not attributed to the current contracts.

## Security posture and known limitations

These bullets describe the current repository source. The existing StudioNet
deployment predates the latest citation-consensus and appeal-console changes;
see `docs/DEMO_READINESS.md` for the exact live/source boundary.

- Public HTTPS evidence is allowlisted by domain; localhost, raw/private IPs,
  unsupported schemes, oversized items, invented IDs, and post-freeze writes
  are rejected.
- Web/LLM failure becomes `INSUFFICIENT_EVIDENCE`, never a slash.
- Validators re-fetch evidence, canonicalize the proposed and independent
  results, and compare classification, outcome, rule sets, evidence/rule
  references, and citation party/type/domain/hash/rule metadata. Bounded
  finding and explanation prose remains informational and cannot alter money.
- Every adjudication revalidates the vault's canonical duty digest, trigger,
  deadlines, expected action, parties, rulebook, exposure, and case binding.
- Financial slashes require fetched-evidence findings. Court and Vault records
  preserve each citation's submitting party, relevant rules, domain, type, and
  committed content hash.
- Only a finalized vault message changes application balances.
- The network's appeal operation is authoritative. The UI persists the exact
  adjudication hash at ACCEPTED, exposes the pre-finality appeal window, and
  tracks finalization in the background.
- Evidence fixtures are synthetic and clearly labeled. They are demo inputs,
  not historical incidents.
- Current tests use the pinned `py-genlayer:1jb45...` runner requested by the
  brief and available in the local toolchain. The current public SDK reference
  advertises a newer runner; see `docs/DECISIONS.md` for the compatibility
  decision and upgrade path.

SlashCourt is a hackathon-quality reference implementation. Review rulebook
governance, evidence source integrity, validator correlation, and the network
appeal/finality configuration before using it with real value.

## Official references

- [GenLayer intelligent contracts](https://docs.genlayer.com/)
- [Equivalence Principle](https://docs.genlayer.com/developers/intelligent-contracts/equivalence-principle)
- [Web access](https://docs.genlayer.com/developers/intelligent-contracts/features/web-access)
- [Value transfers](https://docs.genlayer.com/developers/intelligent-contracts/features/value-transfers)
- [Finality](https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/optimistic-democracy/finality)
- [Appeal process](https://docs.genlayer.com/understand-genlayer-protocol/core-concepts/optimistic-democracy/appeal-process)
