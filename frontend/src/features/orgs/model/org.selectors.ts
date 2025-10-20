// src/features/orgs/model/org.selectors.ts
import {
  DATE_FMT,
  COMPACT_NUMBER,
  MAX_FACTORY_CYCLES,
  MIN_FACTORY_CYCLES,
  ONE_T,
} from "./org.constants";
import type {
  OrgRecord,
  OrgStatus,
  Visibility,
  Plan,
  SortOrder,
  StatusFilter,
} from "./org.types";

// ---------- Variants / basic transforms ----------
export const toStatus = (statusVariant: Record<string, unknown>): OrgStatus =>
  "Archived" in statusVariant ? "Archived" : "Active";

export const toVisibility = (v: Record<string, unknown>): Visibility =>
  "Private" in v ? "Private" : "Public";

export const toPlan = (p: Record<string, unknown>): Plan =>
  "Trial" in p ? "Trial" : "BasicPending" in p ? "BasicPending" : "Basic";

export const parseCycles = (value?: string | bigint): bigint => {
  try {
    if (typeof value === "bigint") return value;
    if (!value) return 0n;
    return BigInt(value);
  } catch {
    return 0n;
  }
};

// % of MAX_FACTORY_CYCLES, clamped 0..100
export const percentOfMaxCycles = (value?: string | bigint): number => {
  const v = parseCycles(value);
  if (v <= 0n) return 0;
  const pct = Number((v * 100n) / MAX_FACTORY_CYCLES);
  return Math.max(0, Math.min(100, pct));
};

// ---------- Formatting helpers (BigInt-safe compaction) ----------
const THRESHOLDS: Array<{ value: bigint; label: string }> = [
  { value: 1_000_000_000_000_000_000n, label: "E" },
  { value: 1_000_000_000_000_000n, label: "P" },
  { value: 1_000_000_000_000n, label: "T" },
  { value: 1_000_000_000n, label: "B" },
  { value: 1_000_000n, label: "M" },
  { value: 1_000n, label: "K" },
];

export const formatCycles = (value?: string | bigint): string => {
  const cycles = parseCycles(value);
  if (cycles === 0n) return "-";

  for (const { value: threshold, label } of THRESHOLDS) {
    if (cycles >= threshold) {
      // Integer math to avoid precision loss converting BigInt → Number
      const scaledTimes10 = (cycles * 10n) / threshold; // e.g., 12.3 -> 123n
      const intPart = scaledTimes10 / 10n;
      const fracPart = Number(scaledTimes10 % 10n);
      return `${intPart.toString()}${fracPart ? "." + fracPart : ""} ${label}`;
    }
  }
  return cycles.toString();
};

export const formatNumericString = (value?: string): string => {
  if (!value) return "-";
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return COMPACT_NUMBER.format(num);
};

export const normalizeTimestamp = (value?: number): number | null => {
  if (!value) return null;
  // heuristics: ns/us/ms/seconds
  if (value > 1e15) return Math.floor(value / 1_000_000); // ns → ms
  if (value > 1e12) return Math.floor(value / 1_000); // µs → ms
  if (value > 1e11) return Math.floor(value); // ms
  return Math.floor(value * 1000); // seconds → ms
};

export const formatTimestamp = (value?: number): string | null => {
  const ms = normalizeTimestamp(value);
  if (!ms) return null;
  return DATE_FMT.format(new Date(ms));
};

export const daysUntil = (expiresAt?: number): number | null => {
  const ms = normalizeTimestamp(expiresAt);
  if (!ms) return null;
  const diff = ms - Date.now();
  return Math.ceil(diff / (24 * 60 * 60 * 1000));
};

// ---------- Filtering / sorting / aggregates ----------
export const filterRecords = (
  records: OrgRecord[],
  opts: {
    searchTerm?: string;
    statusFilter?: StatusFilter;
    planFilter?: "all" | OrgRecord["plan"];
  }
): OrgRecord[] => {
  const search = (opts.searchTerm ?? "").trim().toLowerCase();
  const statusFilter = opts.statusFilter ?? "all";
  const planFilter = opts.planFilter ?? "all";

  return records.filter((org) => {
    const matchesSearch =
      !search ||
      org.id.toLowerCase().includes(search) ||
      org.name.toLowerCase().includes(search);

    const stopped = Boolean(org.isStopped);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "active" && org.status === "Active" && !stopped) ||
      (statusFilter === "archived" && org.status === "Archived") ||
      (statusFilter === "stopped" && stopped);

    const plan = org.plan ?? "Basic";
    const matchesPlan = planFilter === "all" || plan === planFilter;

    return matchesSearch && matchesStatus && matchesPlan;
  });
};

export const sortRecords = (records: OrgRecord[], order: SortOrder): OrgRecord[] => {
  const copy = [...records];
  switch (order) {
    case "name":
      copy.sort((a, b) => a.name.localeCompare(b.name));
      break;
    case "usage": {
      const toNum = (s?: string) => (s ? Number(s) || 0 : 0);
      copy.sort((a, b) => toNum(b.txCount) - toNum(a.txCount));
      break;
    }
    case "recent":
    default:
      copy.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }
  return copy;
};

export const totalsFromOwned = (owned: OrgRecord[]) => {
  const totalCycles = owned.reduce((acc, o) => acc + parseCycles(o.cycles), 0n);
  const totalMembers = owned.reduce((acc, o) => acc + (Number(o.users || "0") || 0), 0);
  const totalTransactions = owned.reduce((acc, o) => acc + (Number(o.txCount || "0") || 0), 0);
  const totalActiveOwned = owned.filter((o) => o.status === "Active" && !o.isStopped).length;

  return { totalCycles, totalMembers, totalTransactions, totalActiveOwned };
};

export const lowReserveList = (owned: OrgRecord[]): OrgRecord[] =>
  owned.filter((o) => {
    const c = parseCycles(o.cycles);
    return c > 0n && c < MIN_FACTORY_CYCLES;
  });

// Small helper for UI progress bars
export const reservePercent = (value?: string | bigint): number =>
  percentOfMaxCycles(value);

// Find the lowest-reserve org among those below threshold
export const highlightLowestReserve = (
  owned: OrgRecord[]
): { org: OrgRecord; cycles: bigint } | null => {
  const low = lowReserveList(owned);
  if (!low.length) return null;
  return low.reduce<{ org: OrgRecord; cycles: bigint } | null>((acc, org) => {
    const c = parseCycles(org.cycles);
    if (!acc) return { org, cycles: c };
    return c < acc.cycles ? { org, cycles: c } : acc;
  }, null);
};

// Guard for daily cap messaging (Basic plan)
export const remainingDailyTopUp = (usedTodayCycles: bigint): bigint => {
  if (usedTodayCycles >= ONE_T) return 0n;
  return ONE_T - usedTodayCycles;
};
