# Pipeline Court tutorial — implementation candidate

This tutorial describes the new code, not a released deployment. Until the
live manifest contains verified addresses and receipts, use it for local review.
The original single-operator SlashCourt deployment stays separate. Pipeline
Court is built on the Liability Cascade prototype and preserves its ordered
local judgments and earliest-violation allocation. The new milestone adds
charter compilation, native escrow, filing bonds, and finalized operator records.

## Understand the job before funding

A pipeline has between two and five ordered steps. Each step has a unique ID,
a distinct operator address, and a local duty. Describe the whole job in plain
English, then specify exactly what each operator must do to its received input.
For example, A may redact emails, B may uppercase names while preserving the
contact values it receives, and C may export the received CSV unchanged. Those
are separate obligations. C does not acquire an unstated redaction duty merely
because it is the final publisher.

Open /pipeline and use the Charter builder. Supply the job identifier, charter,
operator addresses, step duties, base bond in wei, filing bond in wei, and three
UTC deadlines. Funding must close before evidence recording closes, which must
close before the final refund deadline. The contract limits deadlines to thirty
days from compilation. The console currently supports only exact safe-integer
wei values and disables financial reads outside that range; the demo should
use small whole-wei amounts.

Compiling calls PipelineCharter.compile. Validators independently check that
every duty is objectively checkable from that step's input and output, does not
overlap another step's duty, and has an observable output. They compare the
entire ordered check structure. The original duty text is retained, rather
than trusting a model to paraphrase obligations. Failed checks produce explicit
rejection reasons. Accepted charters become FUNDING only after finality. The
frozen digest includes the deployment, job ID, duties, operators, prices, and
deadlines, so a later dispute cannot swap those terms.

## Post bonds and preserve evidence

Every operator posts its own exact bond. The latest finalized OperatorRecord
determines the multiplier: zero violations costs one base bond, one violation
costs twice the base, and two or more cost four times the base. A stale record
must be synchronized before compiling a new price. These amounts freeze at
compilation. The final operator deposit activates the job; incomplete funding
can be refunded after the funding deadline by any caller.

Operators use Freeze step evidence to record their received input and produced
output. Each reference must be an exact raw GitHub URL pinned to a forty-digit
commit SHA, accompanied by the SHA-256 digest of the complete original bytes.
The operator wallet signs this commitment. Records cannot be replaced. Pinning
prevents an editable branch URL from changing the adjudication inputs, but it
does not prove that a fictional demonstration log describes a real incident.
Always label synthetic logs accordingly.

## File and adjudicate one dispute

After the evidence deadline, an account that is not one of the operators can
file an incident and post the exact filing bond. Its description is an
allegation, not an instruction to validators. Operators cannot collect their
own claimant award. The Court reads the frozen charter and operator records
instead of accepting replacement evidence from the claimant.

Judge pipeline invokes PipelineCourt.adjudicate. Validators independently fetch
both logs for each step, compare observed bytes with their commitments, and
assess only that step's local duty. The bounded output is FAITHFUL, VIOLATION,
or UNCLEAR plus a verbatim quote from the fetched input or output. The complete
ordered assessment, availability observations, digests, and quotes must agree.
Instructions embedded inside evidence are untrusted data. Missing or unusable
evidence cannot manufacture a violation.

The page retains transaction hashes through reload and shows provisional
ACCEPTED decisions separately from FINALIZED execution results. The existing
appeal control checks fresh eligibility before submitting. Do not submit an
appeal merely to capture the demonstration: a real enabled control and its
retained hash are separate evidence from an actual appeal transaction.

## Settle, claim, and verify the credit

After adjudication finality, anyone can request settlement. Code scans from
the first step. The earliest proven violation pays its bond to the claimant,
and the other operators recover their bonds. If every step was faithful, each
operator also receives its share of the claimant's filing bond. Integer
division distributes all wei, including any remainder. If an earlier step is
unclear, attribution is blocked until the deadline, then deposits and the
filing bond are refunded. A job that never gets a decision also has a timed
refund path. Timeout is a void, not proof of innocence or misconduct.

Settlement creates credits before native transfers. Once settlement finalizes,
any caller can trigger a claim for a fixed recipient. The contract reserves
that claim before sending, preventing a duplicate application. A reservation
does not prove payment. Pass the claim hash to verify_claim, which independently
checks the protocol parent and native child, exact calldata and attempt,
recipient, amount, finality, and positive value_credited. Only finalized positive
verification marks the credit paid. Unknown receipts keep the claim pending;
verified failed transfers can retry with the next attempt. Callback recovery
uses a finalized source receipt instead of assuming delivery.

Finally inspect Operator records. A permissionless sync reads only finalized
settlements, records the selected violation or void, and updates the next bond
multiplier once per job. Public inspection needs no wallet. For release proof,
use the dated manifest and `npm run verify:pipeline`; neither local tests nor
the existence of this tutorial establishes a successful native payout.
