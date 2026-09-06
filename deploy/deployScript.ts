/**
 * SlashCourt deployment script.
 *
 * The script deploys the vault before the court, performs both one-time
 * bindings, seeds the immutable v1 rulebook, and records addresses only after
 * every transaction reports successful GenVM execution.
 *
 * Run with the official CLI, for example:
 *   genlayer network set studionet
 *   genlayer deploy
 */

import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

import {
  TransactionStatus,
  executionResultNumberToName,
  transactionsStatusNumberToName,
} from "genlayer-js/types";
import type {
  CalldataEncodable,
  DecodedDeployData,
  GenLayerChain,
  GenLayerClient,
  GenLayerTransaction,
  TransactionHash,
} from "genlayer-js/types";

const VAULT_SOURCE = "contracts/operator_bond_vault.py";
const COURT_SOURCE = "contracts/slash_court.py";
const ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;
const DEFAULT_RULEBOOK_FILE = "config/rulebook_v1.txt";
const DEFAULT_DOMAINS = "status.example.org,evidence.example.com";

type Loose = Record<string, unknown>;

function env(name: string, fallback: string): string {
  const value = process.env[name];
  return value === undefined || value.trim() === "" ? fallback : value.trim();
}

function address(value: string, label: string): string {
  if (!ADDRESS_PATTERN.test(value)) {
    throw new Error(`${label} is not a valid 0x address: ${value}`);
  }
  return value.toLowerCase();
}

function receiptStatus(receipt: GenLayerTransaction): string {
  const raw = receipt as unknown as Loose;
  if (typeof raw.statusName === "string") return raw.statusName;
  if (typeof raw.status_name === "string") return raw.status_name;
  const numeric = raw.status;
  if (typeof numeric === "number" || typeof numeric === "string") {
    return (transactionsStatusNumberToName as Record<string, string>)[String(numeric)] ?? "";
  }
  return "";
}

function executionStatus(receipt: GenLayerTransaction): { name: string; ok: boolean } {
  const raw = receipt as unknown as Loose;
  let name = "";
  const direct = raw.txExecutionResultName ?? raw.tx_execution_result_name;
  if (typeof direct === "string") name = direct;
  if (!name) {
    const numeric = raw.txExecutionResult ?? raw.tx_execution_result;
    if (typeof numeric === "number" || typeof numeric === "string") {
      name = (executionResultNumberToName as Record<string, string>)[String(numeric)] ?? "";
    }
  }
  const leader = ((raw.consensus_data as Loose | undefined)?.leader_receipt as unknown[] | undefined)?.[0] as Loose | undefined;
  if (!name && typeof leader?.execution_result === "string") name = leader.execution_result;
  return { name: name.toUpperCase(), ok: ["SUCCESS", "FINISHED_WITH_RETURN"].includes(name.toUpperCase()) };
}

function assertSucceeded(step: string, receipt: GenLayerTransaction): GenLayerTransaction {
  const status = receiptStatus(receipt).toUpperCase();
  const execution = executionStatus(receipt);
  if (!["ACCEPTED", "FINALIZED"].includes(status) || !execution.ok) {
    throw new Error(
      `${step} failed: consensus=${status || "UNKNOWN"}, execution=${execution.name || "UNKNOWN"}. ` +
        `Receipt=${JSON.stringify(receipt)}`,
    );
  }
  return receipt;
}

class Deployer {
  private readonly retries = Number(env("SLASHCOURT_WAIT_RETRIES", "200"));
  private readonly completedSteps: Array<{ label: string; hash: string }> = [];

  constructor(private readonly client: GenLayerClient<GenLayerChain>) {}

  private async wait(hash: TransactionHash) {
    return this.client.waitForTransactionReceipt({
      hash,
      status: TransactionStatus.FINALIZED,
      interval: 5_000,
      retries: this.retries,
    });
  }

  async deploy(label: string, source: string): Promise<`0x${string}`> {
    console.log(`\n▸ ${label}: deploying ${source}`);
    const code = new Uint8Array(readFileSync(path.resolve(process.cwd(), source)));
    const hash = (await this.client.deployContract({ code, args: [] })) as TransactionHash;
    const receipt = assertSucceeded(label, await this.wait(hash));
    const data = receipt.data as Record<string, unknown> | undefined;
    const decoded = receipt.txDataDecoded as DecodedDeployData | undefined;
    const deployed = (data?.contract_address as string | undefined) ?? decoded?.contractAddress;
    if (!deployed || !ADDRESS_PATTERN.test(deployed)) {
      throw new Error(`${label} did not return a contract address.`);
    }
    console.log(`  ✓ ${deployed} (${hash})`);
    this.completedSteps.push({ label, hash: String(hash) });
    return deployed as `0x${string}`;
  }

  async write(label: string, contract: `0x${string}`, functionName: string, args: CalldataEncodable[]) {
    console.log(`▸ ${label}`);
    const hash = (await this.client.writeContract({
      address: contract,
      functionName,
      args,
      value: 0n,
    })) as TransactionHash;
    assertSucceeded(label, await this.wait(hash));
    console.log(`  ✓ ${hash}`);
    this.completedSteps.push({ label, hash: String(hash) });
    return hash;
  }

  completedTransactions() {
    return this.completedSteps;
  }
}

export default async function main(client: GenLayerClient<GenLayerChain>) {
  const rulebookPath = env("SLASHCOURT_RULEBOOK_FILE", DEFAULT_RULEBOOK_FILE);
  const rulebookText = readFileSync(path.resolve(process.cwd(), rulebookPath), "utf-8").trim();
  const domains = env("SLASHCOURT_EVIDENCE_DOMAINS", DEFAULT_DOMAINS)
    .split(",")
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);
  if (!domains.length) throw new Error("SLASHCOURT_EVIDENCE_DOMAINS is empty.");

  const deployer = new Deployer(client);
  const vaultAddress = await deployer.deploy("1/7 Operator Bond Vault", VAULT_SOURCE);
  const courtAddress = await deployer.deploy("2/7 SlashCourt", COURT_SOURCE);

  await deployer.write("3/7 Bind vault → court", vaultAddress, "configure_court", [
    address(courtAddress, "SlashCourt address"),
  ]);
  await deployer.write("4/7 Bind court → vault", courtAddress, "configure_bond_vault", [
    address(vaultAddress, "vault address"),
  ]);
  await deployer.write("5/7 Publish immutable rulebook v1", courtAddress, "create_initial_rulebook", [
    rulebookText,
    "sha256:slashcourt-rulebook-v1",
  ]);
  await deployer.write("6/7 Configure evidence domains", courtAddress, "configure_approved_evidence_domains", [
    JSON.stringify(domains),
  ]);

  const network = (client.chain as GenLayerChain | undefined)?.name ?? "unknown-network";
  const record = {
    network,
    deployedAt: new Date().toISOString(),
    operatorBondVaultAddress: vaultAddress,
    slashCourtAddress: courtAddress,
    rulebookVersion: 1,
    approvedEvidenceDomains: domains,
    deploymentTransactions: deployer.completedTransactions(),
  };
  const outputPath = path.resolve(process.cwd(), "deploy/last-deployment.json");
  writeFileSync(outputPath, `${JSON.stringify(record, null, 2)}\n`, "utf-8");
  console.log(`\nSlashCourt deployed on ${network}. Addresses recorded at ${outputPath}`);
  console.log(`  NEXT_PUBLIC_OPERATOR_BOND_VAULT_ADDRESS=${vaultAddress}`);
  console.log(`  NEXT_PUBLIC_SLASH_COURT_ADDRESS=${courtAddress}`);
}
