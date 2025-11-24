// src/features/dashboard/pages/MyEarningsPage.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Principal } from "@dfinity/principal";

import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { DashboardLayout, SidebarTrigger } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import WalletCopyBadge from "../components/WalletCopyBadge";
import { AlertTriangle, Wallet, ArrowDownToLine, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Rail as TreasuryRail, TipEvent } from "@/declarations/treasury/treasury.did";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type RailSymbol = "BTC" | "ICP" | "ETH";

export type MyRailEarnings = {
  symbol: RailSymbol;
  available: string;
  pending: string;
  rawAvailable: bigint;
};

export type MyEarningsEvent = {
  id: string;
  ts: number;
  reason: string;
  rail: RailSymbol;
  amount: string;
  status: "pending" | "paid";
};

export type MyEarningsSummary = {
  rails: MyRailEarnings[];
  history: MyEarningsEvent[];
};

type TreasuryBalanceApi = {
  myOrgBalances?: (org: Principal) => Promise<{ btc: bigint; icp: bigint; eth: bigint }>;
  getUserOrgBalances?: (org: Principal, user: Principal) => Promise<{ btc: bigint; icp: bigint; eth: bigint }>;
};

const RAILS: RailSymbol[] = ["BTC", "ICP", "ETH"];

const railVariant = (symbol: RailSymbol): TreasuryRail =>
  symbol === "BTC" ? { BTC: null } : symbol === "ICP" ? { ICP: null } : { ETH: null };

const railFromVariant = (rail: TreasuryRail): RailSymbol => {
  if ("BTC" in rail) return "BTC";
  if ("ICP" in rail) return "ICP";
  return "ETH";
};

const RAIL_DECIMALS: Record<RailSymbol, number> = {
  BTC: 8,
  ICP: 8,
  ETH: 18,
};

const ICP_ACCOUNT_ID_HEX = /^[0-9a-fA-F]{64}$/;
const BTC_LEGACY_ADDRESS = /^[13][a-km-zA-HJ-NP-Z1-9]{25,39}$/;
const BTC_BECH32_ADDRESS = /^(bc1|tb1)[0-9ac-hj-np-z]{11,71}$/;
const BTC_LEDGER_ACCOUNT = /^[0-9a-fA-F]{64}$/;
const ETH_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const ETH_LEDGER_ACCOUNT = /^[0-9a-fA-F]{64}$/;

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
  BTC_LEGACY_ADDRESS.test(value) || BTC_BECH32_ADDRESS.test(value.toLowerCase()) || BTC_LEDGER_ACCOUNT.test(value);

const isValidEthDestination = (value: string) => ETH_ADDRESS.test(value) || ETH_LEDGER_ACCOUNT.test(value);

const AMOUNT_INPUT_PATTERN = /^\d*(?:\.\d*)?$/;

const READ_STATE_ERROR_PATTERNS = ["invalid certificate", "invalid read state", "fail to decode read state response"];

const parseAmountInput = (value: string, symbol: RailSymbol): bigint | null => {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (!AMOUNT_INPUT_PATTERN.test(trimmed)) return null;
  const decimals = RAIL_DECIMALS[symbol];
  if (decimals === 0 && trimmed.includes(".")) return null;
  const [integerPartRaw, fractionPartRaw = ""] = trimmed.split(".");
  const integerPart = integerPartRaw === "" ? "0" : integerPartRaw.replace(/^0+(?=\d)/, "") || "0";
  if (fractionPartRaw.length > decimals) return null;
  const fractionPart = (fractionPartRaw + "0".repeat(decimals)).slice(0, decimals);
  const combined = `${integerPart}${fractionPart}`.replace(/^0+/, "") || "0";
  try {
    return BigInt(combined);
  } catch {
    return null;
  }
};

const formatAmount = (value: bigint, decimals: number) => {
  if (decimals === 0) return value.toString();
  const negative = value < 0n;
  const absValue = negative ? -value : value;
  const str = absValue.toString().padStart(decimals + 1, "0");
  const integerPart = str.slice(0, -decimals) || "0";
  const fraction = str.slice(-decimals).replace(/0+$/, "");
  const formatted = fraction ? `${integerPart}.${fraction}` : integerPart;
  return negative ? `-${formatted}` : formatted;
};

const formatNat = (value?: bigint | null, symbol: RailSymbol = "ICP") =>
  formatAmount(value ?? 0n, RAIL_DECIMALS[symbol]);

function useMyEarnings(cid?: string) {
  const [summary, setSummary] = useState<MyEarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated, principal, getTreasuryActor } = useAuth();

  const load = useCallback(async () => {
    if (!cid || !isAuthenticated || !principal) {
      setSummary(null);
      setLoading(false);
      setError(!principal ? "Connect a wallet to view earnings." : null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      let orgPrincipal: Principal;
      try {
        orgPrincipal = Principal.fromText(cid);
      } catch {
        throw new Error("Invalid organization id");
      }
      const treasury = await getTreasuryActor();
      const treasuryWithBalances = treasury as TreasuryActor & TreasuryBalanceApi;
      let balances: { btc: bigint; icp: bigint; eth: bigint } | null = null;
      if (typeof treasuryWithBalances.myOrgBalances === "function") {
        balances = await treasuryWithBalances.myOrgBalances(orgPrincipal);
      } else if (typeof treasuryWithBalances.getUserOrgBalances === "function") {
        balances = await treasuryWithBalances.getUserOrgBalances(orgPrincipal, principal!);
      }
      if (!balances) {
        throw new Error("Treasury API missing balance query");
      }
      const rails: MyRailEarnings[] = RAILS.map((symbol) => {
        const raw =
          symbol === "BTC"
            ? (balances.btc as bigint)
            : symbol === "ICP"
            ? (balances.icp as bigint)
            : (balances.eth as bigint);
        return {
          symbol,
          available: formatNat(raw, symbol),
          pending: "0",
          rawAvailable: raw ?? 0n,
        };
      });

      let history: MyEarningsEvent[] = [];
      try {
        const tipEvents = await treasury.listTipEvents(0n, 200n);
        const principalText = principal?.toText();
        history = tipEvents
          .filter((event) => {
            const orgMatches = event.org?.toText?.() === cid;
            const userMatches = principalText ? event.user?.toText?.() === principalText : true;
            return orgMatches && userMatches;
          })
          .map((event) => {
            const amount = event.amount as bigint;
            const ts = Number(event.timestamp ?? 0n) * 1000;
            const reason =
              Array.isArray(event.error) && event.error.length > 0
                ? event.error[0] || "Micro-tip"
                : "Micro-tip";
            return {
              id: event.id.toString(),
              ts,
              reason,
              rail: railFromVariant(event.rail),
              amount: formatNat(amount, railFromVariant(event.rail)),
              status: event.success ? "paid" : "pending",
            };
          })
          .sort((a, b) => b.ts - a.ts);
      } catch (historyErr) {
        console.warn("Failed to load reward history", historyErr);
      }

      setSummary({ rails, history });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Failed to load earnings";
      setError(message);
      setSummary({
        rails: RAILS.map((symbol) => ({
          symbol,
          available: "0",
          pending: "0",
          rawAvailable: 0n,
        })),
        history: [],
      });
    } finally {
      setLoading(false);
    }
  }, [cid, getTreasuryActor, isAuthenticated, principal]);

  useEffect(() => {
    load();
  }, [load]);

  const withdraw = useCallback(
    async ({ rail, cid, destination, amountRaw }: { rail: MyRailEarnings; cid?: string; destination: string; amountRaw: bigint }) => {
      if (!cid) return;
      if (rail.rawAvailable === 0n) {
        toast.info(`No ${rail.symbol} available to withdraw.`);
        return;
      }
      if (amountRaw <= 0n) {
        toast.error("Amount must be greater than zero");
        return;
      }
      if (amountRaw > rail.rawAvailable) {
        toast.error("Amount exceeds available balance");
        return;
      }
      const trimmedDestination = destination.trim();
      if (!trimmedDestination) {
        toast.error("Destination required for withdrawal");
        return;
      }
      try {
        if (rail.symbol === "ICP" && !isValidIcpDestination(trimmedDestination)) {
          toast.error("Destination must be a valid ICP account or principal");
          return;
        }
        if (rail.symbol === "BTC" && !isValidBtcDestination(trimmedDestination)) {
          toast.error("Destination must be a valid BTC or ckBTC address");
          return;
        }
        if (rail.symbol === "ETH" && !isValidEthDestination(trimmedDestination)) {
          toast.error("Destination must be a valid ETH or ckETH address");
          return;
        }
        const treasury = await getTreasuryActor();
        const orgPrincipal = Principal.fromText(cid);
        const res = await treasury.withdrawMy(
          orgPrincipal,
          railVariant(rail.symbol),
          amountRaw,
          trimmedDestination,
          []
        );
        toast.success(res);
        await load();
      } catch (err: unknown) {
        console.error(err);
        const message = err instanceof Error ? err.message ?? "" : String(err);
        const isReadStateError = READ_STATE_ERROR_PATTERNS.some((pattern) =>
          message.toLowerCase().includes(pattern)
        );
        if (isReadStateError) {
          toast.info("Withdrawal submitted. Network confirmation may take a few seconds—check history shortly.");
          await load();
        } else {
          toast.error(message || "Failed to submit withdrawal");
        }
      }
    },
    [getTreasuryActor, load]
  );

  return { summary, loading, error, withdraw };
}

export default function MyEarningsPage() {
  const navigate = useNavigate();
  const { cid } = useParams<{ cid: string }>();
  const { isAuthenticated, principal } = useAuth();
  const { userRole, loading: roleLoading, currentPrincipal, userName } = useRole();
  const sidebarPrincipal = currentPrincipal?.toText() || principal?.toText() || "";
  const { summary, loading, error, withdraw } = useMyEarnings(cid);
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [selectedRailSymbol, setSelectedRailSymbol] = useState<RailSymbol | null>(null);
  const [destinationInput, setDestinationInput] = useState("");
  const [withdrawAmountInput, setWithdrawAmountInput] = useState("");
  const [isSubmittingWithdrawal, setIsSubmittingWithdrawal] = useState(false);
  const [showWithdrawErrors, setShowWithdrawErrors] = useState(false);

  const selectedRail = useMemo(() => {
    if (!summary || !selectedRailSymbol) return null;
    return summary.rails.find((rail) => rail.symbol === selectedRailSymbol) ?? null;
  }, [selectedRailSymbol, summary]);

  const parsedWithdrawAmount = useMemo(() => {
    if (!selectedRail) return null;
    return parseAmountInput(withdrawAmountInput, selectedRail.symbol);
  }, [selectedRail, withdrawAmountInput]);

  const destinationError = useMemo(() => {
    if (!withdrawDialogOpen) return null;
    if (!selectedRail) return "Select a rail to continue";
    if (selectedRail.rawAvailable === 0n) return `No ${selectedRail.symbol} available to withdraw`;
    const trimmed = destinationInput.trim();
    if (!trimmed) return "Destination is required";
    if (selectedRail.symbol === "ICP" && !isValidIcpDestination(trimmed)) {
      return "Enter a valid ICP account or principal";
    }
    if (selectedRail.symbol === "BTC" && !isValidBtcDestination(trimmed)) {
      return "Enter a valid BTC or ckBTC address";
    }
    if (selectedRail.symbol === "ETH" && !isValidEthDestination(trimmed)) {
      return "Enter a valid ETH or ckETH address";
    }
    return null;
  }, [destinationInput, selectedRail, withdrawDialogOpen]);

  const amountError = useMemo(() => {
    if (!withdrawDialogOpen) return null;
    if (!selectedRail) return "Select a rail to continue";
    if (selectedRail.rawAvailable === 0n) return `No ${selectedRail.symbol} available to withdraw`;
    const trimmed = withdrawAmountInput.trim();
    if (!trimmed) return "Enter an amount to withdraw";
    if (!parsedWithdrawAmount) return "Enter a valid amount";
    if (parsedWithdrawAmount <= 0n) return "Amount must be greater than zero";
    if (parsedWithdrawAmount > selectedRail.rawAvailable) return "Amount exceeds available balance";
    return null;
  }, [parsedWithdrawAmount, selectedRail, withdrawAmountInput, withdrawDialogOpen]);

  const canSubmitWithdrawal = Boolean(
    selectedRail && !destinationError && !amountError && parsedWithdrawAmount && parsedWithdrawAmount > 0n && !isSubmittingWithdrawal
  );

  const destinationPlaceholder = useMemo(() => {
    switch (selectedRail?.symbol) {
      case "ICP":
        return "Account identifier or principal";
      case "BTC":
        return "ckBTC address";
      case "ETH":
        return "ETH or ckETH address";
      default:
        return "Destination";
    }
  }, [selectedRail]);

  const destinationHelper = useMemo(() => {
    switch (selectedRail?.symbol) {
      case "ICP":
        return "Enter a 64-character ICP account identifier or a principal.";
      case "BTC":
        return "Accepted formats: bc1/tb1 bech32, legacy 1/3 addresses, or 64-char ckBTC ledger accounts.";
      case "ETH":
        return "Enter a 0x-prefixed ETH address or a 64-char ckETH ledger account.";
      default:
        return "Choose an asset and target address.";
    }
  }, [selectedRail]);

  const openWithdrawDialog = useCallback(
    (railSymbol?: RailSymbol) => {
      if (!summary) return;
      const fallbackRail =
        summary.rails.find((rail) => rail.symbol === railSymbol) ||
        summary.rails.find((rail) => rail.rawAvailable > 0n) ||
        summary.rails[0] ||
        null;
      setSelectedRailSymbol(fallbackRail?.symbol ?? null);
      setDestinationInput("");
      setWithdrawAmountInput(fallbackRail?.available ?? "");
      setShowWithdrawErrors(false);
      setWithdrawDialogOpen(true);
    },
    [summary]
  );

  const handleWithdrawSubmit = useCallback(async () => {
    if (!selectedRail || !cid) return;
    setShowWithdrawErrors(true);
    if (destinationError || amountError || !parsedWithdrawAmount) return;
    setIsSubmittingWithdrawal(true);
    try {
      await withdraw({ rail: selectedRail, cid, destination: destinationInput.trim(), amountRaw: parsedWithdrawAmount });
      setWithdrawDialogOpen(false);
      setDestinationInput("");
      setWithdrawAmountInput("");
      setShowWithdrawErrors(false);
    } finally {
      setIsSubmittingWithdrawal(false);
    }
  }, [amountError, cid, destinationError, destinationInput, parsedWithdrawAmount, selectedRail, withdraw]);

  const closeWithdrawDialog = useCallback((open: boolean) => {
    setWithdrawDialogOpen(open);
    if (!open) {
      setDestinationInput("");
      setWithdrawAmountInput("");
      setShowWithdrawErrors(false);
    }
  }, []);

  if (!cid || !isAuthenticated) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Card className="glass-card p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-orange-500 mx-auto mb-3" />
          <p className="text-muted-foreground">Connect a wallet and select an organization to view earnings.</p>
          <Button className="mt-4" onClick={() => navigate("/org-selector")}>
            Choose Organization
          </Button>
        </Card>
      </div>
    );
  }

  if (roleLoading || loading || !summary) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
          <div className="w-4 h-4 border-2 border-primary border-r-transparent rounded-full animate-spin" />
          Loading earnings…
        </div>
      </div>
    );
  }

  const normalizedRole = (userRole || "").toLowerCase();
  const sidebarRole: "admin" | "awarder" | "member" =
    normalizedRole === "admin"
      ? "admin"
      : normalizedRole === "awarder"
      ? "awarder"
      : "member";

  return (
    <DashboardLayout
      sidebar={{
        userRole: sidebarRole,
        userName: userName || "Member",
        userPrincipal: sidebarPrincipal,
        onDisconnect: () => navigate("/auth"),
      }}
    >
      <header className="h-16 border-b border-border/40 flex items-center justify-between px-6 glass-header">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="mr-4" />
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">My Earnings</h1>
            <p className="text-xs text-muted-foreground">Org: {cid}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <WalletCopyBadge />
          <ThemeToggle />
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          {error && (
            <Card className="border border-destructive/40 bg-destructive/5 text-sm text-destructive px-4 py-3">
              {error}
            </Card>
          )}
          <div className="grid gap-4 md:grid-cols-3">
            {summary.rails.map((rail) => (
              <Card key={rail.symbol} className="glass-card border border-border/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Rail</p>
                    <p className="text-lg font-semibold">{rail.symbol}</p>
                  </div>
                  <Badge variant="outline">{rail.pending !== "0" ? "Pending" : "Ready"}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold text-foreground">{rail.available}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-lg text-muted-foreground">{rail.pending}</p>
                </div>
                <Button
                  className="w-full gap-2"
                  onClick={() => openWithdrawDialog(rail.symbol)}
                  disabled={rail.rawAvailable === 0n}
                  title={rail.rawAvailable === 0n ? `No ${rail.symbol} available to withdraw` : undefined}
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  Withdraw
                </Button>
              </Card>
            ))}
          </div>

          <Card className="glass-card border border-border/60">
            <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Recent rewards</h2>
                <p className="text-sm text-muted-foreground">History of payouts and pending releases</p>
              </div>
              <Badge variant="secondary">{summary.history.length} entries</Badge>
            </div>
            <div className="divide-y divide-border/60">
              {summary.history.map((event) => (
                <div key={event.id} className="grid sm:grid-cols-[1fr,auto,auto,auto] gap-4 px-6 py-4 items-center">
                  <div>
                    <p className="text-sm font-medium text-foreground">{event.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.ts).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Rail</p>
                    <p className="font-medium">{event.rail}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-semibold">{event.amount}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={cn(
                        "text-xs",
                        event.status === "paid" ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"
                      )}
                    >
                      {event.status}
                    </Badge>
                  </div>
                </div>
              ))}

              {!summary.history.length && (
                <div className="text-center text-muted-foreground py-10">No reward events yet.</div>
              )}
            </div>
          </Card>
        </div>
      </main>
      <Dialog open={withdrawDialogOpen} onOpenChange={closeWithdrawDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Withdraw funds</DialogTitle>
            <DialogDescription>Choose which rail to withdraw from and confirm the destination address.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="withdraw-rail">Rail</Label>
              <Select
                value={selectedRailSymbol ?? undefined}
                onValueChange={(value) => {
                  setSelectedRailSymbol(value as RailSymbol);
                  const nextRail = summary?.rails.find((rail) => rail.symbol === value) ?? null;
                  setWithdrawAmountInput(nextRail?.available ?? "");
                  setDestinationInput("");
                  setShowWithdrawErrors(false);
                }}
              >
                <SelectTrigger id="withdraw-rail">
                  <SelectValue placeholder="Select rail" />
                </SelectTrigger>
                <SelectContent>
                  {summary?.rails.map((rail) => (
                    <SelectItem key={rail.symbol} value={rail.symbol}>
                      {rail.symbol} · {rail.available} available
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdraw-destination">Destination address</Label>
              <Input
                id="withdraw-destination"
                value={destinationInput}
                onChange={(event) => setDestinationInput(event.target.value)}
                placeholder={destinationPlaceholder}
              />
              <p className="text-xs text-muted-foreground">{destinationHelper}</p>
              {showWithdrawErrors && destinationError && (
                <p className="text-xs text-destructive">{destinationError}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="withdraw-amount">Amount</Label>
              <div className="flex items-center gap-2">
                <Input
                  id="withdraw-amount"
                  value={withdrawAmountInput}
                  onChange={(event) => setWithdrawAmountInput(event.target.value)}
                  placeholder="0.00"
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => setWithdrawAmountInput(selectedRail?.available ?? "")}
                  disabled={!selectedRail}
                >
                  Max
                </Button>
              </div>
              {selectedRail && (
                <p className="text-xs text-muted-foreground">
                  Available: {selectedRail.available} {selectedRail.symbol}
                </p>
              )}
              {showWithdrawErrors && amountError && <p className="text-xs text-destructive">{amountError}</p>}
            </div>

            {selectedRail && (
              <div className="rounded-lg border border-border/60 bg-muted/20 p-4 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Withdraw amount</span>
                  <span className="font-semibold text-foreground">
                    {withdrawAmountInput || "0"} {selectedRail.symbol}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Requested amount will be transferred. Network fees may apply depending on the rail.
                </p>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-4">
            <Button variant="ghost" onClick={() => closeWithdrawDialog(false)} disabled={isSubmittingWithdrawal}>
              Cancel
            </Button>
            <Button onClick={handleWithdrawSubmit} disabled={!canSubmitWithdrawal} className="gap-2">
              {isSubmittingWithdrawal && <Loader2 className="h-4 w-4 animate-spin" />}
              Confirm withdrawal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
}
