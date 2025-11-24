// src/features/dashboard/pages/EconomySettingsPage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Principal } from "@dfinity/principal";
import { Buffer } from "buffer";
import { toast } from "sonner";

import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { DashboardLayout, SidebarTrigger } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import WalletCopyBadge from "../components/WalletCopyBadge";
import { AlertTriangle, Coins, RefreshCw, Save, ArrowDownToLine, Copy } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type {
  OrgConfig as TreasuryOrgConfig,
  _SERVICE as TreasuryActor,
  VaultBalance as TreasuryVaultBalance,
} from "@/declarations/treasury/treasury.did";
import { getTreasuryCanisterId } from "@/lib/canisters";
import { principalToAccountIdentifier } from "@/utils/accountIdentifier";

type RailToggle = { btc: boolean; icp: boolean; eth: boolean };
type Thresholds = { btcMin: string; icpMin: string; ethMin: string };

type MicroTipsConfig = {
  enabled: boolean;
  btcTipAmount: string;
  icpTipAmount: string;
  ethTipAmount: string;
  maxBtcPerPeriod: string;
  maxIcpPerPeriod: string;
  maxEthPerPeriod: string;
  maxEventsPerWindow: string;
};

type ScheduledConfig = {
  enabled: boolean;
  frequency: "Monthly";
  maxBtcPerCycle: string;
  maxIcpPerCycle: string;
  maxEthPerCycle: string;
};

type ComplianceConfig = {
  kycRequired: boolean;
  tagWhitelist: string[];
};

export type OrgEconomyConfig = {
  rails: RailToggle;
  thresholds: Thresholds;
  microTips: MicroTipsConfig;
  scheduled: ScheduledConfig;
  compliance: ComplianceConfig;
};

const defaultTreasuryConfig: TreasuryOrgConfig = {
  rails: { btc: false, icp: false, eth: false },
  thresholds: { btcMin: 0n, icpMin: 0n, ethMin: 0n },
  microTips: {
    enabled: false,
    btcTipAmount: 0n,
    icpTipAmount: 0n,
    ethTipAmount: 0n,
    maxBtcPerPeriod: 0n,
    maxIcpPerPeriod: 0n,
    maxEthPerPeriod: 0n,
    maxEventsPerWindow: 0n,
  },
  scheduled: {
    enabled: false,
    frequency: { Monthly: null },
    maxBtcPerCycle: 0n,
    maxIcpPerCycle: 0n,
    maxEthPerCycle: 0n,
    tiers: [],
  },
  compliance: {
    kycRequired: false,
    tagWhitelist: [],
  },
  deadman: {
    enabled: false,
    inactivityThresholdSeconds: 0n,
  },
  spendControl: [],
};

const numericMask = (value: string, allowDecimal = false) => {
  const pattern = allowDecimal ? /[^\d.]/g : /[^\d]/g;
  const cleaned = value.replace(pattern, "");
  if (!allowDecimal) return cleaned;
  const parts = cleaned.split(".");
  if (parts.length <= 1) return cleaned;
  return `${parts[0]}.${parts.slice(1).join("")}`;
};

const digitsOnly = (value: string) => numericMask(value, false);

const RAIL_DECIMALS: Record<RailSymbol, number> = {
  BTC: 8,
  ICP: 8,
  ETH: 18,
};
const RAILS: RailSymbol[] = ["BTC", "ICP", "ETH"];
const VAULT_KEY: Record<RailSymbol, "btc" | "icp" | "eth"> = { BTC: "btc", ICP: "icp", ETH: "eth" };
const RAIL_TAG: Record<RailSymbol, number> = { BTC: 0, ICP: 1, ETH: 2 };

const treasuryCanisterId = getTreasuryCanisterId();
const ECONOMY_SCROLL_KEY = "economy-settings:scroll";

const toDefaultSubaccountHex = (orgId: string, rail: RailSymbol) => {
  try {
    const principal = Principal.fromText(orgId);
    const orgBytes = Array.from(principal.toUint8Array());
    const buf = new Uint8Array(32);
    for (let i = 0; i < 31; i++) {
      buf[i] = orgBytes[i] ?? 0;
    }
    buf[31] = RAIL_TAG[rail] ?? 0;
    return Buffer.from(buf).toString("hex").toUpperCase();
  } catch {
    return "";
  }
};

const formatDecimal = (value: bigint, decimals: number) => {
  if (decimals <= 0) return value.toString();
  const negative = value < 0n;
  const absValue = negative ? -value : value;
  const str = absValue.toString().padStart(decimals + 1, "0");
  const integerPart = str.slice(0, -decimals) || "0";
  const fraction = str.slice(-decimals).replace(/0+$/, "");
  const formatted = fraction ? `${integerPart}.${fraction}` : integerPart;
  return negative ? `-${formatted}` : formatted;
};

const parseDecimalInput = (value: string, decimals: number) => {
  const sanitized = numericMask(value, decimals > 0);
  if (!sanitized) return 0n;
  if (decimals === 0) {
    try {
      return BigInt(sanitized);
    } catch {
      return 0n;
    }
  }
  const [wholeRaw, fractionRaw = ""] = sanitized.split(".");
  const whole = wholeRaw || "0";
  const trimmedFraction = fractionRaw.slice(0, decimals);
  const paddedFraction = trimmedFraction.padEnd(decimals, "0");
  const combined = `${whole}${paddedFraction}`;
  try {
    return BigInt(combined.replace(/^0+(?=\d)/, ""));
  } catch {
    return 0n;
  }
};

const decimalsForKey = (key: string): number => {
  const lower = key.toLowerCase();
  if (lower.includes("btc")) return RAIL_DECIMALS.BTC;
  if (lower.includes("eth")) return RAIL_DECIMALS.ETH;
  if (lower.includes("icp")) return RAIL_DECIMALS.ICP;
  return 0;
};

const formatAmountForKey = (value: bigint, key: string) => formatDecimal(value ?? 0n, decimalsForKey(key));
const parseAmountForKey = (value: string, key: string) => parseDecimalInput(value, decimalsForKey(key));
const railsAllowDecimal = (key: string) => decimalsForKey(key) > 0;
type RailSymbol = "BTC" | "ICP" | "ETH";

const railVariant = (symbol: RailSymbol) =>
  symbol === "BTC" ? ({ BTC: null } as const) : symbol === "ICP" ? ({ ICP: null } as const) : ({ ETH: null } as const);

const ICP_ACCOUNT_ID_HEX = /^[0-9a-fA-F]{64}$/;
const BTC_LEGACY_ADDRESS = /^[13][a-km-zA-HJ-NP-Z1-9]{25,39}$/;
const BTC_BECH32_ADDRESS = /^(bc1|tb1)[0-9ac-hj-np-z]{11,71}$/i;
const BTC_LEDGER_ACCOUNT = /^[0-9a-fA-F]{64}$/;
const ETH_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const ETH_LEDGER_ACCOUNT = /^[0-9a-fA-F]{64}$/;
const READ_STATE_ERROR_PATTERNS = [
  "invalid certificate",
  "invalid read state",
  "fail to decode read state response",
  "ic0503",
];

const isValidIcpDestination = (value: string) => {
  if (!value) return false;
  try {
    Principal.fromText(value);
    return true;
  } catch {
    return ICP_ACCOUNT_ID_HEX.test(value);
  }
};

const isValidBtcDestination = (value: string) =>
  BTC_LEGACY_ADDRESS.test(value) || BTC_BECH32_ADDRESS.test(value) || BTC_LEDGER_ACCOUNT.test(value);

const isValidEthDestination = (value: string) => ETH_ADDRESS.test(value) || ETH_LEDGER_ACCOUNT.test(value);

const normalizeOrgConfig = (cfg?: TreasuryOrgConfig | null): TreasuryOrgConfig => {
  const base = cfg ?? defaultTreasuryConfig;
  return {
    rails: { ...defaultTreasuryConfig.rails, ...base.rails },
    thresholds: { ...defaultTreasuryConfig.thresholds, ...base.thresholds },
    microTips: { ...defaultTreasuryConfig.microTips, ...base.microTips },
    scheduled: {
      ...defaultTreasuryConfig.scheduled,
      ...base.scheduled,
      tiers: (base.scheduled?.tiers ?? []).map((tier) => ({ ...tier })),
    },
    compliance: { ...defaultTreasuryConfig.compliance, ...base.compliance },
    deadman: { ...defaultTreasuryConfig.deadman, ...base.deadman },
    spendControl: base.spendControl ? [...base.spendControl] : [],
  };
};

const mapOrgConfigToUi = (cfg: TreasuryOrgConfig): OrgEconomyConfig => ({
  rails: { ...cfg.rails },
  thresholds: {
    btcMin: formatAmountForKey(cfg.thresholds.btcMin, "btcMin"),
    icpMin: formatAmountForKey(cfg.thresholds.icpMin, "icpMin"),
    ethMin: formatAmountForKey(cfg.thresholds.ethMin, "ethMin"),
  },
  microTips: {
    enabled: cfg.microTips.enabled,
    btcTipAmount: formatAmountForKey(cfg.microTips.btcTipAmount, "btcTipAmount"),
    icpTipAmount: formatAmountForKey(cfg.microTips.icpTipAmount, "icpTipAmount"),
    ethTipAmount: formatAmountForKey(cfg.microTips.ethTipAmount, "ethTipAmount"),
    maxBtcPerPeriod: formatAmountForKey(cfg.microTips.maxBtcPerPeriod, "maxBtcPerPeriod"),
    maxIcpPerPeriod: formatAmountForKey(cfg.microTips.maxIcpPerPeriod, "maxIcpPerPeriod"),
    maxEthPerPeriod: formatAmountForKey(cfg.microTips.maxEthPerPeriod, "maxEthPerPeriod"),
    maxEventsPerWindow: formatAmountForKey(cfg.microTips.maxEventsPerWindow, "maxEventsPerWindow"),
  },
  scheduled: {
    enabled: cfg.scheduled.enabled,
    frequency: "Monthly",
    maxBtcPerCycle: formatAmountForKey(cfg.scheduled.maxBtcPerCycle, "maxBtcPerCycle"),
    maxIcpPerCycle: formatAmountForKey(cfg.scheduled.maxIcpPerCycle, "maxIcpPerCycle"),
    maxEthPerCycle: formatAmountForKey(cfg.scheduled.maxEthPerCycle, "maxEthPerCycle"),
  },
  compliance: {
    kycRequired: cfg.compliance.kycRequired,
    tagWhitelist: [...cfg.compliance.tagWhitelist],
  },
});

const mergeOrgConfig = (ui: OrgEconomyConfig, base: TreasuryOrgConfig): TreasuryOrgConfig => ({
  ...base,
  rails: { ...ui.rails },
  thresholds: {
    btcMin: parseAmountForKey(ui.thresholds.btcMin, "btcMin"),
    icpMin: parseAmountForKey(ui.thresholds.icpMin, "icpMin"),
    ethMin: parseAmountForKey(ui.thresholds.ethMin, "ethMin"),
  },
  microTips: {
    ...base.microTips,
    enabled: ui.microTips.enabled,
    btcTipAmount: parseAmountForKey(ui.microTips.btcTipAmount, "btcTipAmount"),
    icpTipAmount: parseAmountForKey(ui.microTips.icpTipAmount, "icpTipAmount"),
    ethTipAmount: parseAmountForKey(ui.microTips.ethTipAmount, "ethTipAmount"),
    maxBtcPerPeriod: parseAmountForKey(ui.microTips.maxBtcPerPeriod, "maxBtcPerPeriod"),
    maxIcpPerPeriod: parseAmountForKey(ui.microTips.maxIcpPerPeriod, "maxIcpPerPeriod"),
    maxEthPerPeriod: parseAmountForKey(ui.microTips.maxEthPerPeriod, "maxEthPerPeriod"),
    maxEventsPerWindow: parseAmountForKey(ui.microTips.maxEventsPerWindow, "maxEventsPerWindow"),
  },
  scheduled: {
    ...base.scheduled,
    enabled: ui.scheduled.enabled,
    frequency: ui.scheduled.frequency === "Monthly" ? { Monthly: null } : base.scheduled.frequency,
    maxBtcPerCycle: parseAmountForKey(ui.scheduled.maxBtcPerCycle, "maxBtcPerCycle"),
    maxIcpPerCycle: parseAmountForKey(ui.scheduled.maxIcpPerCycle, "maxIcpPerCycle"),
    maxEthPerCycle: parseAmountForKey(ui.scheduled.maxEthPerCycle, "maxEthPerCycle"),
  },
  compliance: {
    ...base.compliance,
    kycRequired: ui.compliance.kycRequired,
    tagWhitelist: [...ui.compliance.tagWhitelist],
  },
});

type EconomyHookState = {
  config: OrgEconomyConfig | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  dirty: boolean;
  update: (updater: (prev: OrgEconomyConfig) => OrgEconomyConfig) => void;
  save: () => Promise<void>;
  reset: () => void;
  reload: () => Promise<void>;
  vaultBalance: TreasuryVaultBalance | null;
  refreshVault: () => Promise<void>;
};

function useOrgEconomyConfig(cid?: string): EconomyHookState {
  const { getTreasuryActor, isAuthenticated } = useAuth();
  const [config, setConfig] = useState<OrgEconomyConfig | null>(null);
  const [initial, setInitial] = useState<OrgEconomyConfig | null>(null);
  const [rawConfig, setRawConfig] = useState<TreasuryOrgConfig | null>(null);
  const [orgPrincipal, setOrgPrincipal] = useState<Principal | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vaultBalance, setVaultBalance] = useState<TreasuryVaultBalance | null>(null);

  const loadConfig = useCallback(async () => {
    if (!cid) {
      setConfig(null);
      setInitial(null);
      setRawConfig(null);
      setOrgPrincipal(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const orgId = Principal.fromText(cid);
      setOrgPrincipal(orgId);

      if (!isAuthenticated) {
        throw new Error("Connect a wallet with admin rights to configure this organization.");
      }

      const treasury = await getTreasuryActor();
      const result = await treasury.getOrgConfig(orgId);
      const treasuryConfig = normalizeOrgConfig(result.length ? result[0] : null);
      const vault = await treasury.getOrgVaultBalance(orgId);
      const uiConfig = mapOrgConfigToUi(treasuryConfig);

      setRawConfig(treasuryConfig);
      setConfig(uiConfig);
      setInitial(uiConfig);
      setVaultBalance(vault);
    } catch (err: unknown) {
      const rawMessage = err instanceof Error ? err.message : String(err);
      const message =
        rawMessage?.includes("Invalid principal")
          ? "Invalid organization canister id."
          : rawMessage || "Failed to load treasury config.";
      setError(message);
      setConfig(null);
      setInitial(null);
      setRawConfig(null);
      setVaultBalance(null);
    } finally {
      setLoading(false);
    }
  }, [cid, getTreasuryActor, isAuthenticated]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  const dirty = useMemo(() => {
    if (!config || !initial) return false;
    return JSON.stringify(config) !== JSON.stringify(initial);
  }, [config, initial]);

  const update = (updater: (prev: OrgEconomyConfig) => OrgEconomyConfig) => {
    setConfig((prev) => (prev ? updater(prev) : prev));
  };

  const save = async () => {
    if (!config || !rawConfig || !orgPrincipal) return;
    setSaving(true);
    setError(null);
    try {
      const treasury = await getTreasuryActor();
      const merged = mergeOrgConfig(config, rawConfig);
      await treasury.updateOrgConfig(orgPrincipal, merged);
      setInitial(config);
      setRawConfig(merged);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save economy settings.";
      setError(message);
      setSaving(false);
      throw (err instanceof Error ? err : new Error(message));
    }
    setSaving(false);
  };

  const reset = () => {
    if (initial) setConfig(initial);
  };

  const refreshVault = useCallback(async () => {
    if (!orgPrincipal) return;
    try {
      const treasury = await getTreasuryActor();
      const vault = await treasury.getOrgVaultBalance(orgPrincipal);
      setVaultBalance(vault);
    } catch (err) {
      console.warn("Failed to refresh vault balance", err);
    }
  }, [getTreasuryActor, orgPrincipal]);

  return { config, loading, saving, error, dirty, update, save, reset, reload: loadConfig, vaultBalance, refreshVault };
}

export default function EconomySettingsPage() {
  const navigate = useNavigate();
  const { cid } = useParams<{ cid: string }>();
  const { isAuthenticated, principal, getTreasuryActor } = useAuth();
  const { isAdmin, loading: roleLoading, userRole, userName, currentPrincipal } = useRole();

  const [submitting, setSubmitting] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [depositing, setDepositing] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState(() => ({
    rail: "ICP" as RailSymbol,
    amount: "",
    destination: "",
    memo: "",
  }));
  const [depositForm, setDepositForm] = useState(() => ({
    rail: "ICP" as RailSymbol,
    amount: "",
    memo: "",
  }));
  const [depositStatus, setDepositStatus] = useState<{
    account: { owner: string; subaccount: Uint8Array | number[] | null };
    ledgerBalance: bigint;
    creditedBalance: bigint;
    available: bigint;
  } | null>(null);
  const [depositStatusLoading, setDepositStatusLoading] = useState(false);

  const restoreScrollPosition = useCallback(() => {
    if (typeof window === "undefined") return;
    const stored = sessionStorage.getItem(ECONOMY_SCROLL_KEY);
    if (!stored) return;
    const parsed = parseInt(stored, 10);
    if (Number.isNaN(parsed)) return;
    requestAnimationFrame(() => window.scrollTo(0, parsed));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    restoreScrollPosition();
    const handleScroll = () => {
      sessionStorage.setItem(ECONOMY_SCROLL_KEY, String(window.scrollY));
    };
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        restoreScrollPosition();
      }
    };
    const handleFocus = () => restoreScrollPosition();
    window.addEventListener("scroll", handleScroll);
    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("focus", handleFocus);
    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("focus", handleFocus);
    };
  }, [restoreScrollPosition]);

  const {
    config,
    loading,
    dirty,
    saving,
    update,
    reset,
    save: persistConfig,
    error,
    reload,
    vaultBalance,
    refreshVault,
  } = useOrgEconomyConfig(cid);

  useEffect(() => {
    if (!roleLoading && !loading) {
      restoreScrollPosition();
    }
  }, [roleLoading, loading, restoreScrollPosition]);

  const sidebarPrincipal = currentPrincipal?.toText() || principal?.toText() || "";

  const refreshDepositStatus = useCallback(async () => {
    if (!cid || !isAuthenticated) {
      setDepositStatus(null);
      return;
    }
    setDepositStatusLoading(true);
    try {
      const treasury = await getTreasuryActor();
      const orgPrincipal = Principal.fromText(cid);
      const res = await treasury.getOrgDepositStatus(orgPrincipal, railVariant(depositForm.rail));
      if ("ok" in res) {
        const accountSub = res.ok.account.subaccount.length ? res.ok.account.subaccount[0] : null;
        const ownerValue = res.ok.account.owner as unknown;
        const ownerText =
          typeof (ownerValue as any)?.toText === "function"
            ? (ownerValue as any).toText()
            : String(ownerValue);
        setDepositStatus({
          account: {
            owner: ownerText,
            subaccount: accountSub,
          },
          ledgerBalance: res.ok.ledgerBalance,
          creditedBalance: res.ok.creditedBalance,
          available: res.ok.available,
        });
      } else {
        setDepositStatus(null);
        toast.error(res.err || "Unable to fetch deposit status");
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to refresh deposit status";
      toast.error(message);
      setDepositStatus(null);
    } finally {
      setDepositStatusLoading(false);
    }
  }, [cid, depositForm.rail, getTreasuryActor, isAuthenticated]);

  useEffect(() => {
    refreshDepositStatus();
  }, [refreshDepositStatus]);

  const depositDetails = useMemo(() => {
    if (!cid) return null;
    const subaccountHex =
      depositStatus?.account?.subaccount && depositStatus.account.subaccount.length
        ? Buffer.from(Uint8Array.from(depositStatus.account.subaccount)).toString("hex").toUpperCase()
        : toDefaultSubaccountHex(cid, depositForm.rail);
    if (!subaccountHex) return null;
    const owner = depositStatus?.account?.owner || treasuryCanisterId;
    const supportsAccountId = depositForm.rail === "ICP" || depositForm.rail === "BTC" || depositForm.rail === "ETH";
    const accountId = supportsAccountId ? principalToAccountIdentifier(owner, subaccountHex) : null;
    return { owner, subaccountHex, accountId };
  }, [cid, depositForm.rail, depositStatus]);

  const depositAssetLabel = useMemo(() => {
    switch (depositForm.rail) {
      case "BTC":
        return "ckBTC";
      case "ETH":
        return "ckETH";
      default:
        return "ICP";
    }
  }, [depositForm.rail]);
  const depositRailDecimals = RAIL_DECIMALS[depositForm.rail];
  const copyToClipboard = useCallback((label: string, value: string) => {
    if (!value) return;
    navigator.clipboard
      ?.writeText(value)
      .then(() => toast.success(`${label} copied`))
      .catch(() => toast.error(`Unable to copy ${label}`));
  }, []);
  const formatVault = (symbol: RailSymbol) => {
    const key = VAULT_KEY[symbol];
    const raw = vaultBalance ? vaultBalance[key] : 0n;
    return formatDecimal(raw ?? 0n, RAIL_DECIMALS[symbol]);
  };
  const withdrawRailRaw = useMemo(() => {
    if (!vaultBalance) return 0n;
    const key = VAULT_KEY[withdrawForm.rail];
    return vaultBalance?.[key] ?? 0n;
  }, [vaultBalance, withdrawForm.rail]);

  const parsedWithdrawAmount = useMemo(
    () => parseDecimalInput(withdrawForm.amount, RAIL_DECIMALS[withdrawForm.rail]),
    [withdrawForm.amount, withdrawForm.rail]
  );

  const withdrawDestinationError = useMemo(() => {
    const trimmed = withdrawForm.destination.trim();
    if (withdrawForm.rail === "BTC" || withdrawForm.rail === "ETH") {
      if (!trimmed) return "Destination address is required for this rail.";
      if (withdrawForm.rail === "BTC" && !isValidBtcDestination(trimmed)) return "Enter a valid BTC or ckBTC address.";
      if (withdrawForm.rail === "ETH" && !isValidEthDestination(trimmed)) return "Enter a valid ETH or ckETH address.";
      return null;
    }
    if (withdrawForm.rail === "ICP" && trimmed && !isValidIcpDestination(trimmed)) {
      return "Enter a valid ICP principal or 64-character account identifier.";
    }
    return null;
  }, [withdrawForm.destination, withdrawForm.rail]);

  const withdrawAmountError = useMemo(() => {
    if (!withdrawForm.amount.trim()) return "Enter an amount to withdraw.";
    if (parsedWithdrawAmount <= 0n) return "Amount must be greater than zero.";
    if (parsedWithdrawAmount > withdrawRailRaw) return "Amount exceeds available vault balance.";
    return null;
  }, [parsedWithdrawAmount, withdrawForm.amount, withdrawRailRaw]);

  const canSubmitWithdraw = !withdrawing && !withdrawAmountError && !withdrawDestinationError;

  const handleRailToggle = (rail: keyof RailToggle, value: boolean) =>
    update((prev) => ({
      ...prev,
      rails: { ...prev.rails, [rail]: value },
    }));

  const handleThresholdChange = (rail: keyof Thresholds, value: string) =>
    update((prev) => ({
      ...prev,
      thresholds: {
        ...prev.thresholds,
        [rail]: railsAllowDecimal(String(rail)) ? numericMask(value, true) : digitsOnly(value),
      },
    }));

  const handleMicroTipChange = (field: keyof MicroTipsConfig, value: string | boolean) =>
    update((prev) => ({
      ...prev,
      microTips: {
        ...prev.microTips,
        [field]:
          typeof value === "string"
            ? railsAllowDecimal(String(field))
              ? numericMask(value, true)
              : digitsOnly(value)
            : value,
      },
    }));

  const handleScheduledChange = (field: keyof ScheduledConfig, value: string | boolean) =>
    update((prev) => ({
      ...prev,
      scheduled: {
        ...prev.scheduled,
        [field]:
          typeof value === "string" && field !== "frequency"
            ? railsAllowDecimal(String(field))
              ? numericMask(value, true)
              : digitsOnly(value)
            : value,
      },
    }));

  const handleComplianceChange = (field: keyof ComplianceConfig, value: boolean | string[]) =>
    update((prev) => ({
      ...prev,
      compliance: {
        ...prev.compliance,
        [field]: value,
      },
    }));

  const tagValue = config?.compliance.tagWhitelist.join(", ") ?? "";

  const canStopAll =
    !!config &&
    (config.microTips.enabled || config.scheduled.enabled || config.rails.btc || config.rails.icp || config.rails.eth);

  const onSave = async () => {
    if (!dirty || !config) return;
    setSubmitting(true);
    try {
      await persistConfig();
      toast.success("Economy settings saved");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to save economy settings";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleStopAll = () => {
    update((prev) => ({
      ...prev,
      rails: { btc: false, icp: false, eth: false },
      microTips: { ...prev.microTips, enabled: false },
      scheduled: { ...prev.scheduled, enabled: false },
    }));
    toast.message("Payout rails disabled. Don’t forget to save your changes.");
  };

  const handleWithdraw = async () => {
    if (!cid || !config) return;
    if (config.microTips.enabled || config.scheduled.enabled) {
      toast.error("Disable micro-tips and scheduled payouts before withdrawing.");
      return;
    }
    if (withdrawAmountError || withdrawDestinationError) {
      toast.error(withdrawAmountError || withdrawDestinationError || "Invalid withdrawal request.");
      return;
    }
    const amount = parsedWithdrawAmount;
    if (!amount || amount <= 0n) {
      toast.error("Enter an amount to withdraw.");
      return;
    }
    try {
      setWithdrawing(true);
      const treasury: TreasuryActor = await getTreasuryActor();
      const orgPrincipal = Principal.fromText(cid);
      const memoArg = withdrawForm.memo ? [withdrawForm.memo] : [];
      const destination = withdrawForm.destination.trim();
      const response = await treasury.withdrawOrgVault(
        orgPrincipal,
        railVariant(withdrawForm.rail),
        amount,
        destination,
        memoArg
      );
      toast.success(typeof response === "string" ? response : "Withdrawal submitted");
      setWithdrawForm((prev) => ({ ...prev, amount: "", memo: "" }));
      await refreshVault();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to withdraw funds";
      const lowered = message.toLowerCase();
      const isReadStateError = READ_STATE_ERROR_PATTERNS.some((pattern) => lowered.includes(pattern));
      if (isReadStateError) {
        toast.info("Withdrawal submitted. Network confirmation may take a few seconds—verify balances shortly.");
        await refreshVault();
      } else {
        toast.error(message);
      }
    } finally {
      setWithdrawing(false);
    }
  };

  const handleDeposit = async () => {
    if (!cid) return;
    const decimals = RAIL_DECIMALS[depositForm.rail];
    const amount = parseDecimalInput(depositForm.amount, decimals);
    if (amount <= 0n) {
      toast.error("Enter a deposit amount.");
      return;
    }
    if (!depositStatus) {
      toast.error("Refresh the deposit status before recording funds.");
      return;
    }
    if (depositStatus.available <= 0n) {
      toast.error("No uncredited deposits detected for this rail.");
      return;
    }
    if (amount > depositStatus.available) {
      toast.error(
        `Only ${formatDecimal(depositStatus.available, decimals)} ${depositForm.rail} available to credit from the ledger.`
      );
      return;
    }
    try {
      setDepositing(true);
      const treasury: TreasuryActor = await getTreasuryActor();
      const orgPrincipal = Principal.fromText(cid);
      const memoArg = depositForm.memo ? [depositForm.memo] : [];
      if (treasury.recordOrgDeposit) {
        await treasury.recordOrgDeposit(orgPrincipal, railVariant(depositForm.rail), amount, memoArg);
      } else {
        await treasury.notifyLedgerDeposit(orgPrincipal, railVariant(depositForm.rail), amount, memoArg);
      }
      toast.success("Deposit recorded in treasury.");
      setDepositForm((prev) => ({ ...prev, amount: "", memo: "" }));
      await refreshDepositStatus();
      refreshVault();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to record deposit";
      toast.error(message);
    } finally {
      setDepositing(false);
    }
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
          <div className="w-4 h-4 border-2 border-primary border-r-transparent rounded-full animate-spin" />
          Loading economy settings…
        </div>
      </div>
    );
  }

  if (!cid) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Card className="glass-card p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-orange-500 mx-auto mb-3" />
          <p className="text-muted-foreground">Select an organization to configure its economy settings.</p>
          <Button className="mt-4" onClick={() => navigate("/org-selector")}>
            Choose Organization
          </Button>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center">
        <Card className="glass-card p-8 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Admin Only</h2>
          <p className="text-sm text-muted-foreground">
            You need admin privileges to manage payout rails and treasury settings.
          </p>
        </Card>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Card className="glass-card p-6 text-center space-y-4">
          <AlertTriangle className="w-10 h-10 text-orange-500 mx-auto" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">Economy settings unavailable</h2>
            <p className="text-sm text-muted-foreground">
              {error || "We couldn’t load the treasury configuration for this organization."}
            </p>
          </div>
          <div className="flex justify-center gap-2">
            <Button onClick={reload}>Retry</Button>
            <Button variant="outline" onClick={() => navigate("/org-selector")}>
              Choose another org
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout
      sidebar={{
        userRole,
        userName: userName || "Admin",
        userPrincipal: sidebarPrincipal,
        onDisconnect: () => navigate("/auth"),
      }}
    >
      <header className="h-16 border-b border-border/40 flex items-center justify-between px-6 glass-header">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="mr-4" />
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
            <Coins className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Economy Settings</h1>
            <p className="text-xs text-muted-foreground">Org: {cid}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <WalletCopyBadge />
          <ThemeToggle />
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {error && (
            <Card className="border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive flex flex-wrap items-center justify-between gap-3">
              <span>{error}</span>
              <Button size="sm" variant="outline" onClick={reload} className="gap-2">
                <RefreshCw className="w-4 h-4" />
                Retry
              </Button>
            </Card>
          )}
          <Card className="glass-card border border-border/70">
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Vault balances</h2>
                  <p className="text-sm text-muted-foreground">
                    Locked funds available for micro-tips and scheduled payouts.
                  </p>
                </div>
                <Badge variant="secondary">
                  {vaultBalance
                    ? "Live"
                    : "Not available"}
                </Badge>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {RAILS.map((rail) => (
                  <div key={rail} className="rounded-xl border border-border/50 p-4 space-y-2">
                    <p className="text-xs text-muted-foreground">Rail</p>
                    <div className="flex items-baseline justify-between">
                      <p className="text-lg font-semibold">{rail}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Balance</p>
                      <p className="text-2xl font-bold text-foreground">{formatVault(rail)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </Card>
          <Card className="glass-card border border-border/70">
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Payment rails & thresholds</h2>
                  <p className="text-sm text-muted-foreground">
                    Enable payout rails and define minimum treasury balances required to trigger payouts.
                  </p>
                </div>
                <Badge variant={config.rails.btc || config.rails.icp || config.rails.eth ? "default" : "secondary"}>
                  {Object.values(config.rails).filter(Boolean).length} / 3 rails active
                </Badge>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {(["btc", "icp", "eth"] as (keyof RailToggle)[]).map((rail) => (
                  <div key={rail} className="rounded-xl border border-border/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide">{rail}</p>
                        <p className="text-xs text-muted-foreground">Toggle {rail.toUpperCase()} payouts</p>
                      </div>
                      <Switch checked={config.rails[rail]} onCheckedChange={(v) => handleRailToggle(rail, v)} />
                    </div>
                    <Label className="text-xs text-muted-foreground">Minimum treasury balance</Label>
                    <Input
                      value={config.thresholds[`${rail}Min` as keyof Thresholds]}
                      onChange={(e) => handleThresholdChange(`${rail}Min` as keyof Thresholds, e.target.value)}
                      placeholder="0"
                      inputMode="numeric"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="glass-card border border-border/70">
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Micro-tips</h2>
                  <p className="text-sm text-muted-foreground">
                    Event-driven tips triggered when reputation is awarded. Set the tip per REP to automatically scale the payout.
                  </p>
                </div>
                <Switch
                  checked={config.microTips.enabled}
                  onCheckedChange={(v) => handleMicroTipChange("enabled", v)}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {(["btc", "icp", "eth"] as const).map((rail) => (
                  <div key={rail} className="space-y-2">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      {rail.toUpperCase()} tip per REP
                    </Label>
                    <Input
                      value={config.microTips[`${rail}TipAmount` as keyof MicroTipsConfig] as string}
                      onChange={(e) => handleMicroTipChange(`${rail}TipAmount` as keyof MicroTipsConfig, e.target.value)}
                      inputMode="numeric"
                      placeholder="0"
                    />
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Max {rail.toUpperCase()} per period
                    </Label>
                    <Input
                      value={config.microTips[`max${rail.charAt(0).toUpperCase()}${rail.slice(1)}PerPeriod` as keyof MicroTipsConfig] as string}
                      onChange={(e) =>
                        handleMicroTipChange(
                          `max${rail.charAt(0).toUpperCase()}${rail.slice(1)}PerPeriod` as keyof MicroTipsConfig,
                          e.target.value
                        )
                      }
                      inputMode="numeric"
                      placeholder="0"
                    />
                  </div>
                ))}
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Max tip events per window
                  </Label>
                  <Input
                    value={config.microTips.maxEventsPerWindow}
                    onChange={(e) => handleMicroTipChange("maxEventsPerWindow", e.target.value)}
                    inputMode="numeric"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="glass-card border border-border/70">
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Scheduled payouts</h2>
                  <p className="text-sm text-muted-foreground">
                    Automate cycle-based rewards tied to reputation tiers. Tiers editor coming soon.
                  </p>
                </div>
                <Switch
                  checked={config.scheduled.enabled}
                  onCheckedChange={(v) => handleScheduledChange("enabled", v)}
                />
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Frequency</Label>
                  <Select value={config.scheduled.frequency} onValueChange={(v) => handleScheduledChange("frequency", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(["btc", "icp", "eth"] as const).map((rail) => (
                  <div key={rail} className="space-y-2">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Max {rail.toUpperCase()} per cycle
                    </Label>
                    <Input
                      value={config.scheduled[`max${rail.charAt(0).toUpperCase()}${rail.slice(1)}PerCycle` as keyof ScheduledConfig] as string}
                      onChange={(e) =>
                        handleScheduledChange(
                          `max${rail.charAt(0).toUpperCase()}${rail.slice(1)}PerCycle` as keyof ScheduledConfig,
                          e.target.value
                        )
                      }
                      inputMode="numeric"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-dashed border-border/50 p-4 text-sm text-muted-foreground">
                Tier-based payout tables are coming soon. For now, scheduled payouts distribute proportionally across
                active members.
              </div>
            </div>
          </Card>

          <Card className="glass-card border border-border/70">
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Compliance & controls</h2>
                  <p className="text-sm text-muted-foreground">
                    Add lightweight guardrails for payouts. Tag whitelist is comma-separated.
                  </p>
                </div>
                <Switch
                  checked={config.compliance.kycRequired}
                  onCheckedChange={(v) => handleComplianceChange("kycRequired", v)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Allowed tags</Label>
                <Input
                  value={tagValue}
                  onChange={(e) =>
                    handleComplianceChange(
                      "tagWhitelist",
                      e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder="core, builder, council"
                />
                <p className="text-xs text-muted-foreground">
                  Users must match at least one tag to receive payouts when compliance is enabled.
                </p>
              </div>
            </div>
          </Card>

          <Card className="glass-card border border-border/70">
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Record deposit</h2>
                  <p className="text-sm text-muted-foreground">
                    After sending ckBTC/ICP/ckETH to the org&apos;s treasury subaccount, record that transfer here to
                    credit the vault.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={refreshDepositStatus}
                    disabled={depositStatusLoading}
                  >
                    <RefreshCw className={cn("w-4 h-4", depositStatusLoading && "animate-spin")} />
                    Refresh status
                  </Button>
                  {depositStatus && (
                    <Badge
                      variant={depositStatus.available > 0n ? "default" : "secondary"}
                      className="text-xs"
                    >
                      {formatDecimal(depositStatus.available, depositRailDecimals)} {depositForm.rail} available
                    </Badge>
                  )}
                </div>
              </div>
              <div className="grid md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Rail</Label>
                  <Select
                    value={depositForm.rail}
                    onValueChange={(rail: RailSymbol) => {
                      setDepositStatus(null);
                      setDepositForm((prev) => ({ ...prev, rail }));
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select rail" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ICP">ICP</SelectItem>
                      <SelectItem value="BTC">BTC</SelectItem>
                      <SelectItem value="ETH">ETH</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Amount</Label>
                  <div className="flex items-center gap-2">
                    <Input
                      value={depositForm.amount}
                      onChange={(e) =>
                        setDepositForm((prev) => ({ ...prev, amount: numericMask(e.target.value, true) }))
                      }
                      inputMode="decimal"
                      placeholder="0.0"
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={!depositStatus || depositStatus.available <= 0n}
                      onClick={() =>
                        depositStatus &&
                        setDepositForm((prev) => ({
                          ...prev,
                          amount: formatDecimal(depositStatus.available, depositRailDecimals),
                        }))
                      }
                    >
                      Use detected
                    </Button>
                  </div>
                  {depositStatus && (
                    <p className="text-xs text-muted-foreground">
                      Uncredited on ledger: {formatDecimal(depositStatus.available, depositRailDecimals)}{" "}
                      {depositForm.rail}
                    </p>
                  )}
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Memo (optional)</Label>
                  <Input
                    value={depositForm.memo}
                    onChange={(e) => setDepositForm((prev) => ({ ...prev, memo: e.target.value }))}
                    placeholder="Ledger memo / note"
                  />
                </div>
              </div>
              {depositStatus && (
                <div className="rounded-lg border border-border/50 bg-muted/30 p-4 grid md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Ledger balance</p>
                    <p className="font-semibold">
                      {formatDecimal(depositStatus.ledgerBalance, depositRailDecimals)} {depositForm.rail}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Credited to vault</p>
                    <p className="font-semibold">
                      {formatDecimal(depositStatus.creditedBalance, depositRailDecimals)} {depositForm.rail}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Available to credit</p>
                    <p className="font-semibold">
                      {formatDecimal(depositStatus.available, depositRailDecimals)} {depositForm.rail}
                    </p>
                  </div>
                </div>
              )}
              {depositDetails && (
                <div className="rounded-lg border border-border/50 bg-muted/30 p-4 space-y-3 text-sm">
                  <p className="text-muted-foreground">
                    Send {depositAssetLabel} to this treasury account (owner + subaccount) using your wallet/ledger, then
                    record the transaction above.
                  </p>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Owner (treasury canister)
                      </Label>
                      <div className="flex gap-2">
                        <Input readOnly value={depositDetails.owner} className="font-mono text-xs" />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard("Owner principal", depositDetails.owner)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                        Subaccount (hex)
                      </Label>
                      <div className="flex gap-2">
                        <Input readOnly value={depositDetails.subaccountHex} className="font-mono text-xs" />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => copyToClipboard("Subaccount", depositDetails.subaccountHex)}
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                    {depositDetails.accountId && (
                      <div className="space-y-1 md:col-span-2">
                        <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                          Account identifier
                        </Label>
                        <div className="flex gap-2">
                          <Input readOnly value={depositDetails.accountId} className="font-mono text-xs" />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => copyToClipboard("Account identifier", depositDetails.accountId!)}
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Button onClick={handleDeposit} disabled={depositing} className="gap-2">
                  {depositing ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Recording…
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      Record deposit
                    </>
                  )}
                </Button>
                <p className="text-xs text-muted-foreground">
                  Funds must already be transferred via ledger before recording the deposit.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button variant="outline" onClick={handleStopAll} disabled={!canStopAll}>
              Stop all payouts
            </Button>
            <Button
              onClick={onSave}
              disabled={!dirty || saving || submitting}
              className={cn("gap-2", (!dirty || saving || submitting) && "opacity-80")}
            >
              {saving || submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save changes
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={reset} disabled={!dirty}>
              Reset
            </Button>
            {!dirty && (
              <span className="text-xs text-muted-foreground">All changes saved</span>
            )}
          </div>

          {!config.microTips.enabled && !config.scheduled.enabled && (
            <Card className="glass-card border border-border/70">
              <div className="p-6 space-y-6">
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div>
                    <h2 className="text-xl font-semibold text-foreground">Withdraw vault funds</h2>
                    <p className="text-sm text-muted-foreground">
                      With payouts disabled, you can drain remaining vault balances to an admin wallet.
                    </p>
                  </div>
                </div>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Rail</Label>
                    <Select
                      value={withdrawForm.rail}
                      onValueChange={(value: RailSymbol) =>
                        setWithdrawForm((prev) => ({
                          ...prev,
                          rail: value,
                          amount: formatVault(value),
                          destination: value === "ICP" ? "" : prev.destination,
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select rail" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="ICP">ICP</SelectItem>
                        <SelectItem value="BTC">ckBTC</SelectItem>
                        <SelectItem value="ETH">ckETH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Amount</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        value={withdrawForm.amount}
                        onChange={(e) =>
                          setWithdrawForm((prev) => ({ ...prev, amount: numericMask(e.target.value, true) }))
                        }
                        inputMode="decimal"
                        placeholder="0"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={() => setWithdrawForm((prev) => ({ ...prev, amount: formatVault(withdrawForm.rail) }))}
                      >
                        Max
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Available: {formatVault(withdrawForm.rail)} {withdrawForm.rail}
                    </p>
                    {withdrawAmountError && <p className="text-xs text-destructive">{withdrawAmountError}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Destination
                    </Label>
                    <Input
                      value={withdrawForm.destination}
                      onChange={(e) =>
                        setWithdrawForm((prev) => ({ ...prev, destination: e.target.value }))
                      }
                      placeholder={
                        withdrawForm.rail === "ICP"
                          ? "Principal or account (leave blank to use your principal)"
                          : withdrawForm.rail === "BTC"
                          ? "ckBTC/BTC address"
                          : "ckETH/ETH address"
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      {withdrawForm.rail === "ICP"
                        ? "Blank defaults to your current principal. Account identifiers must be 64 hex chars."
                        : "Provide an address controlled by the treasury admin."}
                    </p>
                    {withdrawDestinationError && <p className="text-xs text-destructive">{withdrawDestinationError}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">Memo (optional)</Label>
                    <Input
                      value={withdrawForm.memo}
                      onChange={(e) => setWithdrawForm((prev) => ({ ...prev, memo: e.target.value }))}
                      placeholder="Reference note"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleWithdraw}
                    disabled={!canSubmitWithdraw}
                    className="gap-2"
                  >
                    {withdrawing ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Withdrawing…
                      </>
                    ) : (
                      <>
                        <ArrowDownToLine className="w-4 h-4" />
                        Withdraw vault balance
                      </>
                    )}
                  </Button>
                  <p className="text-xs text-muted-foreground">
                    Ensure rails and automation stay disabled while draining funds.
                  </p>
                </div>
              </div>
            </Card>
          )}
        </div>
      </main>
    </DashboardLayout>
  );
}
