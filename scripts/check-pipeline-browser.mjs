// Headless workflow tests with explicitly mocked RPC. Never live proof.
import {chromium} from "../../bullseye/node_modules/playwright/index.mjs";
import {abi} from "genlayer-js";
import {fromRlp,fromHex} from "viem";
import {mkdir,writeFile,readFile} from "node:fs/promises";
import assert from "node:assert/strict";
import {fileURLToPath} from "node:url";
const output=new URL("../docs/pipeline-browser/",import.meta.url);await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE||"C:/Users/User/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe"});
const ADDRESS="0x"+"1".repeat(40),HASH="0x"+"a".repeat(64);
const deployment=JSON.parse(await readFile(new URL("../frontend/lib/pipeline/deployment.json",import.meta.url),"utf8"));
const historyKey="slashcourt:pipeline:61999:"+[
  process.env.NEXT_PUBLIC_PIPELINE_CHARTER||deployment.charter||"0x"+"1".repeat(40),
  process.env.NEXT_PUBLIC_PIPELINE_COURT||deployment.court||"0x"+"2".repeat(40),
  process.env.NEXT_PUBLIC_OPERATOR_RECORD||deployment.record||"0x"+"3".repeat(40)
].join(":");
const now=Math.floor(Date.now()/1000);
const job={id:"workflow-b",charter:"Synthetic workflow fixture: each step performs its frozen local duty.",digest:"f".repeat(64),
  steps:["A","B","C"].map((step_id,i)=>({step_id,operator:"0x"+String(i+1).repeat(40),duty:["Redact emails","Uppercase names, preserve contacts as received","Export received CSV unchanged"][i],bond_units:10})),
  status:"FINAL",rejection_reasons:[],deposits:Object.fromEntries([1,2,3].map(i=>["0x"+String(i).repeat(40),10])),
  credits:{[ADDRESS]:10},paid:{},claims:{},records:Object.fromEntries(["A","B","C"].map(s=>[s,{input_url:"https://raw.githubusercontent.com/JWattjr/genlayer-demo-evidence/"+"a".repeat(40)+`/${s}-input`,output_url:"https://raw.githubusercontent.com/JWattjr/genlayer-demo-evidence/"+"a".repeat(40)+`/${s}-output`}])),
  outcome:"PIPELINE_FAULT",liable_index:1,filing_bond:3,funding_deadline:now+300,evidence_deadline:now+600,deadline:now+900};
const result={outcome:"PIPELINE_FAULT",finalized:true,liable_index:1,assessment:{steps:job.steps.map((s,i)=>({...s,effective_verdict:i===1?"VIOLATION":"FAITHFUL",quote:"Verbatim synthetic workflow quote.",input:{url:job.records[s.step_id].input_url},output:{url:job.records[s.step_id].output_url}}))}};
const results=[];
try{
for(const viewport of[{width:1440,height:960},{width:390,height:844}]){
  const context=await browser.newContext({viewport});const page=await context.newPage();const errors=[];let failJob=false,holdJob=false;
  page.on("pageerror",e=>errors.push(e.message));
  await context.addInitScript(({address,hash,historyKey})=>{
    window.ethereum={isMetaMask:true,request:async({method})=>method==="eth_accounts"||method==="eth_requestAccounts"?[address]:method==="eth_chainId"?"0xf22f":null,on(){},removeListener(){}};
    localStorage.setItem(historyKey,JSON.stringify([{hash,kind:"adjudication",status:"ACCEPTED",execution:"SUCCESS",success:true,appealable:true,appealEligibility:"eligible",updatedAt:Date.now()}]));
  },{address:ADDRESS,hash:HASH,historyKey});
  await page.route("**/api",async route=>{
    const request=route.request().postDataJSON();let response;
    if(request.method==="gen_call"){
      const data=fromRlp(request.params[0].data,"hex")[0];const raw=abi.calldata.decode(fromHex(data,"bytes"));
      const call=raw instanceof Map?Object.fromEntries(raw):raw;
      const method=call.method||call[""];
      if(method==="get_job"&&holdJob){await new Promise(r=>setTimeout(r,1200));}
      if(method==="get_job"&&failJob){await route.fulfill({json:{jsonrpc:"2.0",id:request.id,error:{code:-32000,message:"workflow read unavailable"}}});return;}
      const value=method==="get_job_ids"?[job.id]:method==="get_job"?JSON.stringify(job):method==="get_case"?JSON.stringify(result):JSON.stringify({operator:ADDRESS,cases:1,violations:0,faithful_steps:1,voids:0,bond_multiplier:1});
      response=Buffer.from(abi.calldata.encode(value)).toString("hex");
    }else if(request.method==="eth_getTransactionByHash"){
      response={hash:HASH,status:"ACCEPTED",statusName:"ACCEPTED",txExecutionResultName:"SUCCESS",from:ADDRESS,to:ADDRESS,blockHash:null,blockNumber:null,transactionIndex:null,nonce:"0x0",value:"0x0",input:"0x",gas:"0x5208",gasPrice:"0x0",type:"0x0"};
    }else if(request.method==="eth_chainId")response="0xf22f";
    else throw new Error(`Unexpected workflow RPC ${request.method}`);
    await route.fulfill({json:{jsonrpc:"2.0",id:request.id,result:response}});
  });
  await page.goto((process.env.PIPELINE_BASE_URL||"http://127.0.0.1:3109")+"/pipeline#case=workflow-b");
  await page.getByRole("heading",{name:"workflow-b: PIPELINE_FAULT"}).waitFor();
  assert.equal(await page.getByRole("list",{name:"Ordered pipeline assessment"}).locator(":scope > li").count(),3);
  const appeal=page.getByRole("button",{name:"Appeal accepted adjudication"});await appeal.waitFor();assert(await appeal.isEnabled());
  assert.equal(await appeal.getAttribute("data-appeal-target"),HASH);
  await page.screenshot({path:fileURLToPath(new URL(`desktop-${viewport.width}.png`,output)),fullPage:true});
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),"horizontal viewport overflow");
  await page.getByRole("button",{name:"Add step",exact:true}).click();assert.equal(await page.locator("fieldset").count(),4);
  await page.getByRole("button",{name:"Remove last step",exact:true}).click();assert.equal(await page.locator("fieldset").count(),3);
  await page.getByText("Pull claim and native-credit verification",{exact:true}).click();
  await page.getByLabel("Recipient address",{exact:true}).fill(ADDRESS);
  assert(await page.getByRole("button",{name:"Reserve and send claim"}).isEnabled());
  holdJob=true;await page.getByRole("button",{name:"Refresh",exact:true}).click();
  assert(await appeal.isEnabled(),"background dashboard refresh must not disable an accepted appeal");
  await page.getByRole("button",{name:"Refresh",exact:true}).waitFor({state:"visible"});
  await page.waitForFunction(()=>!document.querySelector("button:disabled")?.textContent?.includes("Refreshing"));
  failJob=true;holdJob=false;
  await page.getByRole("button",{name:"Refresh",exact:true}).click();
  await page.getByRole("alert").filter({hasText:"Current charter/accounting unavailable"}).waitFor();
  assert.equal(await page.getByRole("button",{name:"Reserve and send claim"}).count(),0,"unavailable finances must remove financial controls");
  await page.reload();await appeal.waitFor();assert.equal(await appeal.getAttribute("data-appeal-target"),HASH);
  assert.deepEqual(errors,[]);
  results.push({viewport,status:"PASS",scope:"Mocked RPC UI workflow, not live consensus",checks:["ordered assessment","responsive overflow","builder","claim control","accepted retained hash","appeal during pending refresh","partial read fail-closed","reload recovery"]});
  await context.close();
}
await writeFile(new URL("results.json",output),JSON.stringify({checkedAt:new Date().toISOString(),results},null,2));
console.log(JSON.stringify(results));
}finally{await browser.close();}
