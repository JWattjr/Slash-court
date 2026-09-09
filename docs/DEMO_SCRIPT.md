# 60–90 second demo: negligence versus outage

Use the public console without connecting a wallet. The primary comparison is
the finalized pair on the current deployment. Both use explicitly labelled
synthetic evidence fixtures; their consensus and Vault transactions are real.

## 0:00–0:15 — the responsibility problem

“A log can show that an automation duty was missed. It cannot decide whether the
operator was negligent or whether a broad outage made performance impossible.
SlashCourt binds the duty first, then GenLayer validators evaluate attributable
evidence under a versioned rulebook.”

Show the current Court and Vault links. Point out that public inspection is
wallet-free and financial controls stay disabled if Court, Vault, rulebook, or
evidence-policy reads are unavailable.

## 0:15–0:48 — preventable negligence

Open the shareable current case URL:

`https://slash-court.vercel.app/#case/current/case-4`

“This labelled synthetic fixture says the primary RPC failed while the
configured secondary remained available and no failover attempt was evidenced.
The case is bound to its duty and 1 GEN exposure. Validators classified it as
`NEGLIGENT_FAILURE`; the deterministic mapping produced `PARTIAL_SLASH`.”

Show the case facts before metadata, evidence, response status, R3 basis,
adjudication transaction, finalized state, and Vault accounting: 0.5 GEN
penalty, 0.4 GEN beneficiary compensation, and 0.1 GEN safety-pool allocation.
If the live historical read is limited, the UI explicitly marks the operator
response and exact findings unavailable while retaining the checked manifest.

## 0:48–1:12 — excusable external outage

Open:

`https://slash-court.vercel.app/#case/current/case-5`

“Here the synthetic evidence says primary and secondary providers shared the
regional incident and mitigation was unavailable. Validators classified it as
`EXTERNAL_OUTAGE`; deterministic policy produced `NO_SLASH`.”

Show the R4 exemption, finalized adjudication transaction, zero penalty, zero
beneficiary compensation, zero safety-pool allocation, and release of the full
1 GEN exposure.

## 1:12–1:25 — close

“The AI decides responsibility from evidence. It never chooses a number. The
contracts cap the consequence, preserve an appeal window, and apply a case only
once after finality.”

If time remains, open the explicitly labelled historical deployment for
provable misconduct and insufficient evidence. Never describe any fixture as a
real incident. Current cases 1–3 are cancelled setup attempts.
