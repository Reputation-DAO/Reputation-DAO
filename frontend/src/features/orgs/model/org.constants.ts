// src/features/orgs/model/org.constants.ts

// Cycle thresholds (aligned with backend; UI still uses these)
export const MAX_FACTORY_CYCLES = 1_500_000_000_000n; // 1.5T
export const MIN_FACTORY_CYCLES =   900_000_000_000n; // 0.9T

// Backend policy mirrors (useful for UI labels)
export const ONE_T = 1_000_000_000_000n; // 1T cycles (daily cap for Basic)
export const DAY_MS = 86_400_000;        // 24h
export const MONTH_MS = 30 * DAY_MS;

export const COMPACT_NUMBER = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

export const DECIMAL_NUMBER = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

export const DATE_FMT = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});
