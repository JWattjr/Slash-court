export const EXPLORER: string;
export function explorerContract(address: string): string;
export function explorerTransaction(hash: string): string;
export function verifyExplorer(kind: "contract" | "transaction", value: string, request?: typeof fetch): Promise<{url: string; api: string; verified: boolean}>;
