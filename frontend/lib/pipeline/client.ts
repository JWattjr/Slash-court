"use client";
import { createGenLayerClient, getEthereumProvider } from "@/lib/genlayer/client";
import { SlashCourtClient } from "@/lib/slashcourt/client";
import deployment from "./deployment.json";

export const pipelineAddresses = {
  charter: process.env.NEXT_PUBLIC_PIPELINE_CHARTER || String(deployment.charter || ""),
  court: process.env.NEXT_PUBLIC_PIPELINE_COURT || String(deployment.court || ""),
  record: process.env.NEXT_PUBLIC_OPERATOR_RECORD || String(deployment.record || ""),
};
export const pipelineConfigured = Object.values(pipelineAddresses).every(a => /^0x[0-9a-fA-F]{40}$/.test(a));
export type Step = {step_id: string; operator: string; duty: string; bond_units: number};
export type Assessment = {step_id: string; effective_verdict: string; quote: string; input: {url: string}; output: {url: string}};
export type Job = {id: string; status: string; charter: string; digest: string; steps: Step[]; rejection_reasons: string[];
  deposits: Record<string, number>; credits: Record<string, number>; paid: Record<string, number>;
  claims: Record<string, {attempt: number; status: string; amount: number}>;
  records: Record<string, {input_url: string; output_url: string}>; outcome: string; liable_index: number | null;
  filing_bond: number; funding_deadline: number; evidence_deadline: number; deadline: number};
export type Case = {outcome?: string; finalized?: boolean; liable_index?: number | null; assessment?: {steps: Assessment[]}};
export type Profile = {operator: string; cases: number; violations: number; faithful_steps: number; voids: number; bond_multiplier: number};

function parse<T>(value: unknown): T {
  const normalized = typeof value === "string" ? JSON.parse(value) : value;
  if (!normalized || typeof normalized !== "object") throw new Error("Unexpected pipeline contract response");
  return normalized as T;
}

export class PipelineClient {
  private sdk;
  readonly tracker: SlashCourtClient;
  constructor(account?: string) {
    if (!pipelineConfigured) throw new Error("Pipeline contracts have not been configured");
    this.sdk = createGenLayerClient(account);
    this.tracker = new SlashCourtClient(account, {courtAddress: pipelineAddresses.court, vaultAddress: pipelineAddresses.charter});
  }
  async read<T>(contract: keyof typeof pipelineAddresses, method: string, args: string[] = []): Promise<T> {
    return parse<T>(await this.sdk.readContract({address: pipelineAddresses[contract] as `0x${string}`, functionName: method, args}));
  }
  async list(offset = 0): Promise<string[]> {
    return await this.sdk.readContract({address: pipelineAddresses.charter as `0x${string}`, functionName: "get_job_ids", args: [offset, 8]}) as string[];
  }
  async job(id: string) {
    const job = await this.read<Job>("charter", "get_job", [id]);
    if (!job.id || !Array.isArray(job.steps)) throw new Error("Selected charter does not exist");
    const amounts = [job.filing_bond, ...job.steps.map(s => s.bond_units), ...Object.values(job.deposits), ...Object.values(job.credits), ...Object.values(job.paid)];
    if (amounts.some(n => !Number.isSafeInteger(n) || n < 0)) throw new Error("Financial values exceed this console's exact integer support; writes withheld");
    return job;
  }
  case(id: string) { return this.read<Case>("court", "get_case", [id]); }
  profile(address: string) { return this.read<Profile>("record", "get_operator", [address]); }
  async write(contract: keyof typeof pipelineAddresses, functionName: string, args: (string | number)[], value = 0n) {
    const provider = getEthereumProvider();
    if (!provider || Number(await provider.request({method: "eth_chainId"})) !== 61999) throw new Error("Connect MetaMask to StudioNet 61999");
    return String(await this.sdk.writeContract({address: pipelineAddresses[contract] as `0x${string}`, functionName, args, value}));
  }
}
