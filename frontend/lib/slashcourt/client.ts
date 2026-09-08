"use client";

import {
  ExecutionResult,
  TransactionStatus,
  executionResultNumberToName,
  transactionsStatusNumberToName,
  type GenLayerTransaction,
} from "genlayer-js/types";
import { formatUnits, parseUnits } from "viem";
import { createGenLayerClient, GENLAYER_CHAIN_ID_HEX, getEthereumProvider, RPC_URL, chainForEndpoint } from "@/lib/genlayer/client";
import type { CalldataEncodable } from "genlayer-js/types";
import { classifyReadFailure } from "./refresh";
import type { CaseBundle, CaseIndex, CourtCase, CourtStatistics, Dashboard, ReadSlice, Rulebook, TxSnapshot, OperatorState, VaultApplication, VaultConfiguration, VaultStatistics } from "./types";

const COURT_ADDRESS = (process.env.NEXT_PUBLIC_SLASH_COURT_ADDRESS || "").trim();
const VAULT_ADDRESS = (process.env.NEXT_PUBLIC_OPERATOR_BOND_VAULT_ADDRESS || "").trim();
const ADDRESS = /^0x[a-fA-F0-9]{40}$/;

type LooseRecord = Record<string, any>;

export const GEN_DECIMALS = 18;

function plain(value: any): any {
  if (typeof value === "bigint") return value.toString();
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

export function parseGenAmount(value: string): bigint {
  const normalized = value.trim();
  if (!/^\d+(\.\d{1,18})?$/.test(normalized)) {
    throw new Error("Enter a non-negative GEN amount with at most 18 decimals.");
  }
  const parsed = parseUnits(normalized, GEN_DECIMALS);
  if (parsed <= 0n) throw new Error("GEN amount must be greater than zero.");
  return parsed;
}

export function formatGenAmount(value: string | bigint | undefined | null): string {
  if (value === undefined || value === null || value === "") return "—";
  try {
    const formatted = formatUnits(BigInt(value), GEN_DECIMALS);
    const trimmed = formatted.replace(/(\.\d*?)0+$/, "$1").replace(/\.0+$/, "");
    const [whole, fraction] = trimmed.split(".");
    const grouped = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return fraction ? `${grouped}.${fraction}` : grouped;
  } catch {
    return "—";
  }
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
  const direct = raw.statusName || raw.status_name;
  if (typeof direct === "string") return direct.toUpperCase();
  const numeric = raw.status;
  if (typeof numeric === "number" || typeof numeric === "string") {
    return String((transactionsStatusNumberToName as Record<string, string>)[String(numeric)] || numeric).toUpperCase();
  }
  return "UNKNOWN";
}

function executionName(receipt: GenLayerTransaction) {
  const raw = receipt as any;
  const direct = raw.txExecutionResultName || raw.tx_execution_result_name;
  if (typeof direct === "string") return direct.toUpperCase();
  const numeric = raw.txExecutionResult ?? raw.tx_execution_result;
  if (typeof numeric === "number" || typeof numeric === "string") {
    return String((executionResultNumberToName as Record<string, string>)[String(numeric)] || numeric).toUpperCase();
  }
  const leader = raw.consensus_data?.leader_receipt?.[0];
  if (typeof leader?.execution_result === "number" || typeof leader?.execution_result === "string") {
    return String((executionResultNumberToName as Record<string, string>)[String(leader.execution_result)] || leader.execution_result).toUpperCase();
  }
  return "UNKNOWN";
}

function transactionError(receipt: GenLayerTransaction) {
  const raw = receipt as any;
  return String(raw.error || raw.txExecutionError || raw.tx_execution_error || raw.message || "");
}

function succeeded(execution: string) {
  return execution === ExecutionResult.FINISHED_WITH_RETURN || execution === "SUCCESS";
}

function snapshotFromReceipt(hash: string, receipt: GenLayerTransaction, kind: TxSnapshot["kind"]): TxSnapshot {
  const status = statusName(receipt);
  const execution = executionName(receipt);
  const error = transactionError(receipt);
  return {
    hash,
    status,
    execution,
    success: succeeded(execution),
    appealable: false,
    kind,
    ...(error ? { error } : {}),
    updatedAt: Date.now(),
  };
}

export class SlashCourtClient {
  private readonly client: any;
  private readonly court: `0x${string}`;
  private readonly vault: `0x${string}`;
  private readTail: Promise<unknown> = Promise.resolve();

  constructor(account?: string, addresses?: { courtAddress: string; vaultAddress: string }) {
    this.court = address(addresses?.courtAddress || COURT_ADDRESS, "SlashCourt");
    this.vault = address(addresses?.vaultAddress || VAULT_ADDRESS, "OperatorBondVault");
    this.client = createGenLayerClient(account);
  }

  private read(contract: `0x${string}`, functionName: string, args: CalldataEncodable[] = []) {
    const request = this.readTail.then(() => this.client.readContract({ address: contract, functionName, args }));
    this.readTail = request.catch(() => undefined);
    return request;
  }

  private async write(contract: `0x${string}`, functionName: string, args: CalldataEncodable[] = [], value = 0n): Promise<string> {
    const provider = getEthereumProvider();
    if (!provider) throw new Error("Connect MetaMask before sending a transaction.");
    const chainId = await provider.request({ method: "eth_chainId" });
    if (String(chainId).toLowerCase() !== GENLAYER_CHAIN_ID_HEX.toLowerCase()) {
      throw new Error(`Switch MetaMask to GenLayer Studio Network (${GENLAYER_CHAIN_ID_HEX}).`);
    }
    const hash = await this.client.writeContract({ address: contract, functionName, args, value });
    return String(hash);
  }

  private async readSlice<T>(read: () => Promise<unknown>, normalize: (value: unknown) => T): Promise<ReadSlice<T>> {
    try {
      return { data: normalize(await read()), state: "success", error: null, updatedAt: Date.now() };
    } catch (error) {
      return { data: null, state: "error", error: classifyReadFailure(error), updatedAt: null };
    }
  }

  async getCaseIndex(offset = 0, limit = 8): Promise<ReadSlice<CaseIndex>> {
    return this.readSlice(() => this.read(this.court, "get_case_ids", [offset, limit]), (value) => {
      const item = record(value);
      return { ids: Array.isArray(item.ids) ? item.ids.map(String) : [], total: numberValue(item.total), offset, limit };
    });
  }

  async dashboard(account?: string, offset = 0, limit = 8): Promise<Dashboard> {
    const [statistics, rulebook, domains, caseIndex, vault, vaultStatistics, operator] = await Promise.all([
      this.readSlice(() => this.read(this.court, "get_statistics"), normalizeStatistics),
      this.readSlice(() => this.read(this.court, "get_current_rulebook"), (value) => {
        const item = plain(value) as LooseRecord;
        return numberValue(item?.version) > 0 ? normalizeRulebook(item) : null;
      }),
      this.readSlice(() => this.read(this.court, "get_approved_evidence_domains"), (value) => {
        const item = record(value);
        return Array.isArray(item.domains) ? item.domains.map(String) : [];
      }),
      this.getCaseIndex(offset, limit),
      this.readSlice(() => this.read(this.vault, "get_vault_configuration"), normalizeVaultConfiguration),
      this.readSlice(() => this.read(this.vault, "get_vault_statistics"), normalizeVaultStatistics),
      account
        ? this.readSlice(() => this.read(this.vault, "get_operator", [account]), normalizeOperator)
        : Promise.resolve({ data: null, state: "idle", error: null, updatedAt: null } as ReadSlice<OperatorState>),
    ]);
    return {
      statistics,
      rulebook,
      domains,
      caseIndex,
      operator,
      vault,
      vaultStatistics,
      network: chainForEndpoint(RPC_URL).name,
      attemptedAt: Date.now(),
    };
  }

  async getCase(caseId: string) {
    return normalizeCase(await this.read(this.court, "get_case", [caseId]));
  }

  async getCaseBundle(caseId: string): Promise<CaseBundle> {
    const [caseRecord, application] = await Promise.all([
      this.readSlice(() => this.read(this.court, "get_case", [caseId]), normalizeCase),
      this.readSlice(() => this.read(this.vault, "get_case_application", [caseId]), normalizeVaultApplication),
    ]);
    return { caseRecord, application };
  }

  async getCommitment(commitmentId: string) {
    return record(await this.read(this.vault, "get_commitment", [commitmentId]));
  }

  async submitCase(commitmentId: string, claim: string, evidence: unknown[]) {
    return this.write(this.court, "open_case", [commitmentId, claim, JSON.stringify(evidence)]);
  }

  async registerOperator(metadataUri: string) {
    return this.write(this.vault, "register_operator", [metadataUri]);
  }

  async depositBond(amount: string) {
    return this.write(this.vault, "deposit_bond", [], parseGenAmount(amount));
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
    return this.write(this.vault, "create_commitment", [args.commitmentId, address(args.beneficiary, "Beneficiary"), args.serviceDescription, args.dutyTrigger, args.dutyDeadline, args.disputeDeadline, args.rulebookVersion, parseGenAmount(args.lockedExposure), args.expectedActionId]);
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
    return String(await sdk.appealTransaction({ txId, value }));
  }

  async snapshot(hash: string, kind: TxSnapshot["kind"] = "operator"): Promise<TxSnapshot> {
    const receipt = await this.client.getTransaction({ hash });
    const snapshot = snapshotFromReceipt(hash, receipt, kind);
    return { ...snapshot, appealable: Boolean(await this.client.canAppeal({ txId: hash }).catch(() => false)) };
  }

  async waitForAppealWindow(hash: string, kind: TxSnapshot["kind"] = "adjudication"): Promise<TxSnapshot> {
    try {
      const receipt = await this.client.waitForTransactionReceipt({
        hash,
        status: TransactionStatus.ACCEPTED,
        interval: 1500,
        retries: 100,
        fullTransaction: false,
      });
      const snapshot = snapshotFromReceipt(hash, receipt, kind);
      return { ...snapshot, appealable: Boolean(await this.client.canAppeal({ txId: hash }).catch(() => false)) };
    } catch (error) {
      return {
        hash,
        status: "UNKNOWN",
        execution: "UNKNOWN",
        success: false,
        appealable: false,
        kind,
        error: error instanceof Error ? error.message : "Appeal-window polling failed.",
        updatedAt: Date.now(),
      };
    }
  }

  async wait(hash: string, kind: TxSnapshot["kind"] = "operator"): Promise<TxSnapshot> {
    try {
      const receipt = await this.client.waitForTransactionReceipt({
        hash,
        status: TransactionStatus.FINALIZED,
        interval: 3000,
        retries: 100,
        fullTransaction: false,
      });
      const snapshot = snapshotFromReceipt(hash, receipt, kind);
      return { ...snapshot, appealable: Boolean(await this.client.canAppeal({ txId: hash }).catch(() => false)) };
    } catch (error) {
      return {
        hash,
        status: "UNKNOWN",
        execution: "UNKNOWN",
        success: false,
        appealable: false,
        kind,
        error: error instanceof Error ? error.message : "Finality polling failed.",
        updatedAt: Date.now(),
      };
    }
  }
}

function normalizeCase(value: unknown): CourtCase {
  const item = record(plain(value));
  return {
    ...item,
    rulebook_version: numberValue(item.rulebook_version),
    commitment_exposure: String(item.commitment_exposure ?? "0"),
    penalty_bps: numberValue(item.penalty_bps),
    penalty_amount: String(item.penalty_amount ?? "0"),
    findings: Array.isArray(item.findings) ? item.findings : [],
  } as CourtCase;
}

function normalizeStatistics(value: unknown): CourtStatistics {
  const item = record(plain(value));
  return Object.fromEntries(Object.entries(item).map(([key, nested]) => [key, numberValue(nested)])) as CourtStatistics;
}

function normalizeRulebook(value: LooseRecord): Rulebook {
  return {
    ...value,
    version: numberValue(value.version),
    full_slash_bps: numberValue(value.full_slash_bps),
    partial_slash_bps: numberValue(value.partial_slash_bps),
    no_slash_bps: numberValue(value.no_slash_bps),
    beneficiary_share_bps: numberValue(value.beneficiary_share_bps),
    safety_pool_share_bps: numberValue(value.safety_pool_share_bps),
  } as Rulebook;
}

function normalizeOperator(value: unknown): OperatorState {
  const item = record(plain(value));
  return {
    ...item,
    total_bond: String(item.total_bond ?? "0"),
    available_bond: String(item.available_bond ?? "0"),
    locked_exposure: String(item.locked_exposure ?? "0"),
    claimable_awards: String(item.claimable_awards ?? "0"),
    active_commitments: numberValue(item.active_commitments),
    resolved_commitments: numberValue(item.resolved_commitments),
  } as OperatorState;
}

function normalizeVaultConfiguration(value: unknown): VaultConfiguration {
  const item = record(plain(value));
  return {
    ...item,
    full_slash_bps: numberValue(item.full_slash_bps),
    partial_slash_bps: numberValue(item.partial_slash_bps),
    beneficiary_share_bps: numberValue(item.beneficiary_share_bps),
    safety_pool_share_bps: numberValue(item.safety_pool_share_bps),
  } as VaultConfiguration;
}

function normalizeVaultStatistics(value: unknown): VaultStatistics {
  const item = record(plain(value));
  return {
    ...item,
    total_operators: numberValue(item.total_operators),
    total_bond: String(item.total_bond ?? "0"),
    available_bond: String(item.available_bond ?? "0"),
    locked_exposure: String(item.locked_exposure ?? "0"),
    total_penalties_applied: String(item.total_penalties_applied ?? "0"),
    safety_pool_balance: String(item.safety_pool_balance ?? "0"),
  } as VaultStatistics;
}

function normalizeVaultApplication(value: unknown): VaultApplication {
  const item = record(plain(value));
  return {
    ...item,
    penalty_bps: numberValue(item.penalty_bps),
    penalty_amount: String(item.penalty_amount ?? "0"),
    beneficiary_award: String(item.beneficiary_award ?? "0"),
    safety_pool_amount: String(item.safety_pool_amount ?? "0"),
    applied: Boolean(item.applied),
    alleged_rule_ids: Array.isArray(item.alleged_rule_ids) ? item.alleged_rule_ids.map(String) : [],
    evidence_citations: Array.isArray(item.evidence_citations) ? item.evidence_citations : [],
  } as VaultApplication;
}
