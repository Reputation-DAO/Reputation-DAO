// src/pages/ViewBalances.tsx
import React, { useState, useEffect, useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Principal } from "@dfinity/principal";

import { type ChildActor } from "@/lib/canisters";

import { useRole, type UserRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { getUserDisplayData } from "@/utils/userUtils";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { DashboardLayout, SidebarTrigger } from "@/components/layout/DashboardLayout";
import WalletCopyBadge from "../components/WalletCopyBadge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Wallet,
  Search,
  TrendingUp,
  TrendingDown,
  Users,
  Crown,
  Shield,
  User,
  Star,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from "lucide-react";
import type { Transaction, TransactionType } from "@/declarations/reputation_dao/reputation_dao.did";

interface UserBalance {
  id: string;
  name: string;
  principal: string;
  role: 'admin' | 'awarder' | 'member';
  reputation: number;
  reputationChange: number;
  lastActivity: Date;
  joinDate: Date;
  totalAwarded: number;
  totalRevoked: number;
  rank: number;
}

type SortOption = 'reputation' | 'name' | 'recent';

interface ViewStats {
  totalUsers: number;
  totalReputation: number;
  averageReputation: number;
  topHolder: UserBalance | null;
  recentGainer: UserBalance | null;
}

const RoleIcon = ({ role }: { role: string }) => {
  switch (role) {
    case 'admin':
      return <Crown className="w-4 h-4 text-yellow-500" />;
    case 'awarder':
      return <Shield className="w-4 h-4 text-blue-500" />;
    default:
      return <User className="w-4 h-4 text-green-500" />;
  }
};

const ViewBalancesPage: React.FC = () => {
  const navigate = useNavigate();
  const { cid } = useParams<{ cid: string }>();
  const { getChildActor, isAuthenticated } = useAuth();

  const { userRole, currentPrincipal, userName: roleUserName, loading: roleLoading } = useRole();
  const userDisplay = getUserDisplayData(currentPrincipal || null);
  const principalText = currentPrincipal?.toString() || userDisplay.userPrincipal;
  const sidebarUserName = roleUserName || (principalText ? `User ${principalText.slice(0, 8)}` : '');
  const sidebarPrincipal = principalText;

  // child canister connection
  const [child, setChild] = useState<ChildActor | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [connectError, setConnectError] = useState<string | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [balanceSearchQuery, setBalanceSearchQuery] = useState("");
  const [searchedBalance, setSearchedBalance] = useState<{ principal: string; balance: number } | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('reputation');
  const [loading, setLoading] = useState(false);
  const [balanceSearchLoading, setBalanceSearchLoading] = useState(false);

  // computed balances
  const [userBalances, setUserBalances] = useState<UserBalance[]>([]);

  // connect child actor from :cid
  useEffect(() => {
    (async () => {
      try {
        if (!cid) throw new Error("No organization selected.");
        if (!isAuthenticated) {
          throw new Error("Please connect a wallet to view balances.");
        }
        const actor = await getChildActor(cid);
        setChild(actor);
      } catch (e: any) {
        setConnectError(e?.message || "Failed to connect to org canister");
      } finally {
        setConnecting(false);
      }
    })();
  }, [cid, getChildActor, isAuthenticated]);

  // derive balances from transaction history
  const loadAllBalances = async () => {
    if (!child) {
      toast.error("Not connected to the organization canister.");
      return;
    }
    try {
      setLoading(true);

      const txs = await child.getTransactionHistory();

      // maps
      const balanceMap = new Map<string, number>();
      const awardSumMap = new Map<string, number>();   // total awarded to user
      const revokeSumMap = new Map<string, number>();  // total revoked from user
      const activityMap = new Map<string, number>();   // ms

      for (const tx of txs) {
        const from = tx.from.toString();
        const to = tx.to.toString();
        const amount = Number(tx.amount ?? 0n);
        const tsMs = Number(tx.timestamp ?? 0n) * 1000;

        if (from) activityMap.set(from, Math.max(activityMap.get(from) || 0, tsMs));
        if (to) activityMap.set(to, Math.max(activityMap.get(to) || 0, tsMs));

        if (!to) continue;

        if ("Award" in tx.transactionType) {
          balanceMap.set(to, (balanceMap.get(to) || 0) + amount);
          awardSumMap.set(to, (awardSumMap.get(to) || 0) + amount);
        } else if ("Revoke" in tx.transactionType) {
          const newBal = Math.max(0, (balanceMap.get(to) || 0) - amount);
          balanceMap.set(to, newBal);
          revokeSumMap.set(to, (revokeSumMap.get(to) || 0) + amount);
        } else if ("Decay" in tx.transactionType) {
          // decay typically from==to; subtract
          const newBal = Math.max(0, (balanceMap.get(to) || 0) - amount);
          balanceMap.set(to, newBal);
          revokeSumMap.set(to, (revokeSumMap.get(to) || 0) + amount);
        }
      }

      // build UI list
      const list: UserBalance[] = Array.from(balanceMap.entries())
        .map(([principal, reputation], idx) => {
          const last = activityMap.get(principal);
          const lastActivity = last ? new Date(last) : new Date(0);
          return {
            id: String(idx + 1),
            name: `User ${principal.slice(0, 8)}`,
            principal,
            role: 'member',
            reputation,
            reputationChange: 0, // could be computed as delta vs. previous snapshot if you store one
            lastActivity,
            joinDate: new Date(Math.max(0, (last || Date.now()) - 90 * 24 * 3600 * 1000)), // placeholder join date
            totalAwarded: awardSumMap.get(principal) || 0,
            totalRevoked: revokeSumMap.get(principal) || 0,
            rank: 0,
          } satisfies UserBalance;
        })
        .sort((a, b) => b.reputation - a.reputation)
        .map((u, i) => ({ ...u, rank: i + 1 }));

      setUserBalances(list);
    } catch (err: any) {
      console.error(err);
      toast.error("Failed to load balances");
      setUserBalances([]);
    } finally {
      setLoading(false);
    }
  };

  // load when child ready
  useEffect(() => {
    if (child) loadAllBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child]);

  // balance lookup via child.getBalance
  const handleBalanceSearch = async () => {
    if (!child) return;
    if (!balanceSearchQuery.trim()) {
      toast.error("Please enter a valid principal ID");
      return;
    }
    try {
      setBalanceSearchLoading(true);
      const p = Principal.fromText(balanceSearchQuery.trim());
      const bal = await child.getBalance(p);
      const n = Number(bal);
      if (Number.isFinite(n)) {
        setSearchedBalance({ principal: balanceSearchQuery.trim(), balance: n });
        toast.success("Balance retrieved successfully!");
      } else {
        setSearchedBalance(null);
        toast.error("Could not retrieve balance for this principal");
      }
    } catch (e) {
      console.error(e);
      toast.error("Invalid principal ID or error retrieving balance");
      setSearchedBalance(null);
    } finally {
      setBalanceSearchLoading(false);
    }
  };

  // filtering & sorting
  const filteredBalances = useMemo<UserBalance[]>(() => {
    const filtered = userBalances.filter(
      (u) =>
        u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.principal.toLowerCase().includes(searchQuery.toLowerCase())
    );
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "reputation":
          return b.reputation - a.reputation;
        case "name":
          return a.name.localeCompare(b.name);
        case "recent":
          return b.lastActivity.getTime() - a.lastActivity.getTime();
        default:
          return b.reputation - a.reputation;
      }
    });
  }, [userBalances, searchQuery, sortBy]);

  // derived stats
  const stats = useMemo<ViewStats>(() => {
    const totalUsers = userBalances.length;
    const totalReputation = userBalances.reduce((s, u) => s + u.reputation, 0);
    const averageReputation = totalUsers > 0 ? Math.round(totalReputation / totalUsers) : 0;
    const topHolder =
      totalUsers > 0 ? userBalances.reduce((p, c) => (p.reputation > c.reputation ? p : c)) : null;
    const recentGainer =
      totalUsers > 0 ? userBalances.reduce((p, c) => (p.reputationChange > c.reputationChange ? p : c)) : null;

    return { totalUsers, totalReputation, averageReputation, topHolder, recentGainer };
  }, [userBalances]);

  const topPerformers = useMemo<UserBalance[]>(() => userBalances.slice(0, 3), [userBalances]);
  const recentChanges = useMemo<UserBalance[]>(
    () =>
      userBalances
        .filter((u) => u.reputationChange !== 0)
        .sort((a, b) => Math.abs(b.reputationChange) - Math.abs(a.reputationChange))
        .slice(0, 5),
    [userBalances]
  );

  const handleDisconnect = () => navigate("/auth");

  // connect-state UI
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

  // === Same fixed-sidebar alignment pattern as before ===
  return (
    <InnerViewBalances
      cid={cid}
      userRole={userRole}
      userDisplay={{
        userName: sidebarUserName,
        userPrincipal: sidebarPrincipal,
        displayName: userDisplay.displayName,
      }}
      handleDisconnect={handleDisconnect}
      stats={stats}
      filteredBalances={filteredBalances}
      loading={loading}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      sortBy={sortBy}
      setSortBy={setSortBy}
      balanceSearchQuery={balanceSearchQuery}
      setBalanceSearchQuery={setBalanceSearchQuery}
      handleBalanceSearch={handleBalanceSearch}
      balanceSearchLoading={balanceSearchLoading}
      searchedBalance={searchedBalance}
      topPerformers={topPerformers}
      recentChanges={recentChanges}
    />
  );
};

interface InnerViewBalancesProps {
  cid: string | undefined;
  userRole: UserRole;
  userDisplay: {
    userName: string;
    userPrincipal: string;
    displayName: string;
  };
  handleDisconnect: () => void;
  stats: ViewStats;
  filteredBalances: UserBalance[];
  loading: boolean;
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
  sortBy: SortOption;
  setSortBy: Dispatch<SetStateAction<SortOption>>;
  balanceSearchQuery: string;
  setBalanceSearchQuery: Dispatch<SetStateAction<string>>;
  handleBalanceSearch: () => Promise<void>;
  balanceSearchLoading: boolean;
  searchedBalance: { principal: string; balance: number } | null;
  topPerformers: UserBalance[];
  recentChanges: UserBalance[];
}

function InnerViewBalances(props: InnerViewBalancesProps) {
  const {
    cid,
    userRole,
    userDisplay,
    handleDisconnect,
    stats,
    filteredBalances,
    loading,
    searchQuery,
    setSearchQuery,
    sortBy,
    setSortBy,
    balanceSearchQuery,
    setBalanceSearchQuery,
    handleBalanceSearch,
    balanceSearchLoading,
    searchedBalance,
    topPerformers,
    recentChanges,
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
      <header className="h-16 border-b border-border/40 flex items-center px-6 glass-header">
          <SidebarTrigger className="mr-4" />
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
              <Wallet className="w-4 h-4 text-green-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">View Balances</h1>
              <p className="text-xs text-muted-foreground">Org: {cid}</p>
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <WalletCopyBadge />
          </div>
        </header>

        <main className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-card p-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Users</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </Card>

              <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: "0.1s" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Reputation</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalReputation.toLocaleString()}</p>
                  </div>
                  <Star className="w-8 h-8 text-yellow-500" />
                </div>
              </Card>

              <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Average Balance</p>
                    <p className="text-2xl font-bold text-foreground">{stats.averageReputation}</p>
                  </div>
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
              </Card>

              <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Top Holder</p>
                    <p className="text-lg font-bold text-foreground">{stats.topHolder?.name || "No data"}</p>
                    <p className="text-sm text-muted-foreground">{stats.topHolder?.reputation || 0} REP</p>
                  </div>
                  <Crown className="w-8 h-8 text-yellow-500" />
                </div>
              </Card>
            </div>

            <Tabs defaultValue="all-balances" className="space-y-6">
              <TabsList className="grid grid-cols-3 w-full max-w-md glass">
                <TabsTrigger value="all-balances">All Balances</TabsTrigger>
                <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                <TabsTrigger value="recent-changes">Recent Changes</TabsTrigger>
              </TabsList>

              {/* All balances */}
              <TabsContent value="all-balances" className="space-y-6">
                {/* Balance Search */}
                <Card className="glass-card p-6 animate-fade-in" style={{ animationDelay: "0.3s" }}>
                  <h3 className="text-lg font-semibold text-foreground mb-4">Check Specific Balance</h3>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Enter principal ID to check balance..."
                        value={balanceSearchQuery}
                        onChange={(e) => setBalanceSearchQuery(e.target.value)}
                        className="pl-10 glass-input"
                        onKeyDown={(e) => e.key === "Enter" && handleBalanceSearch()}
                      />
                    </div>
                    <Button
                      onClick={handleBalanceSearch}
                      disabled={balanceSearchLoading || !balanceSearchQuery.trim()}
                      className="min-w-32"
                    >
                      {balanceSearchLoading ? (
                        <>
                          <div className="w-4 h-4 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Searching...
                        </>
                      ) : (
                        <>
                          <Search className="w-4 h-4 mr-2" />
                          Search
                        </>
                      )}
                    </Button>
                  </div>

                  {searchedBalance && (
                    <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground">Principal ID</p>
                          <p className="font-mono text-sm break-all">{searchedBalance.principal}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Balance</p>
                          <p className="text-2xl font-bold text-primary">{searchedBalance.balance} REP</p>
                        </div>
                      </div>
                    </div>
                  )}
                </Card>

                {/* Search and Sort */}
                <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: "0.4s" }}>
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        placeholder="Search by name or principal ID..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 glass-input"
                      />
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant={sortBy === "reputation" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSortBy("reputation")}
                      >
                        <Star className="w-4 h-4 mr-1" />
                        Reputation
                      </Button>
                      <Button
                        variant={sortBy === "name" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSortBy("name")}
                      >
                        <Filter className="w-4 h-4 mr-1" />
                        Name
                      </Button>
                      <Button
                        variant={sortBy === "recent" ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSortBy("recent")}
                      >
                        <Calendar className="w-4 h-4 mr-1" />
                        Recent
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Balances List */}
                <Card className="glass-card p-6 animate-fade-in" style={{ animationDelay: "0.5s" }}>
                  {loading ? (
                    <div className="text-center py-12 text-muted-foreground">Loading…</div>
                  ) : filteredBalances.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">No users found.</div>
                  ) : (
                    <div className="space-y-3">
                      {filteredBalances.map((user, index) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 glass-card rounded-lg hover:shadow-md transition-all duration-200 animate-fade-in"
                          style={{ animationDelay: `${0.6 + index * 0.05}s` }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-muted-foreground w-8">#{user.rank}</span>
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary-glow/20 text-primary">
                                  {user.name
                                    .split(" ")
                                    .map((n) => n[0])
                                    .join("")
                                    .toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </div>

                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-foreground">{user.name}</span>
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <RoleIcon role={user.role} />
                                  {user.role}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground font-mono break-all">
                                {user.principal.slice(0, 25)}...
                              </p>
                              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                <span>Last active: {user.lastActivity.toLocaleDateString()}</span>
                                <span>Joined: {user.joinDate.toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg font-bold text-foreground">
                                {user.reputation.toLocaleString()} REP
                              </span>
                              {user.reputationChange !== 0 && (
                                <Badge
                                  variant={user.reputationChange > 0 ? "default" : "destructive"}
                                  className="flex items-center gap-1"
                                >
                                  {user.reputationChange > 0 ? (
                                    <ArrowUpRight className="w-3 h-3" />
                                  ) : (
                                    <ArrowDownRight className="w-3 h-3" />
                                  )}
                                  {Math.abs(user.reputationChange)}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <div>Awarded: {user.totalAwarded}</div>
                              {user.totalRevoked > 0 && <div>Revoked: {user.totalRevoked}</div>}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              {/* Leaderboard */}
              <TabsContent value="leaderboard" className="space-y-6">
                <Card className="glass-card p-6 animate-fade-in">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Top Performers</h3>
                  <div className="space-y-4">
                    {topPerformers.length === 0 && <div className="text-sm text-muted-foreground">No data.</div>}
                    {topPerformers.map((user, index) => (
                      <div
                        key={user.id}
                        className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 ${
                          index === 0
                            ? "bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20"
                            : index === 1
                            ? "bg-gradient-to-r from-gray-400/10 to-gray-500/10 border border-gray-400/20"
                            : "bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                              index === 0
                                ? "bg-gradient-to-br from-yellow-500 to-yellow-600"
                                : index === 1
                                ? "bg-gradient-to-br from-gray-400 to-gray-500"
                                : "bg-gradient-to-br from-orange-500 to-orange-600"
                            }`}
                          >
                            {index + 1}
                          </div>
                          <Avatar className="w-12 h-12">
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary-glow/20 text-primary">
                              {user.name
                                .split(" ")
                                .map((n) => n[0])
                                .join("")
                                .toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        </div>

                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-semibold text-foreground">{user.name}</span>
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <RoleIcon role={user.role} />
                              {user.role}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{user.reputation.toLocaleString()} REP</p>
                        </div>

                        <div className="text-right">
                          {user.reputationChange > 0 && (
                            <Badge variant="default" className="flex items-center gap-1">
                              <TrendingUp className="w-3 h-3" />
                              +{user.reputationChange}
                            </Badge>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </TabsContent>

              {/* Recent changes */}
              <TabsContent value="recent-changes" className="space-y-6">
                <Card className="glass-card p-6 animate-fade-in">
                  <h3 className="text-lg font-semibold text-foreground mb-4">Recent Reputation Changes</h3>
                  {recentChanges.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No recent changes.</div>
                  ) : (
                    <div className="space-y-3">
                      {recentChanges.map((user) => (
                        <div
                          key={user.id}
                          className="flex items-center justify-between p-4 glass-card rounded-lg hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary-glow/20 text-primary">
                                {user.name
                                  .split(" ")
                                  .map((n) => n[0])
                                  .join("")
                                  .toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-foreground">{user.name}</span>
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <RoleIcon role={user.role} />
                                  {user.role}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">Current: {user.reputation} REP</p>
                            </div>
                          </div>

                          <Badge
                            variant={user.reputationChange > 0 ? "default" : "destructive"}
                            className="flex items-center gap-1"
                          >
                            {user.reputationChange > 0 ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            {user.reputationChange > 0 ? "+" : ""}
                            {user.reputationChange} REP
                          </Badge>
                        </div>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
    </DashboardLayout>
  );
}

export default ViewBalancesPage;
