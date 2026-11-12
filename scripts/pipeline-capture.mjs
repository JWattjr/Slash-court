// Real RPC capture using the existing test account through an EIP-1193 bridge.
// No mocked chain responses, no private material enters the page, no appeal sent.
import {chromium} from "../../bullseye/node_modules/playwright/index.mjs";
import {createWalletClient,http} from "viem";
import {studionet} from "genlayer-js/chains";
import {mkdir,writeFile} from "node:fs/promises";
import {fileURLToPath} from "node:url";
export async function prepareCapture(account, addresses, jobId){
  const dir=new URL("../docs/pipeline-live/",import.meta.url);await mkdir(dir,{recursive:true});
  const browser=await chromium.launch({headless:true,executablePath:"C:/Users/User/AppData/Local/ms-playwright/chromium_headless_shell-1243/chrome-headless-shell-win64/chrome-headless-shell.exe"});
  const page=await browser.newPage({viewport:{width:1440,height:960}});
  const rpcURL="https://studio.genlayer.com/api";
  const wallet=createWalletClient({account,chain:studionet,transport:http(rpcURL,{fetchOptions:{headers:{"User-Agent":"Mozilla/5.0 SlashCourt test wallet"}}})});
  await page.exposeFunction("pipelineTestWallet",async({method,params=[]})=>{
    if(["eth_accounts","eth_requestAccounts"].includes(method))return[account.address];
    if(method==="eth_chainId")return"0xf22f";
    if(method==="eth_sendTransaction"){
      if(BigInt(params[0].value||0)!==0n)throw new Error("Capture wallet disallows deposits");
      const tx=params[0];
      return wallet.sendTransaction({account,chain:studionet,to:tx.to,data:tx.data,value:0n,
        ...(tx.gas?{gas:BigInt(tx.gas)}:{}),gasPrice:0n});
    }
    const response=await fetch(rpcURL,{method:"POST",headers:{"Content-Type":"application/json","User-Agent":"Mozilla/5.0 SlashCourt test wallet"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})});
    const data=await response.json();if(data.error)throw new Error(data.error.message);return data.result;
  });
  await page.addInitScript(()=>{window.ethereum={isMetaMask:true,request:request=>window.pipelineTestWallet(request),on(){},removeListener(){}};});
  const origin=process.env.PIPELINE_CAPTURE_ORIGIN||"http://127.0.0.1:3110";
  await page.goto(`${origin}/pipeline#case=${encodeURIComponent(jobId)}`);
  await page.getByRole("heading",{name:new RegExp(jobId)}).waitFor({timeout:60000});
  return {
    async submitClaim(recipient){
      await page.getByText("Pull claim and native-credit verification",{exact:true}).click();
      await page.getByLabel("Recipient address",{exact:true}).fill(recipient);
      await page.getByRole("button",{name:"Reserve and send claim"}).click();
      const key=`slashcourt:pipeline:61999:${[addresses.charter,addresses.court,addresses.record].join(":")}`;
      await page.waitForFunction(key=>JSON.parse(localStorage.getItem(key)||"[]").some(t=>t.kind==="operator"),key,{timeout:60000});
      const transaction=await page.evaluate(key=>JSON.parse(localStorage.getItem(key)).findLast(t=>t.kind==="operator"),key);
      await page.reload();
      await page.getByRole("heading",{name:new RegExp(jobId)}).waitFor();
      const retained=await page.evaluate(({key,hash})=>JSON.parse(localStorage.getItem(key)||"[]").some(t=>t.hash===hash),{key,hash:transaction.hash});
      if(!retained)throw new Error("Wallet-submitted claim hash did not survive reload");
      await writeFile(new URL(`${jobId}-wallet-journey.json`,dir),JSON.stringify({jobId,method:"claim",recipient,hash:transaction.hash,
        actualUiSubmission:true,reloadRecovered:true,provider:"Existing test account via EIP-1193 signing bridge; no mocked chain response",observedAt:new Date().toISOString()},null,2));
      return transaction.hash;
    },
    async retain(hash){
      await page.evaluate(({hash,addresses})=>{
        const key=`slashcourt:pipeline:61999:${[addresses.charter,addresses.court,addresses.record].join(":")}`;
        localStorage.setItem(key,JSON.stringify([{hash,kind:"adjudication",status:"SUBMITTED",execution:"UNKNOWN",success:false,appealable:false,appealEligibility:"unknown",updatedAt:Date.now()}]));
      },{hash,addresses});
      await page.reload();
    },
    async capture(hash){
      const control=page.getByRole("button",{name:"Appeal accepted adjudication"});
      if(await control.count()===0||!await control.isEnabled())return null;
      if(await control.getAttribute("data-appeal-target")!==hash)throw new Error("Wrong retained appeal target");
      await control.scrollIntoViewIfNeeded();
      const screenshot=`${jobId}-accepted.png`;
      await page.screenshot({path:fileURLToPath(new URL(screenshot,dir)),fullPage:true});
      const evidence={hash,observedAt:new Date().toISOString(),enabled:true,appealSubmitted:false,provider:"Actual existing StudioNet test account through EIP-1193 bridge; not the MetaMask extension",screenshot:`docs/pipeline-live/${screenshot}`};
      await writeFile(new URL(`${jobId}-accepted.json`,dir),JSON.stringify(evidence,null,2));
      return evidence;
    },
    close:()=>browser.close()
  };
}
