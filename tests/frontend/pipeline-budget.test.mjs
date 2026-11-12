import {test} from "node:test";
import assert from "node:assert/strict";
import {reserveDeposit, DEPOSIT_CAP} from "../../scripts/pipeline-budget.mjs";
test("cumulative bond cap counts uncertain and failed writes, never net refunds", () => {
  const m={transactions:[{reservedValueWei:(DEPOSIT_CAP-10n).toString(),status:"UNCERTAIN"}]};
  const op={method:"deposit"}; reserveDeposit(m,op,10n);m.transactions.push(op);
  assert.equal(m.depositsUsedWei,DEPOSIT_CAP.toString());
  assert.throws(()=>reserveDeposit(m,{method:"file_incident"},1n),/cap/);
  assert.throws(()=>reserveDeposit({transactions:[]},{method:"claim"},1n),/authorized/);
});
