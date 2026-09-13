# Steward response draft

Thank you. We confirmed that every case already freezes the Vault's canonical
duty, trigger, duty/dispute deadlines, expected action, parties, exposure,
rulebook version, and commitment digest; adjudication re-reads and exact-matches
that commitment, and the Vault rechecks the digest before applying a result.
Alleged rules are frozen before evaluation and forwarded with settlement.

We have now closed the remaining source-level citation gap. Both the proposed
leader result and each validator's independent result are canonicalized against
the evidence fetched and hash-verified during that evaluation. Evidence ID,
rule association, submitting party, evidence type, source domain, content hash,
and relevant rules are validator-bound and exactly compared. Unknown, altered,
missing, malformed, oversized, or duplicated references cannot authorize a
slash. Penalties remain a deterministic mapping from the bound classification;
finding prose and the bounded explanation remain informational and do not set
money or introduce citations.

The console now retains the adjudication hash from submission through ACCEPTED
and finality, keeps the appeal window interactive while finality polls in the
background, recovers nonterminal adjudications after reload, treats failed
`canAppeal` reads as unavailable rather than false, and rechecks eligibility
immediately before any wallet request. Mocked workflow tests prove the retained
appeal target survives unrelated case transactions and cannot remain enabled
after finality.

We also corrected case-5's truncated receipt reference to the verified finalized
transaction:
`0x03b193ad13f8bee3f4dc855a5070c7a09c28f50d26c16d3ff4954b47cb5ff366`.

Deployment status: these citation-consensus and appeal-console changes are
local and tested (43 direct tests, 8 five-validator GLSim integration
tests, and 12 frontend workflow tests pass); they are not yet live. The existing StudioNet pair remains
valid finalized predecessor evidence for canonical duty binding and deterministic
Vault accounting, but it is not presented as proof of the new citation consensus
or appeal UI. Before resubmission we will deploy a new mutually bound Court/Vault
pair and frontend, verify source identity and bindings, and capture one exact
adjudication hash with the appeal control enabled at ACCEPTED, followed by its
finalized one-time Vault application. We will submit an actual appeal only with
separate authorization.

Evidence map: `docs/SUBMISSION_GUIDE.md` → **Steward requirement map**.
Deployment and verification limits: `docs/DEMO_READINESS.md`.

**Resubmit-ready: NO — deployment and live ACCEPTED-window evidence remain.**
