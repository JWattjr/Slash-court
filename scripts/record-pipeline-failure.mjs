// Offline analysis of saved public receipts. Never submits a transaction.
import {readFile,writeFile} from "node:fs/promises";
import {abi} from "genlayer-js";
const file=new URL("../deploy/pipeline-2026-11-11.json",import.meta.url);
const m=JSON.parse(await readFile(file,"utf8"));
const t=m.transactions.find(t=>t.label==="pipeline-faithful-v2:adjudicate");
if(process.argv.includes("--refresh")){
 const response=await fetch("https://studio.genlayer.com/api",{method:"POST",headers:{"Content-Type":"application/json","User-Agent":"Mozilla/5.0 SlashCourt failure verifier"},body:JSON.stringify({jsonrpc:"2.0",id:1,method:"eth_getTransactionByHash",params:[t.hash]})});
 if(!response.ok)throw new Error(`RPC HTTP ${response.status}`);
 const payload=await response.json();if(payload.error||!payload.result)throw new Error("Missing current receipt");
 t.previousTerminalObservation??=t.receipt;t.receipt=payload.result;
}
if(!["UNDETERMINED","FINALIZED"].includes(t?.receipt?.status)||t.receipt.result_name!=="MAJORITY_DISAGREE")throw new Error("Saved terminal receipt does not demonstrate this failure");
const norm=v=>v instanceof Map?Object.fromEntries([...v].map(([k,x])=>[k,norm(x)])):Array.isArray(v)?v.map(norm):typeof v==="bigint"?v.toString():v;
const rounds=t.receipt.consensus_history.consensus_results.map((r,i)=>{
 try{
  const assessment=norm(abi.calldata.decode(Buffer.from(r.leader_result[0].eq_outputs["0"],"base64").subarray(1)));
  return{round:i,assessment,votes:r.validator_results.map(v=>v.vote)};
 }catch{return{round:i,error:"Leader failed local assessment validation",votes:r.validator_results.map(v=>v.vote)};}
});
const withoutQuotes=assessment=>({...assessment,steps:assessment.steps.map(({quote,...row})=>row)});
const valid=rounds.filter(r=>r.assessment);
const sameExceptQuotes=valid.every(r=>JSON.stringify(withoutQuotes(r.assessment))===JSON.stringify(withoutQuotes(valid[0].assessment)));
m.status="STOPPED_UNEXPECTED";
m.blocker={label:t.label,hash:t.hash,status:t.receipt.status,consensusResult:t.receipt.result_name,previouslyObservedStatus:t.previousTerminalObservation?.status||"UNDETERMINED",observedAt:new Date().toISOString(),
 message:"All-faithful transaction failed protocol consensus. Three successful leader assessments have identical verdicts and observations but different valid quotes; full-envelope comparison makes citation selection a liveness risk. One other leader failed local assessment validation.",
 sameSuccessfulLeaderAssessmentsExceptQuotes:sameExceptQuotes,unclearCaseRun:false,rerun:false,productionPromoted:false};
await writeFile(file,JSON.stringify(m,null,2)+"\n");
await writeFile(new URL("../docs/pipeline-live/faithful-failure-analysis.json",import.meta.url),JSON.stringify({...m.blocker,rounds},null,2)+"\n");
console.log(JSON.stringify(m.blocker,null,2));
