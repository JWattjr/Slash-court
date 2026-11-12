// Real production RPC; click all six cases in one desktop session, wallet-free.
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
 const viewport={width:1440,height:960};
 const page=await browser.newPage({viewport});const errors=[];page.on("pageerror",error=>errors.push(error.message));
 await page.goto(`${origin}/pipeline`);
 for(const [id,outcome]of[
  ["pipeline-subjective-v2","REJECTED"],
  ["pipeline-b-fault-v2","PIPELINE_FAULT"],
  ["pipeline-a-fault-v2","PIPELINE_FAULT"],
  ["pipeline-faithful-v2","NO_PIPELINE_FAULT"],
  ["pipeline-unclear-v2","VOID_EARLIER_UNCERTAINTY"],
  ["pipeline-history-price-v2","FUNDING"]]){
  await page.getByRole("button",{name:id,exact:true}).click({timeout:60000});
  const heading=page.getByRole("heading",{name:`${id}: ${outcome}`,exact:true});
  await heading.waitFor({timeout:60000});
  assert(await page.getByRole("button",{name:"Refresh",exact:true}).isEnabled(),`${id}: loading must end`);
  assert.equal(await page.locator("[data-source-revision]").getAttribute("data-source-revision"),revision);
  assert.equal(await page.evaluate(()=>typeof window.ethereum),"undefined");
  assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),"Horizontal overflow");
  await page.screenshot({path:fileURLToPath(new URL(`${id}-1440.png`,output)),fullPage:true});
  results.push({id,viewport,outcome,selectedThroughCaseButton:true,loadingEnded:true,walletRequired:false});
 }
 assert.deepEqual(errors,[]);
 const response=await fetch(`${origin}/pipeline-proof.json`);assert(response.ok);
 const proof=await response.json();assert.equal(proof.status,"LIVE_PASS");assert.equal(proof.chainId,61999);
 await writeFile(new URL("results.json",output),JSON.stringify({status:"PASS",scope:"Desktop only; mobile out of scope",observedAt:new Date().toISOString(),origin,sourceRevision:revision,realRpc:true,results},null,2));
 console.log(JSON.stringify({status:"PASS",desktopCaseClicks:results.length,sourceRevision:revision}));
}finally{await browser.close();}
