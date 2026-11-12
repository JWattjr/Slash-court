// Publish honest partial evidence only. This can never mark a release ready.
import {readFile,writeFile} from "node:fs/promises";
import assert from "node:assert/strict";
import {explorerContract,explorerTransaction} from "../frontend/lib/pipeline/explorer.mjs";
const file=new URL("../deploy/pipeline-2026-11-11.json",import.meta.url);
const m=JSON.parse(await readFile(file,"utf8"));
const verification=JSON.parse(await readFile(new URL("../docs/pipeline-live/partial-verification.json",import.meta.url),"utf8"));
assert.equal(m.status,"STOPPED_UNEXPECTED");assert.equal(verification.status,"PARTIAL_PASS_RELEASE_BLOCKED");
m.partialVerification={...verification,verifiedAt:new Date().toISOString()};
m.production={updated:false,url:"https://slash-court.vercel.app",reason:"Live all-faithful consensus failure; release gate stopped"};
for(const readback of verification.accountingReadbacks){const c=m.cases.find(c=>c.id===readback.id);if(c.final)c.final=readback.job;}
await writeFile(file,JSON.stringify(m,null,2)+"\n");
const labels={charter:["PipelineCharter","Compile judgment, frozen local duties, native escrow and pull claims"],court:["PipelineCourt","Independent local-step assessment and fetched evidence"],record:["OperatorRecord","Finalized history and deterministic bond multipliers; no LLM"]};
const contracts=Object.entries(m.contracts).map(([role,c])=>({name:labels[role][0],role:labels[role][1],address:c.address,evidenceType:"GenLayer Explorer Contract",explorerUrl:explorerContract(c.address),sourceSha256:c.sourceSha256}));
const completed=m.cases.filter(c=>c.final);
const milestones=[
 ["Subjective charter rejected","PASS","pipeline-subjective-v2"],
 ["Accepted charter and own-wallet finalized bonds","PASS","pipeline-b-fault-v2"],
 ["B liable; A/C pull refunds allocated","PASS","pipeline-b-fault-v2"],
 ["A liable; B/C faithful propagation","PASS","pipeline-a-fault-v2"],
 ["All-faithful finalized adjudication and filing allocation","FAILED_CONSENSUS","pipeline-faithful-v2"],
 ["Earlier uncertainty and deadline refunds","NOT_RUN","pipeline-unclear-v2"],
 ["Finalized record and higher next bond","PASS","pipeline-history-price-v2"],
 ["Native pull claim with positive verified credit","PASS",m.nativeCredit.claimHash]
].map(([requirement,status,reference])=>({requirement,status,reference}));
const proof={status:"LIVE_PARTIAL_BLOCKED",resubmitReady:false,network:"StudioNet",chainId:61999,sourceRevision:m.sourceRevision,contracts:m.contracts,synthetic:true,
 cases:completed.map(c=>({id:c.id,outcome:c.outcome,adjudicationHash:c.adjudicationHash,settlementHash:c.settlementHash,assessment:c.assessment,accounting:c.final})),
 blocker:m.blocker,requiredMilestones:milestones,nativeCredit:m.nativeCredit,appealCapture:m.appealCapture,depositsUsedWei:m.depositsUsedWei,depositCapWei:m.depositCapWei,verification:m.partialVerification};
await writeFile(new URL("../frontend/public/pipeline-proof.json",import.meta.url),JSON.stringify(proof,null,2)+"\n");
const draft={project:"SlashCourt",milestone:"Pipeline Court — Internet Court job disputes",status:"BLOCKED_DO_NOT_SUBMIT",resubmitReady:false,
 summary:"Pipeline Court adds frozen charters, local-step responsibility judgments, native escrow and finalized operator records, built on the Liability Cascade prototype. A new StudioNet deployment proves subjective rejection, accepted bonds, B-fault and A-fault attribution, increased next-bond pricing, a 13-wei native claim, and a genuine ACCEPTED appeal control. The all-faithful adjudication failed consensus; the unclear case and production release are not complete. Incident fixtures are synthetic. This milestone is not ready for submission.",
 newContracts:contracts,sourceRevision:m.sourceRevision,judgmentPoints:["Objective, distinct, observable local duties","Each step against its own received input; fetched verbatim evidence"],requiredMilestones:milestones,
 evidence:[...contracts,...m.transactions.map(t=>({name:t.label,url:explorerTransaction(t.hash),status:t.receipt.status,consensus:t.receipt.result_name})),{name:"Native credit child",url:explorerTransaction(m.nativeCredit.childHash)},{name:"Real ACCEPTED capture",url:`https://github.com/JWattjr/Slash-court/blob/pipeline-v2-live-proof-blocked-20261112/${m.appealCapture.screenshot}`}],
 proofManifest:"deploy/pipeline-2026-11-11.json",howTo:"Review docs/PIPELINE-LIVE.md and run node scripts/verify-pipeline.mjs --partial. Full npm run verify:pipeline intentionally fails while blocked.",
 depositsUsedWei:m.depositsUsedWei,depositCapGEN:"0.1",production:m.production,portalSubmitted:false};
assert(draft.summary.length<=1000);
await writeFile(new URL("../docs/submission/milestone-v2.json",import.meta.url),JSON.stringify(draft,null,2)+"\n");
let doc=`# Pipeline Court live evidence — blocked release\n\nResubmit-ready: **NO**. Verified ${m.partialVerification.verifiedAt}. StudioNet 61999. Every incident log is synthetic.\n\nContract source revision: ${m.sourceRevision}. Original Court/Vault unchanged. No production update or Portal submission.\n\n## Contract evidence\n\n`;
for(const c of contracts)doc+=`- [${c.name}: ${c.address}](${c.explorerUrl}) — separate GenLayer Explorer Contract evidence.\n`;
doc+="\n## Required milestones\n\n| Requirement | Actual result | Reference |\n| --- | --- | --- |\n";
for(const r of milestones)doc+=`| ${r.requirement} | ${r.status} | ${r.reference} |\n`;
doc+="\n## Finalized receipts\n\n";
for(const c of m.cases){const compile=m.transactions.find(t=>t.label===`${c.id}:compile`);doc+=`- ${c.id}: [compilation](${explorerTransaction(compile.hash)}) FINALIZED/MAJORITY_AGREE. `;if(c.final)doc+=`[Adjudication](${explorerTransaction(c.adjudicationHash)}) and [settlement](${explorerTransaction(c.settlementHash)}) FINALIZED/MAJORITY_AGREE; ${c.outcome}. `;if(c.kind==="faithful")doc+=`[Adjudication](${explorerTransaction(m.blocker.hash)}) failed consensus: FINALIZED/MAJORITY_DISAGREE, previously observed UNDETERMINED. `;doc+="\n";}
doc+="\n## Accounting (wei)\n\n| Case | A credit | B credit | C credit | Claimant credit |\n| --- | ---: | ---: | ---: | ---: |\n";
for(const c of completed){const credit=role=>c.final.credits[m.participants[role].toLowerCase()]||0;doc+=`| ${c.id} | ${credit("A")} | ${credit("B")} | ${credit("C")} | ${credit("claimant")} |\n`;}
doc+=`\nCredits are pull entitlements; A/C and B/C refunds are not claimed native payouts. The failed all-faithful job remains DISPUTED with empty credits and no penalty. Its frozen deadline has passed; permissionless settle can open timeout refund credits, but no further write was sent after the failed gate.\n\n## Native claim\n\n[Claim](${explorerTransaction(m.nativeCredit.claimHash)}), [child](${explorerTransaction(m.nativeCredit.childHash)}), [verification](${explorerTransaction(m.nativeCredit.verificationHash)}): ${m.nativeCredit.amountWei} wei, FINALIZED positive value_credited, accounting paid. Native-refund UI journey was not run.\n\n## ACCEPTED appeal window\n\n[Actual screenshot](pipeline-live/pipeline-b-fault-v2-accepted.png) retained exact hash ${m.appealCapture.hash} with enabled appeal control at ${m.appealCapture.observedAt}. Independent protocol timestamps place capture inside ACCEPTED, before finality. No appeal was submitted. Account supplied through an EIP-1193 test signer bridge, not the MetaMask extension.\n\n## Failure and next release\n\n[Saved analysis](pipeline-live/faithful-failure-analysis.json) shows three successful leaders had identical assessments except for valid quote selection. Exact comparison of independently selected prose creates a consensus liveness risk; validator disagreement's complete internal cause cannot be proven from votes alone. A further leader failed local assessment validation. No prompt variant or second adjudication was sent.\n\nBefore another release: fix citation convergence while preserving exact ordered responsibility/evidence metadata and independent fetched-quote validation; add an adversarial test where validators choose different valid spans for the same verdict. Distinguish successful leader execution from consensus acceptance in transaction tracking. Recover the timed-out faithful escrow, then use a reviewed revised Court deployment and an explicitly authorized bounded live run. Never redeploy the original Court/Vault.\n\n## Budget and checks\n\n${m.depositsUsedWei} wei used/reserved against ${m.depositCapWei} wei (0.1 GEN). No new deposit after the failure. ${verification.contractRecordsVerified} contract Explorer records and ${verification.transactionRecordsVerified} transaction records verified through the real Explorer API; source bytes, bindings, completed accounting, fresh native child, operator records, appeal timing and original deployment regression passed. See [partial verifier](pipeline-live/partial-verification.json). The full release verifier deliberately refuses readiness.\n\nLocal checks: 217 direct tests; 18 frontend tests; TypeScript; three GenVM AST/SDK checks; webpack production build; desktop1440x960/mobile390x844 headless mocked workflows. Real production deployment/browser verification was not run because the live gate failed.\n`;
await writeFile(new URL("../docs/PIPELINE-LIVE.md",import.meta.url),doc);
console.log(JSON.stringify({status:"PARTIAL_EVIDENCE_PUBLISHED",ready:false,depositsUsedWei:m.depositsUsedWei}));
