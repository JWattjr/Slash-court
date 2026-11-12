export const DEPOSIT_CAP = 100_000_000_000_000_000n;
export function reserveDeposit(manifest, operation, value) {
  const amount = BigInt(value);
  if (amount < 0n) throw new Error("Negative value");
  if (amount && !["deposit", "file_incident"].includes(operation.method)) throw new Error("Value is only authorized for pipeline bonds");
  const used = (manifest.transactions || []).reduce((sum, tx) => sum + BigInt(tx.reservedValueWei || "0"), 0n);
  if (used + amount > DEPOSIT_CAP) throw new Error("Milestone cumulative 0.1 GEN deposit cap would be exceeded");
  operation.reservedValueWei = amount.toString();
  manifest.depositsUsedWei = (used + amount).toString();
  manifest.depositCapWei = DEPOSIT_CAP.toString();
}
