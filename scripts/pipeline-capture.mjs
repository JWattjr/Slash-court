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
      return wallet.sendTransaction({...params[0],account,chain:studionet});
    }
    const response=await fetch(rpcURL,{method:"POST",headers:{"Content-Type":"application/json","User-Agent":"Mozilla/5.0 SlashCourt test wallet"},body:JSON.stringify({jsonrpc:"2.0",id:1,method,params})});
    const data=await response.json();if(data.error)throw new Error(data.error.message);return data.result;
  });
  await page.addInitScript(()=>{window.ethereum={isMetaMask:true,request:request=>window.pipelineTestWallet(request),on(){},removeListener(){}};});
  const origin=process.env.PIPELINE_CAPTURE_ORIGIN||"http://127.0.0.1:3110";
  await page.goto(`${origin}/pipeline#case=${encodeURIComponent(jobId)}`);
  await page.getByRole("heading",{name:new RegExp(jobId)}).waitFor({timeout:60000});
  return {
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
