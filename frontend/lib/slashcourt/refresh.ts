export type ReadFailureKind = "rate_limit" | "network" | "contract" | "configuration" | "unknown";

export type ReadFailure = {
  kind: ReadFailureKind;
  message: string;
  retryAfterSeconds?: number;
};

function errorParts(error: unknown) {
  const messages: string[] = [];
  let retryAfterSeconds: number | undefined;
  let current: unknown = error;
  const seen = new Set<unknown>();
  while (current && typeof current === "object" && !seen.has(current)) {
    seen.add(current);
    const item = current as Record<string, unknown>;
    for (const key of ["shortMessage", "details", "message"]) {
      if (typeof item[key] === "string") messages.push(item[key]);
    }
    const data = item.data;
    if (data && typeof data === "object") {
      const dataRecord = data as Record<string, unknown>;
      for (const key of ["message", "details", "code"]) {
        if (typeof dataRecord[key] === "string" || typeof dataRecord[key] === "number") messages.push(String(dataRecord[key]));
      }
      const seconds = Number(dataRecord.retry_after_seconds);
      if (Number.isFinite(seconds) && seconds > 0) retryAfterSeconds = seconds;
    }
    if (typeof item.code === "string" || typeof item.code === "number") messages.push(String(item.code));
    current = item.cause;
  }
  if (error instanceof Error && !messages.includes(error.message)) messages.push(error.message);
  return { text: messages.join(" · "), retryAfterSeconds };
}

export function classifyReadFailure(error: unknown): ReadFailure {
  const { text, retryAfterSeconds } = errorParts(error);
  if (/rate limit|too many requests|-32029|-32429/i.test(text)) {
    return { kind: "rate_limit", message: "StudioNet’s public RPC request limit is temporarily exhausted.", retryAfterSeconds };
  }
  if (/failed to fetch|network|load failed|timeout|timed out|connection|cors/i.test(text)) {
    return { kind: "network", message: "The StudioNet RPC endpoint could not be reached from this browser." };
  }
  if (/execution failed|contract|user error|revert|schema|decode/i.test(text)) {
    return { kind: "contract", message: "The deployed contract rejected this read or returned an incompatible result." };
  }
  if (/not configured|invalid 0x address|environment/i.test(text)) {
    return { kind: "configuration", message: "The public deployment configuration is incomplete or invalid." };
  }
  return { kind: "unknown", message: text || "The read failed for an unknown reason." };
}

export const REFRESH_SUCCESS_MS = 5 * 60_000;
export const MAX_AUTOMATIC_REFRESHES = 8;

export function nextRefreshDelay(failures: number, retryAfterSeconds?: number) {
  const backoff = [2 * 60_000, 5 * 60_000, 15 * 60_000, 30 * 60_000];
  const delay = failures <= 0 ? REFRESH_SUCCESS_MS : backoff[Math.min(failures - 1, backoff.length - 1)];
  return Math.max(delay, (retryAfterSeconds || 0) * 1000);
}
