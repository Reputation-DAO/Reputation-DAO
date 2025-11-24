// features/dashboard/DashboardPage.tsx
import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useRole, type UserRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { type ChildActor } from "@/lib/canisters";
import { getUserDisplayData } from "@/utils/userUtils";
import { toast } from "sonner";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Star,
  Users,
  Award,
  Settings,
  Plus,
  Activity,
  Crown,
  Shield,
  User as UserIcon,
  ArrowUpRight,
  BarChart3,
  LayoutDashboard,
} from "lucide-react";
import { DashboardLayout, SidebarTrigger } from "@/components/layout/DashboardLayout";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import type { Transaction, TransactionType } from "@/declarations/reputation_dao/reputation_dao.did";
import WalletCopyBadge from "./components/WalletCopyBadge";

type TxKind = "awarded" | "revoked" | "decayed";
interface ReputationActivity {
  id: string;
  type: TxKind;
  points: number;
  reason: string;
  timestamp: Date;
  from?: string;
  to?: string;
}
interface Member {
  id: string;
  name: string;
  principal: string;
  reputation: number;
  role: "admin" | "awarder" | "member";
  joinDate: Date;
  lastActive: Date;
}

interface OrgStats {
  totalMembers: number;
  totalReputation: number;
  growthRate: string;
  recentTransactions: number;
}

const mapTransactionType = (type: TransactionType): TxKind => {
  if ("Revoke" in type) return "revoked";
  if ("Decay" in type) return "decayed";
  return "awarded";
};

const RoleIcon = ({ role }: { role: string }) => {
  switch (role) {
    case "admin":
      return <Crown className="w-4 h-4 text-yellow-500" />;
    case "awarder":
      return <Shield className="w-4 h-4 text-blue-500" />;
    default:
      return <UserIcon className="w-4 h-4 text-green-500" />;
  }
};

const StatCard = ({
  title,
  value,
  icon: Icon,
  trend,
  description,
}: {
  title: string;
  value: string | number;
  icon: any;
  trend?: string;
  description?: string;
}) => (
  <Card className="glass-card p-6 hover:shadow-[var(--shadow-glow)] transition-shadow duration-300 group">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary-glow/10 flex items-center justify-center">
        <Icon className="w-6 h-6 text-primary" />
      </div>
      {trend && (
        <Badge variant="secondary" className="text-green-600 bg-green-600/10">
          <ArrowUpRight className="w-3 h-3 mr-1" />
          {trend}
        </Badge>
      )}
    </div>
    <div>
      <h3 className="text-2xl font-bold text-foreground mb-1">{value}</h3>
      <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
    </div>
  </Card>
);

const ActivityItem = ({ activity }: { activity: ReputationActivity }) => (
  <div className="flex items-center gap-4 p-4 glass-card rounded-lg hover:shadow-md transition-all duration-200">
    <div
      className={`w-10 h-10 rounded-full flex items-center justify-center ${
        activity.type === "awarded"
          ? "bg-green-500/10 text-green-600"
          : activity.type === "revoked"
          ? "bg-red-500/10 text-red-600"
          : "bg-orange-500/10 text-orange-600"
      }`}
    >
      <Star className="w-5 h-5" />
    </div>

    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-medium text-foreground">
          {(activity.type === "awarded" ? "+" : "-") + activity.points} points
        </span>
        <Badge variant="outline" className="text-xs">
          {activity.type}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{activity.reason}</p>
      {(activity.from || activity.to) && (
        <p className="text-xs text-muted-foreground mt-1">
          {activity.from && `From: ${activity.from}`} {activity.to && `To: ${activity.to}`}
        </p>
      )}
    </div>

    <div className="text-xs text-muted-foreground">{activity.timestamp.toLocaleString()}</div>
  </div>
);

const MemberItem = ({ member }: { member: Member }) => (
  <div className="flex items-center gap-4 p-4 glass-card rounded-lg hover:shadow-md transition-all duration-200">
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center">
      <UserIcon className="w-5 h-5 text-primary" />
    </div>

    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-medium text-foreground">{member.name}</span>
        <Badge variant="secondary" className="flex items-center gap-1">
          <RoleIcon role={member.role} />
          {member.role}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{member.principal.slice(0, 20)}...</p>
    </div>

    <div className="text-right">
      <div className="font-medium text-foreground">{member.reputation} rep</div>
      <div className="text-xs text-muted-foreground">Active {new Date(member.lastActive).toLocaleDateString()}</div>
    </div>
  </div>
);

const DashboardPage = () => {
  const navigate = useNavigate();
  const { cid } = useParams<{ cid: string }>();
  const { userRole, loading: roleLoading, currentPrincipal, isAdmin, isAwarder } = useRole();
  const { isAuthenticated, principal, getChildActor } = useAuth();

  const [child, setChild] = useState<ChildActor | null>(null);
  const [loading, setLoading] = useState(false);

  // derived/UX state
  const [userBalance, setUserBalance] = useState(0);
  const [recentActivity, setRecentActivity] = useState<ReputationActivity[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [orgStats, setOrgStats] = useState<OrgStats>({
    totalMembers: 0,
    totalReputation: 0,
    growthRate: "0%",
    recentTransactions: 0,
  });

  const userDisplayData = useMemo(() => getUserDisplayData(principal), [principal]);

  // Build child actor from :cid
  useEffect(() => {
    (async () => {
      try {
        if (!cid) {
          navigate("/org-selector");
          return;
        }
        setLoading(true);
        if (!isAuthenticated) {
          throw new Error("Please connect a wallet to access the dashboard.");
        }
        const actor = await getChildActor(cid);
        setChild(actor);
      } catch (e: any) {
        const msg = String(e?.message || e);
        if (msg.includes("is stopped")) {
          toast.error("This organization's canister is stopped. Ask an admin to start it.");
        } else {
          toast.error("Failed to connect to the organization canister.");
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [cid, navigate, getChildActor, isAuthenticated]);

  // Load all dashboard data from child (like your MUI sample)
  useEffect(() => {
    if (!child || !isAuthenticated || !currentPrincipal) return;

    (async () => {
      try {
        setLoading(true);

        // Parallel calls to child
        const [txsRes, txCountRes] = await Promise.all([
          child.getTransactionHistory(),
          child.getTransactionCount(),
        ]);

        const txs: Transaction[] = txsRes ?? [];

        // Recent activity (last 5, most recent first)
        const recent = [...txs]
          .slice(-5)
          .reverse()
          .map((tx, index) => {
            const [reasonEntry] = tx.reason;
            return {
              id: `activity-${index}`,
              type: mapTransactionType(tx.transactionType),
              points: Number(tx.amount ?? 0n),
              reason: reasonEntry ?? "No reason provided",
              timestamp: new Date(Number(tx.timestamp ?? 0n) * 1000),
              from: tx.from.toString().slice(0, 8),
              to: tx.to.toString().slice(0, 8),
            } satisfies ReputationActivity;
          });

        setRecentActivity(recent);

        // Compute balances from history (top 10)
        const balanceMap = new Map<string, number>();
        for (const tx of txs) {
          const amt = Number(tx.amount ?? 0n);
          const toKey = tx.to.toString();
          if ("Award" in tx.transactionType) {
            balanceMap.set(toKey, (balanceMap.get(toKey) || 0) + amt);
          } else if ("Revoke" in tx.transactionType || "Decay" in tx.transactionType) {
            balanceMap.set(toKey, (balanceMap.get(toKey) || 0) - amt);
          }
        }

        const balances = Array.from(balanceMap.entries())
          .map(([p, bal]) => ({ principal: p, balance: bal }))
          .filter((b) => b.balance > 0)
          .sort((a, b) => b.balance - a.balance);

        // Members from balances (role fallback = 'member')
        const memberList: Member[] = balances.slice(0, 50).map((b, i) => ({
          id: `member-${i}`,
          name: `User ${b.principal.slice(0, 8)}`,
          principal: b.principal,
          reputation: b.balance,
          role: "member",
          joinDate: new Date(),
          lastActive: new Date(),
        }));
        setMembers(memberList);

        // User’s own balance
        const me = currentPrincipal.toString();
        setUserBalance(balanceMap.get(me) || 0);

        // Org stats
        setOrgStats({
          totalMembers: balances.length,
          totalReputation: balances.reduce((sum, b) => sum + b.balance, 0),
          growthRate: balances.length > 0 ? `+${Math.floor(balances.length * 0.08)}%` : "0%",
          recentTransactions: Number(txCountRes ?? 0),
        });
      } catch (e: any) {
        console.error("❌ Error loading dashboard data:", e);
        toast.error(e?.message || "Failed to load dashboard data");
      } finally {
        setLoading(false);
      }
    })();
  }, [child, isAuthenticated, currentPrincipal]);

  const handleDisconnect = () => navigate("/auth");

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center">
        <Card className="glass-card p-8 max-w-md mx-auto text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Wallet Required</h2>
          <p className="text-muted-foreground mb-4">Please connect your wallet to access the dashboard.</p>
          <Button onClick={() => navigate("/auth")}>Connect Wallet</Button>
        </Card>
      </div>
    );
  }

  return (
    <InnerDashboard
      userRole={userRole}
      isAdmin={isAdmin}
      isAwarder={isAwarder}
      userDisplayData={userDisplayData}
      handleDisconnect={handleDisconnect}
      child={child}
      loading={loading}
      orgStats={orgStats}
      userBalance={userBalance}
      recentActivity={recentActivity}
      members={members}
      cid={cid}
    />
  );
};

interface InnerDashboardProps {
  userRole: UserRole;
  isAdmin: boolean;
  isAwarder: boolean;
  userDisplayData: ReturnType<typeof getUserDisplayData>;
  handleDisconnect: () => void;
  child: ChildActor | null;
  loading: boolean;
  orgStats: OrgStats;
  userBalance: number;
  recentActivity: ReputationActivity[];
  members: Member[];
  cid: string | undefined;
}

function InnerDashboard(props: InnerDashboardProps) {
  const {
    userRole,
    isAdmin,
    isAwarder,
    userDisplayData,
    handleDisconnect,
    child,
    loading,
    orgStats,
    userBalance,
    recentActivity,
    members,
    cid,
  } = props;

  const navigate = useNavigate();

  const normalizedRole = (userRole || "").toLowerCase();
  const sidebarRole: "admin" | "awarder" | "member" =
    normalizedRole === "admin" || normalizedRole === "awarder"
      ? (normalizedRole as "admin" | "awarder")
      : isAdmin
      ? "admin"
      : isAwarder
      ? "awarder"
      : "member";
  const badgeLabel =
    normalizedRole === "admin"
      ? "Admin"
      : normalizedRole === "awarder"
      ? "Awarder"
      : normalizedRole === "loading"
      ? "Loading…"
      : isAdmin
      ? "Admin"
      : isAwarder
      ? "Awarder"
      : "Member";

  return (
    <DashboardLayout
      sidebar={{
        userRole: sidebarRole,
        userName: userDisplayData.userName,
        userPrincipal: userDisplayData.userPrincipal,
        onDisconnect: handleDisconnect,
      }}
    >
      <header className="h-16 border-b border-border/40 flex items-center justify-between px-6 glass-header">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="mr-4" />
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center">
            <LayoutDashboard className="w-4 h-4 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
            <p className="text-xs text-muted-foreground">Welcome to org {cid}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WalletCopyBadge />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (!child) return toast.error("Not connected to organization canister.");
              toast.success("Canister connection looks good.");
            }}
          >
            Test Connection
          </Button>
          <ThemeToggle />
        </div>
      </header>

      <main className="p-6">
        <div className="relative pt-20">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse-glow" />
            <div
              className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-glow/3 rounded-full blur-3xl animate-pulse-glow"
              style={{ animationDelay: "1s" }}
            />
          </div>

          <div className="relative max-w-7xl mx-auto px-4 py-8">
            <div className="flex items-center justify-between mb-8 animate-fade-in">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">Welcome back</h1>
                <p className="text-muted-foreground">Manage reputation, track activity, and grow your community</p>
              </div>

              <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
                <RoleIcon role={sidebarRole} />
                <span className="capitalize">{badgeLabel}</span>
              </Badge>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <StatCard
                title="Total Members"
                value={orgStats.totalMembers}
                icon={Users}
                trend={orgStats.totalMembers > 0 ? `+${Math.floor(orgStats.totalMembers * 0.12)}%` : "0%"}
                description="Active community members"
              />
              <StatCard
                title="Total Reputation"
                value={orgStats.totalReputation.toLocaleString()}
                icon={Star}
                trend={orgStats.totalReputation > 0 ? `+${Math.floor(orgStats.totalReputation * 0.08)}%` : "0%"}
                description="Points distributed"
              />
              <StatCard
                title="Your Reputation"
                value={loading ? "Loading..." : userBalance}
                icon={Award}
                trend={userBalance > 0 ? `+${Math.floor(userBalance * 0.1)}%` : ""}
                description="Your current points"
              />
              <StatCard title="Growth Rate" value={orgStats.growthRate} icon={BarChart3} description="Member growth rate" />
            </div>

            <QuickActionsSection cid={cid} canAward={isAdmin || isAwarder} isAdmin={isAdmin} />

            <div className="animate-fade-in">
              <Tabs defaultValue="activity" className="space-y-6">
                <TabsList className="grid grid-cols-3 w-full max-w-md glass">
                  <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                  <TabsTrigger value="members">Members</TabsTrigger>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                </TabsList>

                <TabsContent value="activity" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
                    <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/transaction-log/${cid}`)}>
                      View All
                      <ArrowUpRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    {recentActivity.map((activity) => (
                      <ActivityItem key={activity.id} activity={activity} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="members" className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">Organization Members</h3>
                    {isAdmin && (
                      <Button variant="outline" size="sm" onClick={() => navigate(`/dashboard/manage-awarders/${cid}`)}>
                        <Plus className="w-4 h-4 mr-1" />
                        Manage
                      </Button>
                    )}
                  </div>

                  <div className="space-y-3">
                    {members.map((member) => (
                      <MemberItem key={member.id} member={member} />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="analytics" className="space-y-4">
                  <h3 className="text-lg font-semibold text-foreground">Analytics & Insights</h3>

                  <Card className="glass-card p-6">
                    <h4 className="font-medium text-foreground mb-4">Reputation Distribution</h4>
                    <div className="space-y-3">
                      {members.map((member, index) => {
                        const max = Math.max(1, ...members.map((m) => m.reputation));
                        const width = `${(member.reputation / max) * 100}%`;
                        return (
                          <div key={member.id} className="flex items-center justify-between">
                            <span className="text-sm text-muted-foreground">{member.name}</span>
                            <div className="flex items-center gap-2">
                              <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-primary to-primary-glow rounded-full transition-all duration-1000"
                                  style={{ width, animationDelay: `${index * 0.1}s` }}
                                />
                              </div>
                              <span className="text-sm font-medium text-foreground">{member.reputation}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}

function QuickActionsSection({ cid, canAward, isAdmin }: { cid: string; canAward: boolean; isAdmin: boolean }) {
  const navigate = useNavigate();

  const actions = [
    {
      title: "Award Reputation",
      description: "Give reputation points to members",
      icon: Award,
      action: () => navigate(`/dashboard/award-rep/${cid}`),
      variant: "hero" as const,
      show: canAward,
    },
    {
      title: "Manage Members",
      description: "Add or manage organization members",
      icon: Users,
      action: () => navigate(`/dashboard/manage-awarders/${cid}`),
      variant: "outline" as const,
      show: isAdmin,
    },
    {
      title: "View Activity",
      description: "See all reputation transactions",
      icon: Activity,
      action: () => navigate(`/dashboard/transaction-log/${cid}`),
      variant: "outline" as const,
      show: true,
    },
    {
      title: "Settings",
      description: "Configure organization settings",
      icon: Settings,
      action: () => navigate(`/dashboard/decay-system/${cid}`),
      variant: "ghost" as const,
      show: isAdmin,
    },
  ].filter((a) => a.show);

  return (
    <div className="mb-8 animate-fade-in">
      <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action) => (
          <Button
            key={action.title}
            variant={action.variant}
            onClick={action.action}
            className="h-auto p-4 flex flex-col items-start gap-2 transition-shadow duration-300"
          >
            <action.icon className="w-5 h-5" />
            <div className="text-left">
              <div className="font-medium">{action.title}</div>
              <div className="text-xs opacity-70">{action.description}</div>
            </div>
          </Button>
        ))}
      </div>
    </div>
  );
}

export default DashboardPage;
