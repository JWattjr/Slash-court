// Public production inspection: no wallet, no interception, no synthetic RPC.
import {chromium} from "../../bullseye/node_modules/playwright/index.mjs";
import {mkdir,writeFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
import assert from "node:assert/strict";
const origin=process.env.PIPELINE_PRODUCTION_ORIGIN||"https://slash-court.vercel.app";
const revision=process.env.PIPELINE_PRODUCTION_REVISION;
assert.match(revision||"",/^[0-9a-f]{40}$/, "Supply the exact deployed frontend revision");
const output=new URL("../docs/pipeline-production/",import.meta.url);await mkdir(output,{recursive:true});
const browser=await chromium.launch({headless:true,executablePath:process.env.PLAYWRIGHT_EXECUTABLE||"C:/Users/User/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe"});
const results=[];
try{
 for(const viewport of[{width:1440,height:960},{width:390,height:844}]){
  const page=await browser.newPage({viewport});const errors=[];page.on("pageerror",error=>errors.push(error.message));
  for(const [id,outcome,verdicts]of[
   ["pipeline-b-fault-v2","PIPELINE_FAULT",["FAITHFUL","VIOLATION","FAITHFUL"]],
   ["pipeline-a-fault-v2","PIPELINE_FAULT",["VIOLATION","FAITHFUL","FAITHFUL"]],
   ["pipeline-faithful-v2","NO_PIPELINE_FAULT",["FAITHFUL","FAITHFUL","FAITHFUL"]],
   ["pipeline-unclear-v2",null,["UNCLEAR","VIOLATION","FAITHFUL"]]]){
   await page.goto(`${origin}/pipeline#case=${id}`);
   const heading=page.getByRole("heading",{name:new RegExp(`^${id}:`)});await heading.waitFor({timeout:60000});
   const actual=await heading.textContent();if(outcome)assert.equal(actual,`${id}: ${outcome}`);else assert(actual.includes("VOID"));
   const rows=page.getByRole("list",{name:"Ordered pipeline assessment"}).locator(":scope > li");
   await rows.nth(2).getByText(verdicts[2],{exact:true}).waitFor({timeout:30000});
   for(let i=0;i<3;i++)assert.equal(await rows.nth(i).locator("strong").first().textContent(),verdicts[i]);
   assert.equal(await page.locator("[data-source-revision]").getAttribute("data-source-revision"),revision);
   assert.equal(await page.evaluate(()=>typeof window.ethereum),"undefined","Public inspection must work wallet-free");
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),"Horizontal overflow");
   await page.screenshot({path:fileURLToPath(new URL(`${id}-${viewport.width}.png`,output)),fullPage:true});
   results.push({id,viewport,outcome:actual,walletRequired:false,sourceRevision:revision});
  }
  assert.deepEqual(errors,[]);await page.close();
 }
 const response=await fetch(`${origin}/pipeline-proof.json`);assert(response.ok);
 const proof=await response.json();assert.equal(proof.status,"LIVE_PASS");assert.equal(proof.chainId,61999);
 await writeFile(new URL("results.json",output),JSON.stringify({status:"PASS",observedAt:new Date().toISOString(),origin,sourceRevision:revision,realRpc:true,results},null,2));
 console.log(JSON.stringify({status:"PASS",publicCaseViews:results.length,realRpc:true,sourceRevision:revision}));
}finally{await browser.close();}
