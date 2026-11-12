// Bounded StudioNet-only release. Each intent/hash persists before polling.
// Signing uses the existing account helper inside this process; no key is logged.
import {readFile,writeFile,mkdir} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
import {createClient} from "genlayer-js";
import {studionet} from "genlayer-js/chains";
import {privateKeyToAccount} from "viem/accounts";
import {reserveDeposit} from "./pipeline-budget.mjs";
import {explorerContract,explorerTransaction} from "../frontend/lib/pipeline/explorer.mjs";
import {prepareCapture} from "./pipeline-capture.mjs";

const FILE=new URL("../deploy/pipeline-2026-11-11.json",import.meta.url);
const ROOT=new URL("../",import.meta.url);
const HELPER="C:/Users/User/Desktop/Intelligent Contracts/release/credential_key.mjs";
const aliases={A:"moment-grid-studionet",B:"portal-five-release",C:"portal-five-release-new",claimant:"footnote-independent-studionet"};
const stringify=v=>JSON.stringify(v,(_,x)=>typeof x==="bigint"?x.toString():x,2)+"\n";
let manifest=JSON.parse(await readFile(FILE,"utf8"));
const save=()=>writeFile(FILE,stringify(manifest));
const fetchOriginal=globalThis.fetch;
globalThis.fetch=(url,options={})=>fetchOriginal(url,{...options,headers:{...Object.fromEntries(new Headers(options.headers)),"User-Agent":"Mozilla/5.0 SlashCourt Pipeline StudioNet release"}});
const rpc=async(method,params)=>{
  let res;
  for(let attempt=0;attempt<3;attempt++){
    res=await fetch("https://studio.genlayer.com/api",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params}),signal:AbortSignal.timeout(30000)});
    if(![502,503,504].includes(res.status)||attempt===2)break;
    await new Promise(resolve=>setTimeout(resolve,5000*(attempt+1)));
  }
  if(!res.ok)throw new Error(`RPC HTTP ${res.status}; stop and resume saved hashes`);
  const payload=await res.json();if(payload.error)throw new Error(`RPC ${method}: ${JSON.stringify(payload.error)}`);return payload.result;
};
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const git=(...args)=>execFileSync("git",["-c","safe.directory=*",...args],{cwd:ROOT,encoding:"utf8"}).trim();
const sourceBytes=path=>execFileSync("git",["-c","safe.directory=*","show",`${manifest.sourceRevision}:${path}`],{cwd:ROOT});
let capture=null;
if(Number(BigInt(await rpc("eth_chainId",[])))!==61999)throw new Error("StudioNet required");
if(manifest.status==="STOPPED_UNEXPECTED")throw new Error("Saved failed live case requires owner review; never rerun it");
const clients={};
for(const[role,alias]of Object.entries(aliases)){
  const secret=execFileSync("node",[HELPER,alias],{encoding:"utf8",stdio:["ignore","pipe","pipe"]}).trim();
  const account=privateKeyToAccount(secret);
  clients[role]=createClient({chain:studionet,endpoint:"https://studio.genlayer.com/api",account});
}
const actors=Object.fromEntries(Object.entries(clients).map(([k,c])=>[k,c.account.address]));
if(new Set(Object.values(actors).map(a=>a.toLowerCase())).size!==4)throw new Error("Distinct test accounts required");
manifest.participants=actors;
manifest.transactions??=[];
manifest.cases??=[];
manifest.depositAuthorization="Owner approved cumulative 0.1 StudioNet GEN on 2026-11-12";
manifest.depositCapWei="100000000000000000";
const object=v=>typeof v==="string"?JSON.parse(v):v;
const read=async(role,method,args=[])=>{
  for(let attempt=0;attempt<3;attempt++){
    try{return object(await clients.claimant.readContract({address:manifest.contracts[role].address,functionName:method,args}));}
    catch(error){
      if(attempt===2||!/fetch failed|ECONNRESET|502|503|504|timed out/i.test(String(error)))throw error;
      await sleep(3000*(attempt+1));
    }
  }
};
async function wait(entry){
  if(!entry.hash)throw new Error(`Uncertain submission ${entry.label}; inspect before any resend`);
  if(entry.receipt?.status==="FINALIZED"&&entry.receipt.result_name==="MAJORITY_AGREE"&&entry.receipt.consensus_data?.leader_receipt?.[0]?.execution_result==="SUCCESS")return entry.receipt;
  const until=Date.now()+12*60_000;
  while(Date.now()<until){
    const tx=await rpc("eth_getTransactionByHash",[entry.hash]);
    if(tx){
      entry.receipt=tx;entry.observedStatuses??=[];
      if(!entry.observedStatuses.includes(tx.status)){entry.observedStatuses.push(tx.status);console.log(entry.label,tx.status,entry.hash);}
      await save();
      if(entry.label==="native-credit-child"&&tx.status==="FINALIZED"){
        if(tx.type!==0||tx.consensus_data!==null||typeof tx.value_credited!=="boolean")throw new Error("Native transfer receipt is incomplete");
        return tx;
      }
      if(["ACCEPTED","FINALIZED"].includes(tx.status)){
        const execution=tx.consensus_data?.leader_receipt?.[0]?.execution_result;
        if(execution!=="SUCCESS"||tx.result_name!=="MAJORITY_AGREE"){manifest.status="STOPPED_UNEXPECTED";await save();throw new Error(`${entry.label} execution ${execution}; consensus ${tx.result_name}; saved receipt`);}
        if(tx.status==="ACCEPTED"&&capture&&entry.method==="adjudicate"&&!manifest.appealCapture){
          manifest.appealCapture=await capture.capture(entry.hash);await save();
        }
        if(tx.status==="FINALIZED")return tx;
      }
      if(["CANCELED","UNDETERMINED"].includes(tx.status)){
        manifest.status="STOPPED_UNEXPECTED";
        manifest.blocker={label:entry.label,hash:entry.hash,status:tx.status,observedAt:new Date().toISOString(),message:"Failed bounded live case; no automatic rerun or production promotion"};
        await save();throw new Error(`Unexpected terminal ${tx.status}`);
      }
    }
    await sleep(5000);
  }
  throw new Error(`Timeout; resume saved hash ${entry.hash}`);
}
async function operation(label,actor,role,method,args=[],value=0n){
  let entry=manifest.transactions.find(t=>t.label===label);
  if(!entry){
    entry={label,actor,role,method,args,startedAt:new Date().toISOString()};
    reserveDeposit(manifest,entry,value);
    manifest.transactions.push(entry);await save();
    const hash=method==="__deploy__"
      ?await clients[actor].deployContract({code:sourceBytes(`contracts/${args[0]}.py`),args:args.slice(1)})
      :await clients[actor].writeContract({address:manifest.contracts[role].address,functionName:method,args,value});
    entry.hash=String(hash);entry.explorer=explorerTransaction(entry.hash);await save();console.log("SAVED",label,entry.hash);
    if(capture&&method==="adjudicate")await capture.retain(entry.hash);
  }
  const tx=await wait(entry);
  return {entry,tx};
}
async function until(readFn,predicate,label){
  const end=Date.now()+6*60_000;
  while(Date.now()<end){const value=await readFn();if(predicate(value))return value;await sleep(6000);}
  throw new Error(`${label}: callback/readback timeout; do not repeat original write`);
}
if(process.argv.includes("--deploy")){
  manifest.sourceRevision??=git("rev-parse","HEAD");
  for(const[role,file,args]of[["record","operator_record",[]],["charter","pipeline_charter",[]],["court","pipeline_court",[manifest.contracts.charter?.address]]]){
    if(role==="court")args[0]=manifest.contracts.charter.address;
    if(!manifest.contracts[role]){
      const{tx,entry}=await operation(`deploy-${role}`,"A",role,"__deploy__",[file,...args]);
      const address=tx.data?.contract_address||tx.to_address;
      if(!/^0x[0-9a-fA-F]{40}$/.test(address))throw new Error("Missing deployed address");
      const bytes=Buffer.from(await rpc("gen_getContractCode",[address]),"base64");
      const local=sourceBytes(`contracts/${file}.py`);
      if(!bytes.equals(local))throw new Error("Deployed source mismatch");
      manifest.contracts[role]={address,explorer:explorerContract(address),sourcePath:`contracts/${file}.py`,sourceSha256:createHash("sha256").update(bytes).digest("hex"),deploymentHash:entry.hash};await save();
    }
  }
  await operation("bind-charter","A","charter","bind",[manifest.contracts.court.address,manifest.contracts.record.address]);
  await operation("bind-record","A","record","bind",[manifest.contracts.charter.address,manifest.contracts.court.address]);
  const binding=await read("charter","get_bindings");if(!binding.bound)throw new Error("Charter binding failed");
  const recordBinding=await read("record","get_bindings");if(!recordBinding.bound)throw new Error("Record binding failed");
  manifest.status="DEPLOYED_CASES_PENDING";await save();
  await writeFile(new URL("../frontend/lib/pipeline/deployment.json",import.meta.url),stringify({status:"DEPLOYED_CASES_PENDING",chainId:61999,...Object.fromEntries(Object.entries(manifest.contracts).map(([k,v])=>[k,v.address])),sourceRevision:manifest.sourceRevision,proofPath:"/pipeline-proof.json"}));
  console.log("DEPLOYMENT_VERIFIED",JSON.stringify(manifest.contracts));
}else if(process.argv.includes("--cases")){
  if(!manifest.faithfulFixture)throw new Error("Publish and verify the faithful fixture before seeding");
  const evidence=JSON.parse(await readFile(new URL("../fixtures/pipeline-source-evidence.json",import.meta.url),"utf8"));
  const DUTIES={
    A:"EXTRACT: output CSV columns record_id,display_name,region,contact_email; preserve row order and all non-contact fields. Replace EVERY received contact_email with [REDACTED].",
    B:"TRANSFORM: preserve header, row order and record_id; uppercase display_name and region; preserve contact_email EXACTLY as received. Never introduce or restore email values absent from received input. No independent redaction duty.",
    C:"PUBLISH: reproduce the complete received CSV dataset byte-for-byte without adding, deleting, correcting or filtering anything. No independent redaction duty."
  };
  const policy="Each stage performs its own distinct local duty on the input it received. A alone redacts source email addresses. B uppercases names and regions and preserves contact values exactly as received. C exports received CSV without alteration. Faithful propagation of inherited bad values is allowed where correction was not assigned. No operator may introduce or restore email values absent from its own received input.";
  const fixture=(incident,step,side)=>evidence.fixtures.find(f=>f.path===`${incident}/${step}-${side}.txt`);
  function plan(id,kind){
    let p=manifest.cases.find(c=>c.id===id);if(p)return p;
    const now=Math.floor(Date.now()/1000);
    const durations=manifest.transactions.filter(t=>t.method==="__deploy__").map(t=>(Date.parse(t.receipt?.timestamp||t.receipt?.created_at||t.startedAt)-Date.parse(t.startedAt))/1000);
    const window=Math.max(450,Math.min(1200,Math.ceil(Math.max(0,...durations)*12+120)));
    p={id,kind,synthetic:true,baseBond:10,filingBond:3,fundingDeadline:now+window,evidenceDeadline:now+window+180,deadline:now+window+540,shortDemoDeadlines:true};
    manifest.cases.push(p);return p;
  }
  async function compile(p,rejected=false){
    const steps=["A","B","C"].map(step_id=>({step_id,operator:actors[step_id],duty:rejected&&step_id==="A"?"Make the dataset beautiful and impressive to everyone":DUTIES[step_id]}));
    await operation(`${p.id}:compile`,"claimant","charter","compile",[p.id,policy,JSON.stringify(steps),10,3,p.fundingDeadline,p.evidenceDeadline,p.deadline]);
    const job=await until(()=>read("charter","get_job",[p.id]),j=>["FUNDING","ACTIVE","DISPUTED","SETTLING","FINAL","REJECTED"].includes(j.status),"compile finality");
    if((job.status==="REJECTED")!==rejected){manifest.status="STOPPED_UNEXPECTED";p.unexpected=job;await save();throw new Error("Unexpected charter compilation; stop without prompt variants");}
    p.compiled=job;p.rejected=rejected;await save();return job;
  }
  const rejected=plan("pipeline-subjective-v2","rejected");await save();await compile(rejected,true);
  for(const kind of["b-fault","a-fault","faithful","unclear"]){
    const p=plan(`pipeline-${kind}-v2`,kind);await save();const job=await compile(p);
    if(p.final&&p.recordProfiles&&(kind!=="b-fault"||manifest.nativeCreditVerified))continue;
    for(const role of["A","B","C"]){const step=job.steps.find(s=>s.step_id===role);await operation(`${p.id}:deposit-${role}`,role,"charter","deposit",[p.id],BigInt(step.bond_units));}
    await until(()=>read("charter","get_job",[p.id]),j=>["ACTIVE","DISPUTED","SETTLING","FINAL"].includes(j.status),"all deposit finality callbacks");
    for(const role of["A","B","C"]){
      const incident=kind==="a-fault"?"incident-a":"incident-b";
      let input=fixture(incident,role,"input"),output=fixture(incident,role,"output");
      if(kind==="faithful"&&role==="B")output={raw_url:manifest.faithfulFixture.url,sha256:manifest.faithfulFixture.sha256};
      if(kind==="faithful"&&role==="C")input=output={raw_url:manifest.faithfulFixture.url,sha256:manifest.faithfulFixture.sha256};
      if(kind==="unclear"&&role==="A")input={raw_url:input.raw_url.replace("A-input.txt","missing-A-input.txt"),sha256:input.sha256};
      await operation(`${p.id}:record-${role}`,role,"charter","record_step",[p.id,role,input.raw_url,output.raw_url,input.sha256,output.sha256]);
    }
    while(Date.now()/1000<p.evidenceDeadline){console.log("WAIT_EVIDENCE_DEADLINE",p.id,Math.ceil(p.evidenceDeadline-Date.now()/1000));await sleep(Math.min(30_000,p.evidenceDeadline*1000-Date.now()));}
    await operation(`${p.id}:file`,"claimant","charter","file_incident",[p.id,"Synthetic incident. Judge each operator only against its own frozen duty and the input it actually received."],3n);
    if(!manifest.appealCapture)capture=await prepareCapture(clients.claimant.account,Object.fromEntries(Object.entries(manifest.contracts).map(([k,v])=>[k,v.address])),p.id);
    try{const {entry}=await operation(`${p.id}:adjudicate`,"claimant","court","adjudicate",[p.id]);p.adjudicationHash=entry.hash;}
    finally{if(capture){await capture.close();capture=null;}}
    const judged=await until(()=>read("court","get_case",[p.id]),c=>c.finalized,"adjudication finality callback");
    const expected=kind==="b-fault"?["FAITHFUL","VIOLATION","FAITHFUL"]:kind==="a-fault"?["VIOLATION","FAITHFUL","FAITHFUL"]:kind==="faithful"?["FAITHFUL","FAITHFUL","FAITHFUL"]:["UNCLEAR","VIOLATION","FAITHFUL"];
    const actual=judged.assessment.steps.map(s=>s.effective_verdict);p.assessment=judged;
    if(JSON.stringify(actual)!==JSON.stringify(expected)){p.unexpected=judged;manifest.status="STOPPED_UNEXPECTED";await save();throw new Error("Unexpected live assessment; no rerun");}
    if(kind==="unclear")while(Date.now()/1000<p.deadline){console.log("WAIT_REFUND_DEADLINE",p.id);await sleep(Math.min(30_000,p.deadline*1000-Date.now()));}
    const {entry}=await operation(`${p.id}:settle`,"claimant","charter","settle",[p.id]);p.settlementHash=entry.hash;
    p.final=await until(()=>read("charter","get_job",[p.id]),j=>j.status==="FINAL","settlement finality callback");p.outcome=p.final.outcome;
    await until(()=>read("record","has_record",[p.id]),v=>v===true,"finalized operator record");
    p.recordProfiles={};for(const role of["A","B","C"])p.recordProfiles[role]=await read("record","get_operator",[actors[role]]);
    if(kind==="b-fault"){
      const next=plan("pipeline-history-price-v2","pricing");await save();const priced=await compile(next);next.higherBondVerified=priced.steps.find(s=>s.step_id==="B").bond_units===20;
      if(!next.higherBondVerified)throw new Error("Fault history bond multiplier not applied");
      const {entry:claim}=await operation(`${p.id}:native-claim`,"claimant","charter","claim",[p.id,actors.claimant.toLowerCase(),1]);
      p.nativeClaimHash=claim.hash;
      const parent=await rpc("eth_getTransactionByHash",[claim.hash]);
      if(parent.triggered_transactions?.length!==1)throw new Error("Native child missing");
      const child={hash:parent.triggered_transactions[0],label:"native-credit-child"};await wait(child);
      if(child.receipt.value_credited!==true)throw new Error("Native child credit not proven");
      const {entry:verification}=await operation(`${p.id}:verify-claim`,"claimant","charter","verify_claim",[p.id,actors.claimant.toLowerCase(),claim.hash]);
      await until(()=>read("charter","get_job",[p.id]),j=>j.claims[actors.claimant.toLowerCase()]?.status==="paid","native verification finality");
      manifest.nativeCreditVerified=true;manifest.nativeCredit={claimHash:claim.hash,verificationHash:verification.hash,childHash:child.hash,receipt:child.receipt,amountWei:child.receipt.value};await save();
    }
    await save();
  }
  manifest.status="LIVE_CASES_COMPLETE_VERIFICATION_PENDING";await save();console.log("ALL_REQUIRED_CASES_FINALIZED");
}else if(process.argv.includes("--refund-proof")){
  if(manifest.nativeRefundCredit?.verified){console.log("REFUND_ALREADY_VERIFIED");process.exit(0);}
  const p=manifest.cases.find(c=>c.kind==="unclear");
  if(!p?.final||!p.outcome.startsWith("VOID"))throw new Error("Finalize the earlier-uncertainty refund before claiming it");
  const recipient=actors.A.toLowerCase();
  const label=`${p.id}:refund-claim`;
  let claim=manifest.transactions.find(t=>t.label===label);
  if(!claim){
    claim={label,actor:"claimant",role:"charter",method:"claim",args:[p.id,recipient,1],startedAt:new Date().toISOString(),submittedThroughActualUI:true};
    reserveDeposit(manifest,claim,0n);manifest.transactions.push(claim);await save();
    const journey=await prepareCapture(clients.claimant.account,Object.fromEntries(Object.entries(manifest.contracts).map(([k,v])=>[k,v.address])),p.id);
    try{claim.hash=await journey.submitClaim(recipient);claim.explorer=explorerTransaction(claim.hash);await save();}
    finally{await journey.close();}
  }
  await wait(claim);
  const parent=await rpc("eth_getTransactionByHash",[claim.hash]);
  if(parent.triggered_transactions?.length!==1)throw new Error("Refund native child missing");
  const child={hash:parent.triggered_transactions[0],label:"native-credit-child"};await wait(child);
  if(child.receipt.value_credited!==true||child.receipt.to_address.toLowerCase()!==recipient)throw new Error("Refund native credit not proven");
  const {entry:verification}=await operation(`${p.id}:verify-refund`,"claimant","charter","verify_claim",[p.id,recipient,claim.hash]);
  const job=await until(()=>read("charter","get_job",[p.id]),j=>j.claims[recipient]?.status==="paid","refund verification callback");
  manifest.nativeRefundCredit={verified:true,recipient,claimHash:claim.hash,childHash:child.hash,verificationHash:verification.hash,amountWei:child.receipt.value,receipt:child.receipt,triggeredByNonRecipient:true};
  p.final=job;await save();console.log("NATIVE_REFUND_VERIFIED",claim.hash);
}else throw new Error("Use --deploy, --cases or --refund-proof; no implicit writes");
