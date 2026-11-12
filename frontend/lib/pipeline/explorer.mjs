export const EXPLORER = "https://explorer-studio.genlayer.com";
export function explorerContract(address) {
  if (!/^0x[0-9a-fA-F]{40}$/.test(address)) throw new Error("Invalid contract address");
  return `${EXPLORER}/address/${address}`;
}
export function explorerTransaction(hash) {
  if (!/^0x[0-9a-fA-F]{64}$/.test(hash)) throw new Error("Invalid transaction hash");
  return `${EXPLORER}/tx/${hash}`;
}
export async function verifyExplorer(kind, value, request = fetch) {
  const url = kind === "contract" ? explorerContract(value) : explorerTransaction(value);
  const api = kind === "contract" ? `${EXPLORER}/api/address/${value}` : `${EXPLORER}/api/transactions/${value}`;
  const response = await request(api, { headers: { "User-Agent": "Mozilla/5.0 SlashCourt Pipeline verifier" } });
  if (!response.ok) throw new Error(`Explorer returned HTTP ${response.status}: ${api}`);
  const record = await response.json();
  const data = record.data || record;
  if (kind === "contract" && data.type !== "CONTRACT") throw new Error(`Explorer record is not a contract: ${api}`);
  if (kind !== "contract" && String(data.hash || data.transaction_hash || "").toLowerCase() !== value.toLowerCase()) throw new Error(`Explorer transaction identity mismatch: ${api}`);
  return { url, api, verified: true };
}
