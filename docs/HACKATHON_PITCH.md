# Hackathon pitch

## 15 seconds

Logs prove that a bonded operator failed; SlashCourt determines who was
responsible. GenLayer validators independently evaluate public evidence under
a frozen rulebook, then a deterministic vault applies only the pre-locked
commitment penalty after finality.

## 45 seconds

Automation keepers, relayers, RPC providers, and oracle agents often guarantee
service with bonds. Uptime code can detect a miss, but it cannot distinguish
negligence from an unavoidable outage or fabricated evidence. SlashCourt lets a
beneficiary open a bounded case, gives the operator a response window, and
asks GenLayer to evaluate responsibility under seven published rules. The
model selects only one of four classifications. Contracts derive the fixed
full, partial, or zero penalty from the commitment's locked exposure. No
penalty moves before finality, and the application never touches native
validator slashing.

## 90 seconds

The product has two contracts. OperatorBondVault registers operators, receives
GEN, locks exposure per service commitment, and enforces accounting invariants.
SlashCourt versions the rulebook, validates public HTTPS evidence, freezes both
sides' submissions, and constructs a consensus-critical prompt that treats all
evidence as hostile data. Validators independently re-fetch evidence and
compare the substantive classification, rules, exemptions, and derived
outcome. A malformed or unavailable source cannot become a slash. After the
appeal/finality boundary, SlashCourt emits an idempotent message to the vault.
The result is an onchain settlement workflow that keeps deterministic facts and
money arithmetic deterministic while using GenLayer for the responsibility
judgment that ordinary contracts cannot make.

## Five-slide outline

1. **Failure is observable; responsibility is not** — keeper incident story.
2. **SlashCourt workflow** — commitment, evidence, response, consensus,
   finality, settlement.
3. **Safety architecture** — closed classifications, exposure cap, evidence
   perimeter, independent validator checks.
4. **Live demo** — negligent failure, outage exemption, and finality timeline.
5. **Market and roadmap** — relayers, RPC, oracles, content-addressed proofs,
   rulebook governance, monitoring.

## Judge questions

**Does it slash GenLayer validators?** No. It manages separate application
bonds for external service operators.

**Can the LLM choose the amount?** No. The model cannot return monetary fields;
the vault computes basis points against pre-locked exposure.

**What if evidence tells the model to ignore the rules?** Evidence is
delimited as data, the prompt is contract-authored, and the schema rejects
invented IDs, URLs, and unsupported rule/classification combinations.

**Why not a deterministic SLA?** Deterministic code proves a miss; it cannot
reliably judge outage exemptions, failover reasonableness, or evidence
integrity.

**What happens on disagreement or web failure?** A disagreement/error does not
apply money. The case stays provisional or resolves to insufficient evidence;
the network appeal process remains authoritative.

## Competitive comparison

| Approach | Strength | Missing piece |
| --- | --- | --- |
| Deterministic SLA contract | Cheap, crisp facts | Cannot judge responsibility |
| Centralized arbitration | Rich context | Trust and censorship bottleneck |
| Multisig committee | Human escalation | Slow, opaque, hard to scale |
| Native protocol slashing | Protects protocol consensus | Not designed for every app operator |
| Single AI judge | Flexible interpretation | Correlated errors and arbitrary money |
| SlashCourt | Public evidence + independent consensus + fixed economics | Depends on evidence quality and network finality |
