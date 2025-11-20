// src/pages/TransactionLog.tsx
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Principal } from "@dfinity/principal";
import { type ChildActor } from "@/lib/canisters";
import type { PayoutEvent as TreasuryPayoutEvent, Rail as TreasuryRail, TipEvent as TreasuryTipEvent } from "@/declarations/treasury/treasury.did";

import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { getUserDisplayData } from "@/utils/userUtils";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DashboardLayout, SidebarTrigger } from "@/components/layout/DashboardLayout";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import WalletCopyBadge from "../components/WalletCopyBadge";
import { toast } from "sonner";

import { cn } from "@/lib/utils";

import {
  formatDateTimeForDisplay,
} from "@/utils/transactionUtils";

import {
  FileText,
  Search,
  Award,
  UserMinus,
  Download,
  ExternalLink,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
} from "lucide-react";

type TxKind = "award" | "revoke" | "decay";
interface TransactionUI {
  id: string;
  type: TxKind;
  amount: number;
  fromUser: string;
  fromPrincipal: string;
  toUser: string;
  toPrincipal: string;
  reason: string;
  timestamp: Date;
  status: "completed" | "pending" | "failed";
}

type TreasuryEventType = "MICRO_TIP" | "CYCLE_PAYOUT";
type RailSymbol = "BTC" | "ICP" | "ETH";

interface TreasuryEvent {
  id: string;
  ts: number;
  type: TreasuryEventType;
  rail: RailSymbol;
  amount: string;
  user: string;
}

type RawTransaction = {
  id?: { toString?: () => string } | bigint | number | string;
  transactionType?: { Revoke?: null } | { Decay?: null } | { Award?: null };
  amount?: number | bigint;
  timestamp?: number | bigint;
  from?: { toString?: () => string };
  to?: { toString?: () => string };
  reason?: string[] | string;
};

const RAIL_DECIMALS: Record<RailSymbol, number> = {
  BTC: 8,
  ICP: 8,
  ETH: 18,
};

const railFromVariant = (rail: TreasuryRail): RailSymbol => {
  if ("BTC" in rail) return "BTC";
  if ("ICP" in rail) return "ICP";
  return "ETH";
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

const formatNat = (value: bigint, symbol: RailSymbol = "ICP") => formatAmount(value ?? 0n, RAIL_DECIMALS[symbol]);

const getTransactionTypeBgClass = (type: TxKind) => {
  switch (type) {
    case "award":
      return "text-green-600 bg-green-500/10";
    case "revoke":
      return "text-red-600 bg-red-500/10";
    case "decay":
      return "text-orange-600 bg-orange-500/10";
    default:
      return "text-blue-600 bg-blue-500/10";
  }
};

const TransactionLogPage: React.FC = () => {
  const navigate = useNavigate();
  const { cid } = useParams<{ cid: string }>();
  const { getChildActor, isAuthenticated } = useAuth();
  const { userRole, currentPrincipal, userName: roleUserName, loading: roleLoading } = useRole();
  const userDisplay = getUserDisplayData(currentPrincipal || null);
  const principalText = currentPrincipal?.toString() || userDisplay.userPrincipal;
  const sidebarUserName = roleUserName || (principalText ? `User ${principalText.slice(0, 8)}` : "");
  const sidebarPrincipal = principalText;

  const [child, setChild] = useState<ChildActor | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [connectError, setConnectError] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<TransactionUI[]>([]);
  const [loading, setLoading] = useState(false);

  const {
    events: treasuryEvents,
    loading: treasuryLoading,
    refresh: refreshTreasury,
  } = useTreasuryEvents(cid);

  useEffect(() => {
    (async () => {
      try {
        if (!cid) throw new Error("No organization selected.");
        if (!isAuthenticated) {
          throw new Error("Please connect a wallet to view transactions.");
        }
        const actor = await getChildActor(cid);
        setChild(actor);
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : "Failed to connect to org canister";
        setConnectError(message);
      } finally {
        setConnecting(false);
      }
    })();
  }, [cid, getChildActor, isAuthenticated]);

  useEffect(() => {
    const load = async () => {
      if (!child) return;
      try {
        setLoading(true);
        const raw = await child.getTransactionHistory();
        const arr: RawTransaction[] = Array.isArray(raw) ? (raw as RawTransaction[]) : [];

        const toNum = (v: number | bigint) => (typeof v === "bigint" ? Number(v) : v);

        const ui: TransactionUI[] = arr.map((tx, i) => {
          let type: TxKind = "award";
          if (tx?.transactionType) {
            if ("Revoke" in tx.transactionType) type = "revoke";
            else if ("Decay" in tx.transactionType) type = "decay";
            else if ("Award" in tx.transactionType) type = "award";
          }

          const amount = toNum(tx.amount || 0);
          const tsSec = toNum(tx.timestamp || 0);
          const ts = tsSec ? new Date(tsSec * 1000) : new Date();

          const fromStr = tx?.from?.toString?.() ?? "";
          const toStr = tx?.to?.toString?.() ?? "";
          const reason = Array.isArray(tx?.reason) ? tx.reason[0] ?? "" : tx?.reason ?? "";

          return {
            id: tx?.id?.toString?.() ?? `tx-${i}`,
            type,
            amount,
            fromUser: fromStr ? `User ${fromStr.slice(0, 8)}` : "Unknown",
            fromPrincipal: fromStr,
            toUser: toStr ? `User ${toStr.slice(0, 8)}` : "Unknown",
            toPrincipal: toStr,
            reason: reason || "No reason provided",
            timestamp: ts,
            status: "completed",
          };
        });

        ui.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
        setTransactions(ui);
      } catch (err) {
        console.error(err);
        setTransactions([]);
        toast.error("Failed to load transaction history");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [child]);

  const handleDisconnect = () => navigate("/auth");

  if (connecting) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-muted-foreground">Connecting to organization…</div>
      </div>
    );
  }

  if (!cid || connectError) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Card className="glass-card p-6">
          <AlertTriangle className="w-6 h-6 text-orange-500 mb-2" />
          <p className="text-sm text-muted-foreground">{connectError || "No organization selected."}</p>
          <div className="mt-3">
            <Button onClick={() => navigate("/org-selector")} variant="outline">
              Choose Org
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (roleLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
          <div className="w-4 h-4 border-2 border-primary border-r-transparent rounded-full animate-spin" />
          Determining access…
        </div>
      </div>
    );
  }

  return (
    <InnerTransactionLog
      cid={cid}
      userRole={userRole}
      userDisplay={{
        userName: sidebarUserName,
        userPrincipal: sidebarPrincipal,
        displayName: userDisplay.displayName,
      }}
      handleDisconnect={handleDisconnect}
      transactions={transactions}
      repLoading={loading}
      treasuryEvents={treasuryEvents}
      treasuryLoading={treasuryLoading}
      refreshTreasury={refreshTreasury}
    />
  );
};

interface InnerProps {
  cid: string;
  userRole: string;
  userDisplay: {
    userName: string;
    userPrincipal: string;
    displayName: string;
  };
  handleDisconnect: () => void;
  transactions: TransactionUI[];
  repLoading: boolean;
  treasuryEvents: TreasuryEvent[];
  treasuryLoading: boolean;
  refreshTreasury: () => void;
}

function InnerTransactionLog({
  cid,
  userRole,
  userDisplay,
  handleDisconnect,
  transactions,
  repLoading,
  treasuryEvents,
  treasuryLoading,
  refreshTreasury,
}: InnerProps) {
  const normalizedRole = (userRole || "").toLowerCase();
  const sidebarRole: "admin" | "awarder" | "member" =
    normalizedRole === "admin"
      ? "admin"
      : normalizedRole === "awarder"
      ? "awarder"
      : "member";

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | TxKind>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending" | "failed">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [activeTab, setActiveTab] = useState<"reputation" | "treasury">("reputation");
  const [railFilter, setRailFilter] = useState<"all" | RailSymbol>("all");

  const filteredTransactions = useMemo(() => {
    let filtered = [...transactions];

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (tx) =>
          tx.toUser.toLowerCase().includes(q) ||
          tx.fromUser.toLowerCase().includes(q) ||
          tx.reason.toLowerCase().includes(q) ||
          tx.toPrincipal.toLowerCase().includes(q) ||
          tx.fromPrincipal.toLowerCase().includes(q) ||
          tx.id.toLowerCase().includes(q)
      );
    }

    if (filterType !== "all") {
      filtered = filtered.filter((tx) => tx.type === filterType);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter((tx) => tx.status === filterStatus);
    }

    if (dateFilter !== "all") {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter((tx) => {
        switch (dateFilter) {
          case "today":
            return tx.timestamp >= today;
          case "week":
            return tx.timestamp >= weekAgo;
          case "month":
            return tx.timestamp >= monthAgo;
          default:
            return true;
        }
      });
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }, [transactions, searchQuery, filterType, filterStatus, dateFilter]);

  const filteredTreasuryEvents = useMemo(() => {
    const events = [...treasuryEvents].sort((a, b) => b.ts - a.ts);
    if (railFilter === "all") return events;
    return events.filter((event) => event.rail === railFilter);
  }, [treasuryEvents, railFilter]);

  const stats = {
    totalTransactions: transactions.length,
    totalRepAwarded: transactions.filter((t) => t.type === "award").reduce((s, t) => s + t.amount, 0),
    totalRepRevoked: transactions.filter((t) => t.type === "revoke").reduce((s, t) => s + t.amount, 0),
    pendingTransactions: transactions.filter((t) => t.status === "pending").length,
    treasuryEvents: treasuryEvents.length,
  };

  return (
    <DashboardLayout
      sidebar={{
        userRole: sidebarRole,
        userName: userDisplay.userName,
        userPrincipal: userDisplay.userPrincipal,
        onDisconnect: handleDisconnect,
      }}
    >
      <header className="h-16 border-b border-border/40 flex items-center justify-between px-6 glass-header">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="mr-4" />
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
            <FileText className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Transaction Log</h1>
            <p className="text-xs text-muted-foreground">Org: {cid}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <WalletCopyBadge />
          <ThemeToggle />
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard title="Total transactions" value={stats.totalTransactions} icon={<TrendingUp className="w-6 h-6 text-primary" />} />
            <StatCard title="REP awarded" value={`${stats.totalRepAwarded} REP`} icon={<Award className="w-6 h-6 text-green-500" />} />
            <StatCard title="REP revoked" value={`${stats.totalRepRevoked} REP`} icon={<UserMinus className="w-6 h-6 text-red-500" />} />
            <StatCard title="Treasury events" value={stats.treasuryEvents} icon={<DollarSign className="w-6 h-6 text-amber-500" />} />
          </div>

          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "reputation" | "treasury")}>
            <TabsList className="bg-muted/40 border border-border/60">
              <TabsTrigger value="reputation">Reputation</TabsTrigger>
              <TabsTrigger value="treasury">Treasury</TabsTrigger>
            </TabsList>

            <TabsContent value="reputation" className="mt-6 space-y-6">
              <Card className="glass-card p-6">
                <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
                  <div className="flex-1 space-y-2">
                    <Label className="text-sm text-muted-foreground">Search</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search users, principals, or transaction IDs"
                        className="pl-9"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1">
                    <FilterSelect
                      label="Type"
                      value={filterType}
                      onChange={setFilterType}
                      options={[
                        { label: "All types", value: "all" },
                        { label: "Awards", value: "award" },
                        { label: "Revocations", value: "revoke" },
                        { label: "Decay", value: "decay" },
                      ]}
                    />
                    <FilterSelect
                      label="Status"
                      value={filterStatus}
                      onChange={setFilterStatus}
                      options={[
                        { label: "Any status", value: "all" },
                        { label: "Completed", value: "completed" },
                        { label: "Pending", value: "pending" },
                        { label: "Failed", value: "failed" },
                      ]}
                    />
                    <FilterSelect
                      label="Date"
                      value={dateFilter}
                      onChange={setDateFilter}
                      options={[
                        { label: "All time", value: "all" },
                        { label: "Today", value: "today" },
                        { label: "Last 7 days", value: "week" },
                        { label: "Last 30 days", value: "month" },
                      ]}
                    />
                  </div>
                </div>
              </Card>

              <ReputationLogTable transactions={filteredTransactions} loading={repLoading} />
            </TabsContent>

            <TabsContent value="treasury" className="mt-6 space-y-6">
              <Card className="glass-card p-6">
                <div className="flex flex-col md:flex-row items-start md:items-center gap-4">
                  <div className="w-full md:w-1/3">
                    <Label className="text-sm text-muted-foreground">Rail</Label>
                    <Select value={railFilter} onValueChange={(v) => setRailFilter(v as typeof railFilter)}>
                      <SelectTrigger>
                        <SelectValue placeholder="All rails" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All rails</SelectItem>
                        <SelectItem value="BTC">BTC</SelectItem>
                        <SelectItem value="ICP">ICP</SelectItem>
                        <SelectItem value="ETH">ETH</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button variant="outline" onClick={refreshTreasury} disabled={treasuryLoading}>
                    {treasuryLoading ? (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                        Refreshing…
                      </>
                    ) : (
                      <>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                      </>
                    )}
                  </Button>
                </div>
              </Card>

              <TreasuryLogTable events={filteredTreasuryEvents} loading={treasuryLoading} />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </DashboardLayout>
  );
}

function StatCard({ title, value, icon }: { title: string; value: string | number; icon: React.ReactNode }) {
  return (
    <Card className="glass-card p-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold text-foreground">{value}</p>
        </div>
        {icon}
      </div>
    </Card>
  );
}

function FilterSelect<T extends string>({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: T;
  onChange: (value: T) => void;
  options: { label: string; value: T }[];
}) {
  return (
    <div className="space-y-2">
      <Label className="text-sm text-muted-foreground">{label}</Label>
      <Select value={value} onValueChange={(v) => onChange(v as T)}>
        <SelectTrigger>
          <SelectValue placeholder="Select" />
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function ReputationLogTable({ transactions, loading }: { transactions: TransactionUI[]; loading: boolean }) {
  if (loading) {
    return (
      <Card className="glass-card p-6 text-center">
        <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
          <div className="w-4 h-4 border-2 border-primary border-r-transparent rounded-full animate-spin" />
          Loading reputation history…
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card p-6 overflow-x-auto space-y-4">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="grid gap-4 sm:grid-cols-[1fr,1fr,1fr,auto] items-center border border-border/60 rounded-xl p-4 hover:border-border transition"
        >
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Badge className={`text-xs capitalize ${getTransactionTypeBgClass(tx.type)}`}>
                {tx.type}
              </Badge>
              <span className="text-xs text-muted-foreground">{tx.id}</span>
            </div>
            <p className="text-sm text-foreground">{tx.reason}</p>
            <p className="text-xs text-muted-foreground">
              {formatDateTimeForDisplay(tx.timestamp.toISOString())}
            </p>
          </div>

          <div className="text-sm">
            <p className="text-muted-foreground">From</p>
            <p className="font-medium text-foreground">{tx.fromUser}</p>
            <p className="text-xs text-muted-foreground">{tx.fromPrincipal}</p>
          </div>

          <div className="text-sm">
            <p className="text-muted-foreground">To</p>
            <p className="font-medium text-foreground">{tx.toUser}</p>
            <p className="text-xs text-muted-foreground">{tx.toPrincipal}</p>
          </div>

          <div className="flex items-center gap-3 justify-end">
            <div className="text-right">
              <p className="text-sm font-semibold text-foreground">{tx.amount} REP</p>
              <p className="text-xs text-muted-foreground">{tx.status}</p>
            </div>
            <Button variant="ghost" size="icon">
              <ExternalLink className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ))}

      {!transactions.length && (
        <div className="text-center py-10 text-muted-foreground">
          <p>No transactions found for the selected filters.</p>
        </div>
      )}
    </Card>
  );
}

function TreasuryLogTable({ events, loading }: { events: TreasuryEvent[]; loading: boolean }) {
  if (loading) {
    return (
      <Card className="glass-card p-6 text-center">
        <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
          <div className="w-4 h-4 border-2 border-primary border-r-transparent rounded-full animate-spin" />
          Loading treasury events…
        </div>
      </Card>
    );
  }

  return (
    <Card className="glass-card p-6 overflow-x-auto space-y-4">
      {events.map((event) => (
        <div
          key={event.id}
          className="grid gap-4 sm:grid-cols-[1fr,1fr,auto] items-center border border-border/60 rounded-xl p-4"
        >
          <div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="uppercase text-xs">
                {event.type}
              </Badge>
              <Badge>{event.rail}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1">{new Date(event.ts).toLocaleString()}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Recipient</p>
            <p className="text-sm font-medium">{event.user}</p>
          </div>
          <div className="text-right">
            <p className="text-base font-semibold">
              {event.amount} {event.rail}
            </p>
          </div>
        </div>
      ))}

      {!events.length && (
        <div className="text-center py-10 text-muted-foreground">
          <p>No treasury events for the selected rail.</p>
        </div>
      )}
    </Card>
  );
}

function mapTipEvents(raw: TreasuryTipEvent[], orgFilter: string): TreasuryEvent[] {
  return raw
    .filter((event) => event.org?.toText?.() === orgFilter)
    .map((event) => {
      const rail = railFromVariant(event.rail);
      const amount = BigInt(event.amount ?? 0n);
      const timestamp = Number(event.timestamp ?? 0n) * 1000;
      const user = event.user?.toText?.() ?? "Unknown";
      return {
        id: `tip-${event.id.toString()}`,
        ts: timestamp,
        type: "MICRO_TIP" as TreasuryEventType,
        rail,
        amount: formatNat(amount, rail),
        user,
      };
    });
}

function mapPayoutEvents(raw: TreasuryPayoutEvent[], orgFilter: string): TreasuryEvent[] {
  return raw
    .filter((event) => event.org?.toText?.() === orgFilter)
    .map((event) => {
      const rail = railFromVariant(event.rail);
      const timestamp = Number(event.timestamp ?? 0n) * 1000;
      const total = BigInt(event.totalAmount ?? 0n);
      return {
        id: `payout-${event.id.toString()}`,
        ts: timestamp,
        type: "CYCLE_PAYOUT" as TreasuryEventType,
        rail,
        amount: formatNat(total, rail),
        user: `${event.recipients?.toString?.() ?? "0"} recipients`,
      };
    });
}

function useTreasuryEvents(cid?: string) {
  const { getTreasuryActor, isAuthenticated } = useAuth();
  const [events, setEvents] = useState<TreasuryEvent[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!cid || !isAuthenticated) {
      setEvents([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const treasury = await getTreasuryActor();
      const [tipEvents, payoutEvents] = await Promise.all([
        treasury.listTipEvents(0n, 200n),
        treasury.listPayoutEvents(0n, 100n),
      ]);
      const mapped = [...mapTipEvents(tipEvents, cid), ...mapPayoutEvents(payoutEvents, cid)].sort(
        (a, b) => b.ts - a.ts
      );
      setEvents(mapped);
    } catch (err) {
      console.error("Failed to load treasury events", err);
      setEvents([]);
    } finally {
      setLoading(false);
    }
  }, [cid, getTreasuryActor, isAuthenticated]);

  useEffect(() => {
    load();
  }, [load]);

  return { events, loading, refresh: load };
}

export default TransactionLogPage;
