import type { LogEntry, Pool, Property } from "../data/mock";

export const thresholds = {
  phMin: 7.2,
  phMax: 7.6,
  chlorineMin: 1,
  chlorineMax: 3,
  maxLogAgeHours: 36,
} as const;

export function sortLogsDesc(logs: LogEntry[]): LogEntry[] {
  return [...logs].sort((left, right) => {
    return new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime();
  });
}

export function formatDateTime(value: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function isWaterAttention(log: LogEntry): boolean {
  return (
    log.ph < thresholds.phMin ||
    log.ph > thresholds.phMax ||
    log.chlorine < thresholds.chlorineMin ||
    log.chlorine > thresholds.chlorineMax
  );
}

export function isSafetyAttention(log: LogEntry): boolean {
  return log.coverOpen || !log.gateLocked || !log.signageOk;
}

export function isLogAttention(log: LogEntry): boolean {
  return isWaterAttention(log) || isSafetyAttention(log);
}

export function getSafetyFlags(log: LogEntry): string[] {
  const flags: string[] = [];

  if (log.coverOpen) {
    flags.push("Cover open");
  }

  if (!log.gateLocked) {
    flags.push("Gate unlocked");
  }

  if (!log.signageOk) {
    flags.push("Signage issue");
  }

  return flags.length > 0 ? flags : ["All checks passed"];
}

export function getLatestLogsByPool(logs: LogEntry[]): Map<string, LogEntry> {
  const latestByPool = new Map<string, LogEntry>();

  for (const log of sortLogsDesc(logs)) {
    if (!latestByPool.has(log.poolId)) {
      latestByPool.set(log.poolId, log);
    }
  }

  return latestByPool;
}

export function isLogOverdue(log: LogEntry, now = new Date()): boolean {
  return now.getTime() - new Date(log.createdAt).getTime() > thresholds.maxLogAgeHours * 60 * 60 * 1000;
}

export function getDashboardStats(pools: Pool[], logs: LogEntry[], now = new Date()) {
  const latestByPool = getLatestLogsByPool(logs);
  let poolsOk = 0;
  let needsAttention = 0;
  let overdueChecks = 0;

  for (const pool of pools) {
    const latestLog = latestByPool.get(pool.id);

    if (!latestLog || isLogOverdue(latestLog, now)) {
      overdueChecks += 1;
      continue;
    }

    if (isLogAttention(latestLog)) {
      needsAttention += 1;
      continue;
    }

    poolsOk += 1;
  }

  const reportsReady = new Set(
    logs
      .filter((log) => {
        const logDate = new Date(log.createdAt);
        return logDate.getMonth() === now.getMonth() && logDate.getFullYear() === now.getFullYear();
      })
      .map((log) => log.propertyId),
  ).size;

  return { poolsOk, needsAttention, overdueChecks, reportsReady };
}

export function getPropertyLastCheck(propertyId: string, logs: LogEntry[]): LogEntry | null {
  return sortLogsDesc(logs).find((log) => log.propertyId === propertyId) ?? null;
}

export function getPropertyHealth(
  property: Property,
  pools: Pool[],
  logs: LogEntry[],
  now = new Date(),
): Property["status"] {
  const propertyPools = pools.filter((pool) => pool.propertyId === property.id);
  const latestByPool = getLatestLogsByPool(logs);

  for (const pool of propertyPools) {
    const latestLog = latestByPool.get(pool.id);

    if (!latestLog) {
      continue;
    }

    if (isLogOverdue(latestLog, now) || isLogAttention(latestLog)) {
      return "attention";
    }
  }

  return property.status;
}
