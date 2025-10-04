// src/pages/TransactionLog.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Principal } from "@dfinity/principal";
import { makeChildWithPlug, type ChildActor } from "@/components/canister/child";
import { PLUG_HOST } from "@/utils/plug";

import { useRole } from "@/contexts/RoleContext";
import { getUserDisplayData } from "@/utils/userUtils";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardLayout, SidebarTrigger } from "@/components/layout/DashboardLayout";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "sonner";

import {
  parseTransactionType, // optional if you want to keep using your helper; we compute directly below
  convertTimestampToDate,
  getTransactionTypeDescription,
  formatTransactionAmount,
  formatDateTimeForDisplay,
} from "@/utils/transactionUtils";

import {
  FileText,
  Search,
  Calendar,
  Award,
  UserMinus,
  Clock,
  Download,
  Eye,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Activity,
  AlertTriangle,
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
  category: string;
  timestamp: Date;
  blockHeight?: number;
  transactionHash?: string;
  status: "completed" | "pending" | "failed";
}

const getTransactionIcon = (type: TxKind) => {
  switch (type) {
    case "award":
      return <Award className="w-4 h-4 text-green-600" />;
    case "revoke":
      return <UserMinus className="w-4 h-4 text-red-600" />;
    case "decay":
      return <Clock className="w-4 h-4 text-orange-600" />;
    default:
      return <Activity className="w-4 h-4 text-blue-600" />;
  }
};

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

const TransactionLog: React.FC = () => {
  const navigate = useNavigate();
  const { cid } = useParams<{ cid: string }>();
  const { userRole, currentPrincipal, userName: roleUserName, loading: roleLoading } = useRole();
  const userDisplay = getUserDisplayData(currentPrincipal || null);
  const principalText = currentPrincipal?.toString() || userDisplay.userPrincipal;
  const sidebarUserName = roleUserName || (principalText ? `User ${principalText.slice(0, 8)}` : '');
  const sidebarPrincipal = principalText;

  const [child, setChild] = useState<ChildActor | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [connectError, setConnectError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | TxKind>("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "completed" | "pending" | "failed">("all");
  const [dateFilter, setDateFilter] = useState<"all" | "today" | "week" | "month">("all");
  const [transactions, setTransactions] = useState<TransactionUI[]>([]);
  const [loading, setLoading] = useState(false);

  // --- Build child actor from :cid (no plug hook / no services) ---
  useEffect(() => {
    (async () => {
      try {
        if (!cid) throw new Error("No organization selected.");
        const actor = await makeChildWithPlug({ canisterId: cid, host: PLUG_HOST });
        setChild(actor);
      } catch (e: any) {
        setConnectError(e?.message || "Failed to connect to org canister");
      } finally {
        setConnecting(false);
      }
    })();
  }, [cid]);

  // --- Load transactions from child canister ---
  useEffect(() => {
    const load = async () => {
      if (!child) return;
      try {
        setLoading(true);

        // Backend returns newest-first; be defensive anyway
        const raw = await child.getTransactionHistory();
        const arr = Array.isArray(raw) ? raw : [];

        const toNum = (v: number | bigint) => (typeof v === "bigint" ? Number(v) : v);

        const ui: TransactionUI[] = arr.map((tx: any, i: number) => {
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
            fromUser: `User ${fromStr.slice(0, 8)}`,
            fromPrincipal: fromStr,
            toUser: `User ${toStr.slice(0, 8)}`,
            toPrincipal: toStr,
            reason: reason || "No reason provided",
            category: "General",
            timestamp: ts,
            blockHeight: undefined, // unknown on-chain field here; keep placeholders off unless you have real data
            transactionHash: undefined,
            status: "completed",
          };
        });

        // Ensure newest-first
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

  // --- Derived stats ---
  const stats = {
    totalTransactions: transactions.length,
    totalRepAwarded: transactions.filter((t) => t.type === "award").reduce((s, t) => s + t.amount, 0),
    totalRepRevoked: transactions.filter((t) => t.type === "revoke").reduce((s, t) => s + t.amount, 0),
    pendingTransactions: transactions.filter((t) => t.status === "pending").length, // placeholder: all completed in mapping
  };

  const handleDisconnect = () => navigate("/auth");

  // --- Filtering ---
  const filteredTransactions = React.useMemo(() => {
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

  // --- Connect-state UI ---
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
      stats={stats}
      filteredTransactions={filteredTransactions}
      loading={loading}
      setSearchQuery={setSearchQuery}
      searchQuery={searchQuery}
      filterType={filterType}
      setFilterType={setFilterType}
      filterStatus={filterStatus}
      setFilterStatus={setFilterStatus}
      dateFilter={dateFilter}
      setDateFilter={setDateFilter}
    />
  );
};

function InnerTransactionLog(props: any) {
  const {
    cid,
    userRole,
    userDisplay,
    handleDisconnect,
    stats,
    filteredTransactions,
    loading,
    setSearchQuery,
    searchQuery,
    filterType,
    setFilterType,
    filterStatus,
    setFilterStatus,
    dateFilter,
    setDateFilter,
  } = props;

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
            <Button
              variant="outline"
              className="group"
              onClick={() => toast.info("CSV export not wired to backend in this view")}
            >
              <Download className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
              Export CSV
            </Button>
            <ThemeToggle />
          </div>
        </header>

        <main className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-card p-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Transactions</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalTransactions}</p>
                  </div>
                  <Activity className="w-8 h-8 text-primary" />
                </div>
              </Card>

              <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">REP Awarded</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalRepAwarded}</p>
                  </div>
                  <TrendingUp className="w-8 h-8 text-green-500" />
                </div>
              </Card>

              <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">REP Revoked</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalRepRevoked}</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-red-500" />
                </div>
              </Card>

              <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Today's Activity</p>
                    <p className="text-2xl font-bold text-foreground">{stats.pendingTransactions}</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
              </Card>
            </div>

            {/* Filters */}
            <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
              <div className="flex flex-col lg:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search transactions..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 glass-input"
                  />
                </div>

                <div className="flex gap-2">
                  <Select value={filterType} onValueChange={(v: any) => setFilterType(v)}>
                    <SelectTrigger className="w-32 glass-input">
                      <SelectValue placeholder="Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="award">Awards</SelectItem>
                      <SelectItem value="revoke">Revocations</SelectItem>
                      <SelectItem value="decay">Decay</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
                    <SelectTrigger className="w-32 glass-input">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={dateFilter} onValueChange={(v: any) => setDateFilter(v)}>
                    <SelectTrigger className="w-32 glass-input">
                      <SelectValue placeholder="Date" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Time</SelectItem>
                      <SelectItem value="today">Today</SelectItem>
                      <SelectItem value="week">This Week</SelectItem>
                      <SelectItem value="month">This Month</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>

            {/* Transactions */}
            <Card className="glass-card p-6 animate-fade-in" style={{ animationDelay: "0.5s" }}>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-foreground">Transaction History</h2>
                <Badge variant="secondary" className="font-mono">
                  {filteredTransactions.length} transactions
                </Badge>
              </div>

              <div className="space-y-3">
                {loading ? (
                  <div className="text-center py-12 text-muted-foreground">Loading…</div>
                ) : filteredTransactions.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium mb-2">No transactions found</p>
                    <p className="text-sm">Try adjusting your search or filters</p>
                  </div>
                ) : (
                  filteredTransactions.map((tx, idx) => (
                    <div
                      key={tx.id}
                      className="flex items-center justify-between p-4 glass-card rounded-lg hover:shadow-md transition-all duration-200 animate-fade-in"
                      style={{ animationDelay: `${0.6 + idx * 0.05}s` }}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionTypeBgClass(tx.type)}`}>
                          {getTransactionIcon(tx.type)}
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="font-medium text-foreground text-lg">
                              {formatTransactionAmount(tx.type, tx.amount)} REP
                            </span>
                            <Badge variant="outline" className="text-xs capitalize">
                              {getTransactionTypeDescription(tx.type)}
                            </Badge>
                            <Badge
                              variant={
                                tx.status === "completed"
                                  ? "default"
                                  : tx.status === "pending"
                                  ? "secondary"
                                  : "destructive"
                              }
                              className="text-xs"
                            >
                              {tx.status}
                            </Badge>
                          </div>

                          <div className="mb-2">
                            <p className="text-sm text-muted-foreground mb-1">
                              <span className="font-medium">{tx.fromUser}</span>
                              {" → "}
                              <span className="font-medium">{tx.toUser}</span>
                            </p>

                            <div className="bg-muted/30 rounded-lg p-3 mb-2">
                              <p className="text-sm font-medium text-foreground mb-1">Reason:</p>
                              <p className="text-sm text-muted-foreground break-words">{tx.reason}</p>
                            </div>
                          </div>

                          <div className="flex items-center gap-4 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {formatDateTimeForDisplay(tx.timestamp)}
                            </div>
                            {tx.category && (
                              <Badge variant="outline" className="text-xs">
                                {tx.category}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {tx.blockHeight && (
                          <Button variant="ghost" size="sm" className="text-xs">
                            <Eye className="w-3 h-3 mr-1" />
                            Block {tx.blockHeight}
                          </Button>
                        )}
                        {tx.transactionHash && (
                          <Button variant="ghost" size="sm" className="text-xs">
                            <ExternalLink className="w-3 h-3 mr-1" />
                            View Hash
                          </Button>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </Card>
          </div>
        </main>
    </DashboardLayout>
  );
}

export default TransactionLog;
