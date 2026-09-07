# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

SlashCourt serves GenLayer hackathon stewards and technical reviewers who need to inspect the system without connecting a wallet, beneficiaries who open disputes, and bonded automation operators who create commitments and respond to claims.

## Product Purpose

SlashCourt settles disputes about bonded automation duties. Success means a reviewer can understand the duty, evidence, validator decision, appeal state, and deterministic financial consequence without confusing application-level bonds with native validator stake.

## Positioning

Every adjudication is bound to a vault's canonical duty and alleged rules. Validators fetch allowlisted evidence, preserve party and rule provenance, and classify responsibility; deterministic contracts alone map that classification to a capped penalty and apply it after finality.

## Operating Context

Public visitors inspect StudioNet cases, rulebook versions, evidence boundaries, transaction status, and deployment addresses. Wallet users register operators, deposit demo bonds, create and accept commitments, open cases, respond, freeze evidence, request consensus, appeal an accepted transaction, and retry a finalized settlement message.

## Capabilities and Constraints

- The current product is a Next.js console backed by GenLayer StudioNet intelligent contracts.
- Public reads require no wallet; writes require MetaMask on chain ID 61999.
- Evidence must be bounded, HTTPS, allowlisted, independently fetched, and attributable to a party and alleged rule.
- The console must fail honestly when the public RPC is unavailable and must never invent live verdicts, balances, or TVL.
- Synthetic evidence fixtures are permitted only when clearly labelled.
- Existing contract actions, finality behavior, deployment links, and security disclosures must remain functional.

## Brand Commitments

The product name is SlashCourt. The supplied redesign direction is proof-forward editorial trust-tech: public-system confidence, institutional precision, plain-language outcomes, technical metadata in a restrained monospace voice, and the real decision record as the visual identity. Avoid a generic crypto dashboard or a decorative marketing illustration.

## Evidence on Hand

- Live upgraded deployment provenance: `deploy/last-deployment.json`.
- Historical four-outcome StudioNet proof: `deploy/live-demo.json`, explicitly identified as the predecessor deployment.
- Threat model, economics, architecture, rulebook, demo script, and submission guide under `docs/`.
- Clearly labelled synthetic evidence fixtures under `frontend/public/evidence-fixtures/`.
- SlashCourt logo at `frontend/public/slashcourt-logo.png`.

## Product Principles

- Show the decision and its paper trail before operational controls.
- Translate protocol state into plain language while keeping raw facts available.
- Separate public inspection from wallet-required operation.
- Make provenance and deterministic limits visible, not merely claimed.
- Fail closed and describe unavailable data honestly.

## Accessibility & Inclusion

The web console should support keyboard operation, visible focus, semantic labels, responsive layouts, readable contrast, and reduced-motion preferences.
