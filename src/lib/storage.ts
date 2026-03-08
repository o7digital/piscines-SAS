import { logs as mockLogs, type LogEntry } from "../data/mock";
import { sortLogsDesc } from "./monitoring";

const STORAGE_KEY = "poolguardian.logs";

const cloneMockLogs = () => sortLogsDesc(mockLogs.map((entry) => ({ ...entry })));

export function loadLogs(): LogEntry[] {
  if (typeof window === "undefined") {
    return cloneMockLogs();
  }

  try {
    const storedValue = window.localStorage.getItem(STORAGE_KEY);

    if (!storedValue) {
      return cloneMockLogs();
    }

    const parsed = JSON.parse(storedValue);

    if (!Array.isArray(parsed)) {
      return cloneMockLogs();
    }

    return sortLogsDesc(parsed as LogEntry[]);
  } catch {
    return cloneMockLogs();
  }
}

export function saveLogs(nextLogs: LogEntry[]): void {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(sortLogsDesc(nextLogs)));
  } catch {
    return;
  }
}

export function addLog(entry: LogEntry): LogEntry[] {
  const nextLogs = sortLogsDesc([...loadLogs(), entry]);
  saveLogs(nextLogs);
  return nextLogs;
}
