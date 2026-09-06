"use client";

import { TransactionStatus, type GenLayerTransaction } from "genlayer-js/types";
import { createGenLayerClient, getEthereumProvider, RPC_URL, chainForEndpoint } from "@/lib/genlayer/client";
import type { CalldataEncodable } from "genlayer-js/types";
import type { CourtCase, CourtStatistics, Dashboard, Rulebook, TxSnapshot, OperatorState, VaultConfiguration, VaultStatistics } from "./types";

const COURT_ADDRESS = (process.env.NEXT_PUBLIC_SLASH_COURT_ADDRESS || "").trim();
const VAULT_ADDRESS = (process.env.NEXT_PUBLIC_OPERATOR_BOND_VAULT_ADDRESS || "").trim();
const ADDRESS = /^0x[a-fA-F0-9]{40}$/;

type LooseRecord = Record<string, any>;

function plain(value: any): any {
  if (typeof value === "bigint") return Number(value);
  if (value instanceof Map) return Object.fromEntries([...value.entries()].map(([key, nested]) => [String(key), plain(nested)]));
  if (Array.isArray(value)) return value.map(plain);
  if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([key, nested]) => [key, plain(nested)]));
  return value;
}

function numberValue(value: unknown) {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") return Number(value) || 0;
  return 0;
}

function record(value: unknown): LooseRecord {
  const normalized = plain(value);
  if (!normalized || typeof normalized !== "object" || Array.isArray(normalized)) throw new Error("The contract returned an unexpected response shape.");
  return normalized as LooseRecord;
}

function address(value: string, label: string) {
  if (!ADDRESS.test(value)) throw new Error(`${label} is not configured with a valid 0x address.`);
  return value as `0x${string}`;
}

export function deploymentConfiguration() {
  return {
    courtAddress: COURT_ADDRESS,
    vaultAddress: VAULT_ADDRESS,
    rpcUrl: RPC_URL,
    network: chainForEndpoint(RPC_URL).name,
  };
}

export function missingConfigurationKeys() {
  const missing: string[] = [];
  if (!ADDRESS.test(COURT_ADDRESS)) missing.push("NEXT_PUBLIC_SLASH_COURT_ADDRESS");
  if (!ADDRESS.test(VAULT_ADDRESS)) missing.push("NEXT_PUBLIC_OPERATOR_BOND_VAULT_ADDRESS");
  if (!RPC_URL) missing.push("NEXT_PUBLIC_GENLAYER_RPC_URL");
  return missing;
}

function statusName(receipt: GenLayerTransaction) {
  const raw = receipt as any;
  return String(raw.statusName || raw.status_name || raw.status || "UNKNOWN").toUpperCase();
}

function executionName(receipt: GenLayerTransaction) {
  const raw = receipt as any;
  return String(raw.txExecutionResultName || raw.tx_execution_result_name || raw.txExecutionResult || "UNKNOWN").toUpperCase();
}

export class SlashCourtClient {
  private readonly client: any;
  private readonly court: `0x${string}`;
  private readonly vault: `0x${string}`;
  private readTail: Promise<unknown> = Promise.resolve();

  constructor(account?: string) {
    this.court = address(COURT_ADDRESS, "SlashCourt");
    this.vault = address(VAULT_ADDRESS, "OperatorBondVault");
    this.client = createGenLayerClient(account);
  }

  private read(contract: `0x${string}`, functionName: string, args: CalldataEncodable[] = []) {
    const request = this.readTail.then(() => this.client.readContract({ address: contract, functionName, args }));
    this.readTail = request.catch(() => undefined);
    return request;
  }

  private async write(contract: `0x${string}`, functionName: string, args: CalldataEncodable[] = [], value = 0n): Promise<string> {
    if (!getEthereumProvider()) throw new Error("Connect MetaMask before sending a transaction.");
    const hash = await this.client.writeContract({ address: contract, functionName, args, value });
    return String(hash);
  }

  async dashboard(account?: string): Promise<Dashboard> {
    const [statsRaw, rulebookRaw, domainsRaw, idsRaw, vaultRaw, vaultStatsRaw, operatorRaw] = await Promise.all([
      this.read(this.court, "get_statistics"),
      this.read(this.court, "get_current_rulebook"),
      this.read(this.court, "get_approved_evidence_domains"),
      this.read(this.court, "get_case_ids", [0, 50]),
      this.read(this.vault, "get_vault_configuration"),
      this.read(this.vault, "get_vault_statistics"),
      account ? this.read(this.vault, "get_operator", [account]) : Promise.resolve(null),
    ]);
    const ids = Array.isArray(record(idsRaw).ids) ? record(idsRaw).ids.map(String) : [];
    const cases: CourtCase[] = [];
    for (const id of ids) {
      try {
        cases.push(plain(await this.read(this.court, "get_case", [id])) as CourtCase);
      } catch {
        // A case can be between an accepted parent write and its finalized child.
        // The next poll will pick it up; the dashboard never invents a row.
      }
    }
    const rulebook = plain(rulebookRaw) as Rulebook;
    return {
      statistics: plain(statsRaw) as CourtStatistics,
      rulebook: numberValue(rulebook?.version) > 0 ? rulebook : null,
      domains: Array.isArray(record(domainsRaw).domains) ? record(domainsRaw).domains.map(String) : [],
      cases,
      operator: operatorRaw ? (plain(operatorRaw) as OperatorState) : null,
      vault: plain(vaultRaw) as VaultConfiguration,
      vaultStatistics: plain(vaultStatsRaw) as VaultStatistics,
      network: chainForEndpoint(RPC_URL).name,
    };
  }

  async getCase(caseId: string) {
    return plain(await this.read(this.court, "get_case", [caseId])) as CourtCase;
  }

  async submitCase(commitmentId: string, claim: string, evidence: unknown[]) {
    return this.write(this.court, "open_case", [commitmentId, claim, JSON.stringify(evidence)]);
  }

  async registerOperator(metadataUri: string) {
    return this.write(this.vault, "register_operator", [metadataUri]);
  }

  async depositBond(amount: string) {
    return this.write(this.vault, "deposit_bond", [], BigInt(amount));
  }

  async acceptCommitment(commitmentId: string) {
    return this.write(this.vault, "accept_commitment", [commitmentId]);
  }

  async createCommitment(args: {
    commitmentId: string;
    beneficiary: string;
    serviceDescription: string;
    dutyTrigger: string;
    dutyDeadline: string;
    disputeDeadline: string;
    rulebookVersion: number;
    lockedExposure: string;
    expectedActionId: string;
  }) {
    return this.write(this.vault, "create_commitment", [args.commitmentId, address(args.beneficiary, "Beneficiary"), args.serviceDescription, args.dutyTrigger, args.dutyDeadline, args.disputeDeadline, args.rulebookVersion, BigInt(args.lockedExposure), args.expectedActionId]);
  }

  async respondToCase(caseId: string, response: string, exemption: string, mitigation: string, evidence: unknown[]) {
    return this.write(this.court, "respond_to_case", [caseId, response, exemption, mitigation, JSON.stringify(evidence)]);
  }

  async markCaseReady(caseId: string, ruleIds: string[]) {
    return this.write(this.court, "mark_case_ready", [caseId, JSON.stringify(ruleIds)]);
  }

  async adjudicateCase(caseId: string) {
    return this.write(this.court, "adjudicate_case", [caseId]);
  }

  async retryApplication(caseId: string) {
    return this.write(this.court, "retry_resolution_application", [caseId]);
  }

  async appeal(txHash: string) {
    const sdk = this.client as { getAppealCharge?: (args: { txId: `0x${string}` }) => Promise<bigint>; getMinAppealBond?: (args: { txId: `0x${string}` }) => Promise<bigint>; appealTransaction: (args: { txId: `0x${string}`; value: bigint }) => Promise<unknown> };
    const txId = txHash as `0x${string}`;
    const value = sdk.getAppealCharge ? await sdk.getAppealCharge({ txId }) : await sdk.getMinAppealBond!({ txId });
    await sdk.appealTransaction({ txId, value });
    return txHash;
  }

  async snapshot(hash: string): Promise<TxSnapshot> {
    const receipt = await this.client.getTransaction({ hash });
    return { hash, status: statusName(receipt), execution: executionName(receipt), appealable: Boolean(await this.client.canAppeal({ txId: hash }).catch(() => false)) };
  }

  async wait(hash: string): Promise<TxSnapshot> {
    const receipt = await this.client.waitForTransactionReceipt({ hash, status: TransactionStatus.ACCEPTED, interval: 3000, retries: 100 });
    return { hash, status: statusName(receipt), execution: executionName(receipt), appealable: Boolean(await this.client.canAppeal({ txId: hash }).catch(() => false)) };
  }
}
