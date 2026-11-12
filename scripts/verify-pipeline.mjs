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
const read = (address, functionName, args = []) => client.readContract({address, functionName, args});
const plain = value => JSON.parse(JSON.stringify(value, (_, v) => typeof v === "bigint" ? v.toString() : v));
const object = value => typeof value === "string" ? JSON.parse(value) : plain(value);
const manifest = JSON.parse(await readFile(new URL("../deploy/pipeline-2026-11-11.json", import.meta.url), "utf8"));

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
  assert.equal(manifest.status, "LIVE_PASS", "Milestone has no verified live release; local checks cannot establish readiness");
  assert.match(manifest.sourceRevision, /^[0-9a-f]{40}$/);
  assert(BigInt(manifest.depositsUsedWei) <= BigInt(manifest.depositCapWei));
  for (const [name, contract] of Object.entries(manifest.contracts)) {
    await verifyExplorer("contract", contract.address);
    const source = await client.getContractCode(contract.address);
    const bytes = Buffer.from(source.startsWith("0x") ? source.slice(2) : source, source.startsWith("0x") ? "hex" : "base64");
    assert.equal(createHash("sha256").update(bytes).digest("hex"), contract.sourceSha256, `${name} deployed source mismatch`);
  }
  const bindings = object(await read(manifest.contracts.charter.address, "get_bindings"));
  assert.equal(bindings.bound, true);
  assert.equal(bindings.court.toLowerCase(), manifest.contracts.court.address.toLowerCase());
  assert.equal(bindings.record.toLowerCase(), manifest.contracts.record.address.toLowerCase());
  for (const transaction of manifest.transactions) {
    await verifyExplorer("transaction", transaction.hash);
    const tx = await client.getTransaction({hash: transaction.hash});
    assert(["FINALIZED", 5].includes(tx.status) || tx.statusName === "FINALIZED", `${transaction.hash}: protocol not finalized`);
    const raw = tx.consensus_data?.leader_receipt?.[0];
    assert(raw?.execution_result === "SUCCESS" || tx.txExecutionResultName === "SUCCESS", `${transaction.hash}: execution not verified`);
  }
  for (const proof of manifest.cases) {
    const job = object(await read(manifest.contracts.charter.address, "get_job", [proof.id]));
    assert.equal(job.status, proof.rejected ? "REJECTED" : "FINAL");
    if (!proof.rejected) {
      assert.equal(job.outcome, proof.outcome);
      assert.equal(Object.values(job.credits).reduce((n, v) => n + BigInt(v), 0n), Object.values(job.deposits).reduce((n, v) => n + BigInt(v), BigInt(job.filing_paid)));
    }
  }
  assert.equal(manifest.cases.length >= 5, true, "all required live cases must be recorded");
  assert.equal(manifest.nativeCreditVerified, true, "native-credit proof missing");
  console.log(JSON.stringify({status: "PASS", originalRegression: await originalRegression(), linksVerified: true}));
}
