// Publish only after the separate read-only verifier succeeds against live state.
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import {explorerContract,explorerTransaction} from "../frontend/lib/pipeline/explorer.mjs";
const root=new URL("../",import.meta.url),file=new URL("../deploy/pipeline-2026-11-11.json",import.meta.url);
const verified=execFileSync("node",["scripts/verify-pipeline.mjs"],{cwd:root,encoding:"utf8"});
const result=JSON.parse(verified);if(result.status!=="PASS")throw new Error("Live verification did not pass");
const m=JSON.parse(await readFile(file,"utf8"));m.status="LIVE_PASS";m.verifiedAt=new Date().toISOString();m.verification=result;m.limitations=["All incident fixtures are synthetic", "Claims are pull-based: unclaimed refunds are credits, not claimed native payouts", "StudioNet test GEN; no real TVL"];
for(const readback of result.accountingReadbacks||[]){const c=m.cases.find(c=>c.id===readback.id);if(c&&!c.rejected&&c.kind!=="pricing")c.final=readback.job;}
m.requiredMilestones=[
  {requirement:"Subjective charter rejected",caseId:"pipeline-subjective-v2"},
  {requirement:"Accepted charter and all own-wallet finalized bonds",caseId:"pipeline-b-fault-v2"},
  {requirement:"Only B slashed; A/C refunded",caseId:"pipeline-b-fault-v2"},
  {requirement:"Only A slashed; B/C faithful propagation",caseId:"pipeline-a-fault-v2"},
  {requirement:"All faithful; filing bond to operators",caseId:"pipeline-faithful-v2"},
  {requirement:"Earlier uncertainty; deadline refunds",caseId:"pipeline-unclear-v2"},
  {requirement:"Finalized record and increased next bond",caseId:"pipeline-history-price-v2"},
  {requirement:"Pull claim with verified native credit",transactionHash:m.nativeCredit.claimHash}
];
await writeFile(file,JSON.stringify(m,null,2)+"\n");
const proof={status:"LIVE_PASS",network:"StudioNet",chainId:61999,sourceRevision:m.sourceRevision,verifiedAt:m.verifiedAt,contracts:m.contracts,
  cases:m.cases.filter(c=>c.adjudicationHash).map(c=>({id:c.id,outcome:c.outcome,adjudicationHash:c.adjudicationHash,assessment:c.assessment,accounting:c.final})),
  nativeCredit:m.nativeCredit,nativeRefundCredit:m.nativeRefundCredit,appealCapture:m.appealCapture,depositsUsedWei:m.depositsUsedWei,depositCapWei:m.depositCapWei,requiredMilestones:m.requiredMilestones,synthetic:true};
await writeFile(new URL("../frontend/public/pipeline-proof.json",import.meta.url),JSON.stringify(proof,null,2)+"\n");
const contracts=Object.entries(m.contracts).map(([name,c])=>({name,address:c.address,explorerUrl:explorerContract(c.address),evidenceType:"GenLayer Explorer Contract",sourceRevision:m.sourceRevision,sourceSha256:c.sourceSha256}));
const labels={charter:["PipelineCharter","Charter compilation and native escrow"],court:["PipelineCourt","Independent local-step evidence judgment"],record:["OperatorRecord","Finalized history and bond multipliers; no LLM"]};
for(const c of contracts){const label=labels[c.name];c.name=label[0];c.role=label[1];}
const originalContracts=[{name:"SlashCourt (unchanged)",address:m.originalDeployment.court},{name:"OperatorBondVault (unchanged)",address:m.originalDeployment.vault}].map(c=>({...c,explorerUrl:explorerContract(c.address),evidenceType:"GenLayer Explorer Contract"}));
const compileEvidence=m.cases.map(c=>({name:`${c.id} compilation`,url:explorerTransaction(m.transactions.find(t=>t.label===`${c.id}:compile`).hash)}));
const draft={project:"SlashCourt",milestone:"Pipeline Court — Internet Court job disputes",status:"LIVE_VERIFIED_PRODUCTION_PENDING",
  summary:"Pipeline Court extends SlashCourt to ordered multi-agent job disputes. Validators compile a frozen charter and independently judge each step against its own received input. Exact ordered assessment and fetched quotes bind the evidence. Code slashes only the earliest proven violator, refunds other bonds, and applies deadline refunds when earlier uncertainty blocks attribution. Three new StudioNet contracts add native pull claims and finalized fault-history bond pricing. Built on Liability Cascade; the original SlashCourt contracts remain unchanged. All incident logs are labelled synthetic.",
  newContracts:contracts,originalContracts,judgmentPoints:["Charter: objective local duty, non-overlap, observable output", "Court: input-conditioned responsibility and verbatim fetched evidence"],
  evidence:[...contracts,...originalContracts,...compileEvidence,...m.cases.filter(c=>c.adjudicationHash).map(c=>({name:c.id,url:explorerTransaction(c.adjudicationHash)})),{name:"Native claim",url:explorerTransaction(m.nativeCredit.claimHash)},{name:"Native credit child",url:explorerTransaction(m.nativeCredit.childHash)}],
  howTo:"Open /pipeline, compare B-fault with A-fault and faithful propagation, inspect the all-faithful and earlier-unclear cases, review operator pricing and native credit, then run npm run verify:pipeline.",
  proofManifest:"deploy/pipeline-2026-11-11.json",sourceRevision:m.sourceRevision,depositCapGEN:"0.1",depositsUsedWei:m.depositsUsedWei,portalSubmitted:false};
draft.requiredMilestones=m.requiredMilestones;
draft.appealCapture={...m.appealCapture,publicScreenshotUrl:`https://github.com/JWattjr/Slash-court/blob/main/${m.appealCapture.screenshot}`};
draft.evidence.push({name:"Live proof manifest",url:"https://slash-court.vercel.app/pipeline-proof.json"});
if(m.nativeRefundCredit)for(const [name,key]of[["Native refund claim","claimHash"],["Native refund credit","childHash"],["Native refund verification","verificationHash"]])draft.evidence.push({name,url:explorerTransaction(m.nativeRefundCredit[key])});
if(draft.summary.length>1000)throw new Error("Summary exceeds 1000 characters");
await writeFile(new URL("../docs/submission/milestone-v2.json",import.meta.url),JSON.stringify(draft,null,2)+"\n");
let doc=`# Pipeline Court live evidence\n\nVerified ${m.verifiedAt}. StudioNet 61999. All incident logs are synthetic.\n\nSource revision: ${m.sourceRevision}.\n\n`;
for(const c of contracts)doc+=`- [${c.name}: ${c.address}](${c.explorerUrl}) — separate GenLayer Explorer Contract evidence.\n`;
doc+="\n## Finalized cases\n\n";
for(const c of m.cases){doc+=`- ${c.id}: ${c.rejected?"REJECTED":c.kind==="pricing"?"Higher bond verified":c.outcome}. [Compilation](${explorerTransaction(m.transactions.find(t=>t.label===`${c.id}:compile`).hash)}). `;if(c.adjudicationHash)doc+=`[Adjudication](${explorerTransaction(c.adjudicationHash)}). `;if(c.settlementHash)doc+=`[Settlement](${explorerTransaction(c.settlementHash)}). `;doc+="\n";}
doc+="\nAll above parent transactions are protocol FINALIZED with successful execution. The accepted charter's own-wallet bond deposit receipts are retained individually in the manifest. The eight required milestones share these six charters; they are not described as eight separate adjudications.\n\n## Deterministic accounting (wei)\n\n| Case | A credit | B credit | C credit | Claimant credit | Liable step |\n| --- | ---: | ---: | ---: | ---: | --- |\n";
for(const c of m.cases.filter(c=>c.final)){
 const credits=c.final.credits,amount=role=>credits[m.participants[role].toLowerCase()]||0;
 doc+=`| ${c.id} | ${amount("A")} | ${amount("B")} | ${amount("C")} | ${amount("claimant")} | ${c.final.liable_index===null?"None":["A","B","C"][c.final.liable_index]} |\n`;
}
doc+=`\n## Native credit\n\n[Claim](${explorerTransaction(m.nativeCredit.claimHash)}), [native child](${explorerTransaction(m.nativeCredit.childHash)}), [verification](${explorerTransaction(m.nativeCredit.verificationHash)}). Positive value_credited verified; amount ${m.nativeCredit.amountWei} wei. Unclaimed operator refunds remain pull credits.\n\n## Appeal window\n\nExact hash ${m.appealCapture.hash}; enabled control captured during ACCEPTED at ${m.appealCapture.observedAt}. No appeal sent. ${m.appealCapture.provider}. Screenshot: [capture](../${m.appealCapture.screenshot}).\n\n## Budget and verification\n\nDeposits reserved/used: ${m.depositsUsedWei} wei against the 100000000000000000 wei (0.1 GEN) cap. Every write intent counts toward the cap even if a later transaction fails. Read-only npm run verify:pipeline checks source identity, bindings, finality, accounting, native credit and Explorer identity. Original Court/Vault regression passes.\n`;
await writeFile(new URL("../docs/PIPELINE-LIVE.md",import.meta.url),doc);
if(m.nativeRefundCredit)await writeFile(new URL("../docs/PIPELINE-LIVE.md",import.meta.url),doc+`\n## Native refund and wallet journey\n\nThe actual console submitted [the refund claim](${explorerTransaction(m.nativeRefundCredit.claimHash)}) using the existing test account through an EIP-1193 signer bridge. The claimant triggered payment to operator A; this is permissionless fixed-recipient recovery, not a recipient substitution. The hash survived reload. [Native child](${explorerTransaction(m.nativeRefundCredit.childHash)}) credited ${m.nativeRefundCredit.amountWei} wei; [verification](${explorerTransaction(m.nativeRefundCredit.verificationHash)}) finalized and accounting reads paid. [Journey record](pipeline-live/pipeline-unclear-v2-wallet-journey.json). This was not a MetaMask-extension walkthrough.\n`);
console.log(JSON.stringify({status:"LIVE_PROOF_PUBLISHED",verifiedAt:m.verifiedAt}));
