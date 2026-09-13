# Threat model

| Risk | Mitigation | Residual risk |
| --- | --- | --- |
| False claimant | Beneficiary-only case opening, commitment lookup, public evidence | A beneficiary can still submit a dishonest narrative |
| Dishonest operator | Signed/public counterevidence, bounded response window, consensus evaluation | Coordinated fabrication outside the allowlist |
| Operator/beneficiary collusion | Pre-locked exposure, immutable case history, no arbitrary penalty input | Parties can agree to waste their own bond |
| Compromised governor | Governor cannot select verdicts or call vault settlement; one-time vault binding | Governor can publish future rulebooks/domains |
| Prompt injection | Evidence is delimited as data; model output schema is closed and bounded | Correlated model interpretation errors |
| Fabricated evidence | Approved domains, URL/scheme/IP checks, independent validator fetch | A trusted public source may be compromised |
| Mutable webpage | Browser commits a SHA-256 over fetched bytes; every validator re-fetches and compares the full response body | HTTPS page can change after submission/finality; immutable hosting remains preferable |
| Correlated LLM errors | Independent validator re-evaluation plus canonical comparison of settlement fields and evidence-reference metadata | Validators may share model/provider bias |
| Private evidence | Private/local/raw IP hosts are rejected | Public sources can still disappear |
| Deadline manipulation | Required canonical UTC timestamps, full-resolution comparisons, transaction context required, bounded windows | Network policy and clock assumptions must be reviewed |
| Case detached from service duty | Vault computes a canonical commitment digest; Court stores every duty field and revalidates digest, case ID, status, parties, trigger, deadlines, action, rulebook, and exposure immediately before consensus | A new duty requires a new commitment and case |
| Untraceable slash reasoning | Slash outcomes require findings that cite fetched evidence; validators independently bind party, hash, source, evidence type, and relevant-rule metadata before Court/Vault persistence | Source truth still depends on approved-domain integrity |
| Appeal target lost in UI | Adjudication hash is stored per network/Court/Vault/case, refreshed after reload, and finalized in the background; only an ACCEPTED transaction with currently verified eligibility can be targeted | Browser storage can be cleared, so explorer receipts remain authoritative |
| Appeal eligibility RPC failure | Failed `canAppeal` reads remain `unknown`, offer an explicit recheck, and block submission before any wallet request | A prolonged RPC outage can consume the appeal window without a successful read |
| Commitment replay | Unique IDs and case-by-commitment index | Storage migration errors could reintroduce duplicates |
| Resolution replay | Case-keyed application record, exact-payload check, and an original-adjudication-finality gate for retries | A failed callback still requires retry/monitoring |
| Double withdrawal | Balance debited before finality-safe transfer | External recipient message failure needs operations handling |
| Oversized evidence DoS | Hard limits on URLs, narratives, item count, findings and responses | Many small cases can still consume fees |
| Accepted-state misuse | UI separates accepted/provisional, finality, queued, and applied | Users can still misread raw explorer status |
| Failed finalized message | `retry_resolution_application`, callback status, execution-result checks | Operators need a keeper/monitor to retry |
| Keeper censorship/downtime | Any authorized party can advance a ready case; state remains inspectable | No liveness guarantee without an external keeper |
| Native-slashing confusion | Documentation and contract comments explicitly scope to application bonds | Integrators can still market it inaccurately |

The strongest fail-closed rule is financial: unavailable web data, malformed
model JSON, invented IDs, contradictory schema fields, and unsupported
classification evidence cannot create a slash. They resolve to an error or
`INSUFFICIENT_EVIDENCE`.
