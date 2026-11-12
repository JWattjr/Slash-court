// Publishes synthetic fixture TEXT only to the owner's existing public evidence repo.
import {readFile,writeFile} from "node:fs/promises";
import {execFileSync} from "node:child_process";
import {createHash} from "node:crypto";
const file=new URL("../deploy/pipeline-2026-11-11.json",import.meta.url);
const m=JSON.parse(await readFile(file,"utf8"));
if(m.faithfulFixture){console.log("Fixture already saved",m.faithfulFixture.url);process.exit(0);}
const bytes=await readFile(new URL("../fixtures/pipeline-faithful.csv",import.meta.url));
const response=JSON.parse(execFileSync("gh",["api","--method","PUT","repos/JWattjr/genlayer-demo-evidence/contents/pipeline-court/faithful.csv","--input","-"],{
  input:JSON.stringify({message:"Add synthetic Pipeline Court faithful CSV fixture",content:bytes.toString("base64")}),encoding:"utf8"}));
const sha=response.commit.sha;
const url=`https://raw.githubusercontent.com/JWattjr/genlayer-demo-evidence/${sha}/pipeline-court/faithful.csv`;
const fetched=await fetch(url,{headers:{"User-Agent":"Mozilla/5.0 SlashCourt fixture verifier"},redirect:"error"});
if(!fetched.ok||!Buffer.from(await fetched.arrayBuffer()).equals(bytes))throw new Error("Published fixture bytes did not match; do not retry publication blindly");
m.faithfulFixture={url,commit:sha,sha256:createHash("sha256").update(bytes).digest("hex"),bytes:bytes.length,synthetic:true};
await writeFile(file,JSON.stringify(m,null,2)+"\n");console.log("PUBLISHED",url);
