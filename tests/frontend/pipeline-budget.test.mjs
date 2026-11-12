import {test} from "node:test";
import assert from "node:assert/strict";
import {reserveDeposit, DEPOSIT_CAP} from "../../scripts/pipeline-budget.mjs";
import {verifyExplorer} from "../../frontend/lib/pipeline/explorer.mjs";
test("cumulative bond cap counts uncertain and failed writes, never net refunds", () => {
  const m={transactions:[{reservedValueWei:(DEPOSIT_CAP-10n).toString(),status:"UNCERTAIN"}]};
  const op={method:"deposit"}; reserveDeposit(m,op,10n);m.transactions.push(op);
  assert.equal(m.depositsUsedWei,DEPOSIT_CAP.toString());
  assert.throws(()=>reserveDeposit(m,{method:"file_incident"},1n),/cap/);
  assert.throws(()=>reserveDeposit({transactions:[]},{method:"claim"},1n),/authorized/);
});

test("Explorer transaction identity reads the observed nested transaction record",async()=>{
  const hash="0x"+"a".repeat(64);
  const response=value=>async()=>({ok:true,json:async()=>value});
  assert.equal((await verifyExplorer("transaction",hash,response({transaction:{hash,status:"FINALIZED"}}))).verified,true);
  await assert.rejects(()=>verifyExplorer("transaction",hash,response({transaction:{hash:"0x"+"b".repeat(64)}})),/identity mismatch/);
});

test("fresh deployment retains cumulative deposits from the previous attempt",()=>{
  const m={priorDepositsUsedWei:(DEPOSIT_CAP-2n).toString(),transactions:[]};
  const op={method:"deposit"};reserveDeposit(m,op,2n);m.transactions.push(op);
  assert.equal(m.depositsUsedWei,DEPOSIT_CAP.toString());
  assert.throws(()=>reserveDeposit(m,{method:"deposit"},1n),/cap/);
});
