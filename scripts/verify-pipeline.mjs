// Read-only: no account, signer, writeContract, or transaction submission.
import {readFile} from "node:fs/promises";
import assert from "node:assert/strict";
import {createHash} from "node:crypto";
import {createClient} from "genlayer-js";
import {studionet} from "genlayer-js/chains";
import {verifyExplorer} from "../frontend/lib/pipeline/explorer.mjs";

const fetchOriginal = globalThis.fetch;
globalThis.fetch = (url, options = {}) => fetchOriginal(url, {...options, headers: {...Object.fromEntries(new Headers(options.headers)), "User-Agent": "Mozilla/5.0 SlashCourt Pipeline verification"}});
const client = createClient({chain: studionet, endpoint: "https://studio.genlayer.com/api"});
const read = (address, functionName, args = []) => client.readContract({address, functionName, args, transactionHashVariant:"latest-final"});
const plain = value => JSON.parse(JSON.stringify(value, (_, v) => typeof v === "bigint" ? v.toString() : v));
const object = value => typeof value === "string" ? JSON.parse(value) : plain(value);
const manifest = JSON.parse(await readFile(new URL("../deploy/pipeline-2026-11-12.json", import.meta.url), "utf8"));
const partial=process.argv.includes("--partial");
const rpcTransaction = async hash => {
  const response=await fetch("https://studio.genlayer.com/api",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({jsonrpc:"2.0",id:1,method:"eth_getTransactionByHash",params:[hash]})});
  assert(response.ok,`RPC HTTP ${response.status}`);
  const payload=await response.json();assert(!payload.error);assert(payload.result,`Missing receipt ${hash}`);return payload.result;
};

async function originalRegression() {
  const {court, vault} = manifest.originalDeployment;
  await verifyExplorer("contract", court);
  await verifyExplorer("contract", vault);
  const configuration = object(await read(vault, "get_vault_configuration"));
  const rulebook = object(await read(court, "get_current_rulebook"));
  const caseOne = object(await read(court, "get_case", ["case-1"]));
  assert.equal(String(configuration.slash_court || configuration.court_address || configuration.court).toLowerCase(), court.toLowerCase(), "original Vault binding");
  assert.equal(Number(rulebook.version), 1);
  assert.equal(caseOne.adjudication_finalized, true);
  return {status: "PASS", court, vault, case: "case-1", rulebookVersion: 1};
}

if (process.argv.includes("--original-only")) {
  console.log(JSON.stringify(await originalRegression(), null, 2));
} else {
  assert.equal(manifest.chainId, 61999);
  assert(["LIVE_PASS","LIVE_CASES_COMPLETE_VERIFICATION_PENDING",...(partial?["STOPPED_UNEXPECTED"]:[])].includes(manifest.status), "Milestone has no completed live case run; local checks cannot establish readiness");
  assert.match(manifest.sourceRevision, /^[0-9a-f]{40}$/);
  assert(BigInt(manifest.depositsUsedWei) <= BigInt(manifest.depositCapWei));
  const previous=JSON.parse(await readFile(new URL("../"+manifest.previousAttempt.manifest,import.meta.url),"utf8"));
  const prior=(previous.transactions||[]).reduce((n,t)=>n+BigInt(t.reservedValueWei||0),BigInt(previous.priorDepositsUsedWei||0));
  assert.equal(prior,BigInt(manifest.priorDepositsUsedWei));
  assert.equal(prior+manifest.transactions.reduce((n,t)=>n+BigInt(t.reservedValueWei||0),0n),BigInt(manifest.depositsUsedWei));
  assert.equal(previous.timeoutRecovery?.verified,true);
  for(const t of previous.transactions.filter(t=>t.label.startsWith("recovery-faithful:")))await verifyExplorer("transaction",t.hash);
  for(const claim of Object.values(previous.timeoutRecovery.claims))await verifyExplorer("transaction",claim.childHash);
  for (const [name, contract] of Object.entries(manifest.contracts)) {
    await verifyExplorer("contract", contract.address);
    const source = await client.getContractCode(contract.address);
    const bytes = Buffer.from(source,"utf8");
    assert.equal(createHash("sha256").update(bytes).digest("hex"), contract.sourceSha256, `${name} deployed source mismatch`);
  }
  const bindings = object(await read(manifest.contracts.charter.address, "get_bindings"));
  assert.equal(bindings.bound, true);
  assert.equal(bindings.court.toLowerCase(), manifest.contracts.court.address.toLowerCase());
  assert.equal(bindings.record.toLowerCase(), manifest.contracts.record.address.toLowerCase());
  const recordBinding=object(await read(manifest.contracts.record.address,"get_bindings"));
  assert.equal(recordBinding.charter.toLowerCase(),manifest.contracts.charter.address.toLowerCase());
  assert.equal(recordBinding.court.toLowerCase(),manifest.contracts.court.address.toLowerCase());
  for (const transaction of manifest.transactions) {
    await verifyExplorer("transaction", transaction.hash);
    const tx=await rpcTransaction(transaction.hash);
    if(partial&&transaction.hash===manifest.blocker?.hash){assert(["UNDETERMINED","FINALIZED"].includes(tx.status));assert.equal(tx.result_name,"MAJORITY_DISAGREE");assert.deepEqual(tx.triggered_transactions,[]);continue;}
    assert.equal(tx.status,"FINALIZED", `${transaction.hash}: protocol not finalized`);
    assert.equal(tx.result_name,"MAJORITY_AGREE", `${transaction.hash}: successful leader execution is not consensus acceptance`);
    const raw = tx.consensus_data?.leader_receipt?.[0];
    assert(raw?.execution_result === "SUCCESS" || tx.txExecutionResultName === "SUCCESS", `${transaction.hash}: execution not verified`);
  }
  const accountingReadbacks=[];
  for (const proof of manifest.cases) {
    const job = object(await read(manifest.contracts.charter.address, "get_job", [proof.id]));
    accountingReadbacks.push({id:proof.id,job});
    if(proof.kind==="pricing"){
      assert(job.steps.find(s=>s.step_id==="B").bond_units>=20,"higher history price missing");continue;
    }
    if(partial&&!proof.rejected&&!proof.final){
      assert.equal(proof.id,"pipeline-faithful-v2");assert.equal(job.status,"DISPUTED");
      assert.deepEqual(job.credits,{},"undetermined judgment must not allocate penalties");continue;
    }
    assert.equal(job.status, proof.rejected ? "REJECTED" : "FINAL");
    if (!proof.rejected) {
      assert.equal(job.outcome, proof.outcome);
      assert.equal(Object.values(job.credits).reduce((n, v) => n + BigInt(v), 0n), Object.values(job.deposits).reduce((n, v) => n + BigInt(v), BigInt(job.filing_paid)));
      const expected={...job.deposits};
      if(["b-fault","a-fault"].includes(proof.kind)){
        const index=proof.kind==="b-fault"?1:0;
        assert.equal(job.liable_index,index);
        const operator=job.steps[index].operator;
        expected[job.incident.claimant]=expected[operator]+job.filing_paid;delete expected[operator];
      }else if(proof.kind==="faithful"){
        job.steps.forEach((s,i)=>{expected[s.operator]+=Math.floor(job.filing_paid*(i+1)/job.steps.length)-Math.floor(job.filing_paid*i/job.steps.length);});
      }else{assert.equal(job.liable_index,null);expected[job.incident.claimant]=job.filing_paid;}
      assert.deepEqual(job.credits,expected,`${proof.id}: exact slash/refund allocation`);
      const adjudication=manifest.transactions.find(t=>t.label===`${proof.id}:adjudicate`).receipt;
      const settlement=manifest.transactions.find(t=>t.label===`${proof.id}:settle`).receipt;
      assert(Date.parse(settlement.created_at)/1000>=adjudication.consensus_history.current_monitoring.FINALIZED,"settlement preceded adjudication finality");
      if(proof.kind==="unclear")assert(job.settled_at>=job.deadline,"unclear refund preceded deadline");
      const live=object(await read(manifest.contracts.court.address,"get_case",[proof.id]));
      assert.equal(live.finalized,true);
      assert.equal(live.charter_digest,job.digest,"frozen charter commitment");
      assert.deepEqual(live.assessment,proof.assessment.assessment);
      for(const step of live.assessment.steps){
        assert.equal(step.operator,job.steps[step.index].operator);
        assert.equal(step.step_id,job.steps[step.index].step_id);
        const texts=[];
        for(const side of ["input","output"]){
          const obs=step[side];if(obs.status!=="AVAILABLE")continue;
          assert.match(obs.url,/^https:\/\/raw\.githubusercontent\.com\/[^/]+\/[^/]+\/[0-9a-f]{40}\//);
          const fetched=await fetch(obs.url,{redirect:"error"});assert.equal(fetched.status,200);
          const body=Buffer.from(await fetched.arrayBuffer());assert.equal(createHash("sha256").update(body).digest("hex"),obs.committed_digest);
          texts.push(body.toString("utf8"));
        }
        if(step.evidence_status==="AVAILABLE")assert(texts.some(text=>text.includes(step.quote)),"quote not present in fetched evidence");
      }
      assert.equal(await read(manifest.contracts.record.address,"has_record",[proof.id]),true);
    }
  }
  assert.equal(manifest.cases.length >= 5, true, "all required live cases must be recorded");
  assert.equal(manifest.nativeCreditVerified, true, "native-credit proof missing");
  await verifyExplorer("transaction",manifest.nativeCredit.childHash);
  const child=await rpcTransaction(manifest.nativeCredit.childHash);
  assert.equal(child.status,"FINALIZED");assert.equal(child.value_credited,true);
  assert.equal(child.triggered_by,manifest.nativeCredit.claimHash);
  assert.equal(String(child.value),String(manifest.nativeCredit.amountWei));
  const awardCase=manifest.cases.find(c=>c.kind==="b-fault");
  const paidJob=object(await read(manifest.contracts.charter.address,"get_job",[awardCase.id]));
  assert.equal(paidJob.claims[manifest.participants.claimant.toLowerCase()].status,"paid");
  assert.equal(String(paidJob.paid[manifest.participants.claimant.toLowerCase()]),String(manifest.nativeCredit.amountWei));
  if(manifest.nativeRefundCredit){
    const refund=manifest.nativeRefundCredit;
    await verifyExplorer("transaction",refund.childHash);
    const receipt=await rpcTransaction(refund.childHash);
    assert.equal(receipt.status,"FINALIZED");assert.equal(receipt.value_credited,true);
    assert.equal(receipt.to_address.toLowerCase(),refund.recipient);
    assert.equal(receipt.triggered_by,refund.claimHash);
    const job=accountingReadbacks.find(c=>c.id==="pipeline-unclear-v2").job;
    assert.equal(job.claims[refund.recipient].status,"paid");
    assert.equal(String(job.paid[refund.recipient]),String(receipt.value));
  }
  for(const role of ["A","B","C"]){
    const profile=object(await read(manifest.contracts.record.address,"get_operator",[manifest.participants[role]]));
    assert.equal(profile.cases,partial?2:4);assert.equal(profile.voids,partial?0:1);
    assert.equal(profile.violations,role==="C"?0:1);
    assert.equal(profile.bond_multiplier,role==="C"?1:2);
    assert(profile.job_ids.length<=20);
  }
  assert.equal(manifest.appealCapture?.enabled,true,"real ACCEPTED-window capture missing");
  const capturedTx=manifest.transactions.find(t=>t.hash===manifest.appealCapture.hash);
  const history=capturedTx.receipt.consensus_history;
  const accepted=history.consensus_results.flatMap(r=>[r.monitoring?.ACCEPTED]).filter(Number.isFinite);
  const finalized=history.current_monitoring?.FINALIZED;
  const capturedAt=Date.parse(manifest.appealCapture.observedAt)/1000;
  assert(accepted.some(time=>time<=capturedAt)&&capturedAt<finalized,"capture was not inside the protocol ACCEPTED interval");
  assert.equal(manifest.appealCapture.appealSubmitted,false);
  console.log(JSON.stringify({status: partial?"PARTIAL_PASS_RELEASE_BLOCKED":"PASS", originalRegression: await originalRegression(), linksVerified: true,
    contractRecordsVerified:5,transactionRecordsVerified:manifest.transactions.length+1+(manifest.nativeRefundCredit?1:0),accountingReadbacks}));
}
