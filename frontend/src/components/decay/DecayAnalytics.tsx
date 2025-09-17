// src/components/decay/DecayAnalytics.tsx
import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Paper,
  Divider,
  Chip,
  LinearProgress,
  Alert,
  IconButton,
  Tooltip,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
} from "@mui/material";
import {
  Analytics as AnalyticsIcon,
  TrendingDown as TrendingDownIcon,
  People as PeopleIcon,
  Schedule as ScheduleIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  Info as InfoIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
} from "@mui/icons-material";
import { useParams } from "react-router-dom";
import { useRole } from "../../contexts/RoleContext";
import { makeChildWithPlug, type ChildActor } from "../canister/child";

interface UserBalance {
  userId: string;
  balance: number;
}

interface DecayAnalyticsProps {
  className?: string;
}

interface DecayStats {
  totalUsersWithDecay: number;
  totalDecayedPoints: number;
  averageDecayPerUser: number;
  decayTransactionsCount: number;
  usersAtMinimumThreshold: number;
  usersInGracePeriod: number;
  totalActiveUsers: number;
  decayEfficiency: number;
}

interface UserDecayRisk {
  userId: string;
  currentBalance: number;
  projectedBalance: number;
  decayAmount: number;
  daysUntilDecay: number;
  riskLevel: "Low" | "Medium" | "High" | "Critical";
}

const DecayAnalytics: React.FC<DecayAnalyticsProps> = ({ className }) => {
  const { isAdmin } = useRole();
  const { cid } = useParams<{ cid: string }>();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DecayStats | null>(null);
  const [riskUsers, setRiskUsers] = useState<UserDecayRisk[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    // Prefer route :cid, fallback to legacy localStorage
    const stored = localStorage.getItem("selectedOrgId");
    setOrgId(cid ?? stored ?? null);
  }, [cid]);

  useEffect(() => {
    if (orgId && isAdmin) fetchAnalytics();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId, isAdmin]);

  const fetchAnalytics = async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);

    try {
      const actor: ChildActor = await makeChildWithPlug({ canisterId: orgId });

      // 1) Transactions
      const txs = await actor.getTransactionHistory();
      // tx.transactionType is a Motoko variant: { Decay: null } | { Award: null } | { Revoke: null }
      const decayTxs = txs.filter((tx: any) => tx.transactionType && "Decay" in tx.transactionType);
      const totalDecayedPoints = decayTxs.reduce(
        (sum: number, tx: any) => sum + Number(tx.amount ?? 0n),
        0
      );
      const usersWithDecay = new Set(
        decayTxs.map((tx: any) => tx.to?.toString?.() ?? "")
      ).size;

      // 2) Balances — use health().users to size leaderboard (get all)
      const h = await actor.health();
      const usersCount = Number(h.users ?? 0n);
      const top = BigInt(usersCount > 0 ? usersCount : 0);
      const leaderboard: Array<[any, bigint]> =
        top > 0n ? await actor.leaderboard(top, 0n) : [];

      const userBalances: UserBalance[] = leaderboard.map(([p, bal]) => ({
        userId: p?.toString?.() ?? "",
        balance: Number(bal ?? 0n),
      }));
      const totalActiveUsers = userBalances.length;

      // 3) Risk analysis (UI heuristic)
      const userRisks = await calculateUserRisks(userBalances);

      const calculatedStats: DecayStats = {
        totalUsersWithDecay: usersWithDecay,
        totalDecayedPoints,
        averageDecayPerUser: usersWithDecay > 0 ? totalDecayedPoints / usersWithDecay : 0,
        decayTransactionsCount: decayTxs.length,
        usersAtMinimumThreshold: userRisks.filter((u) => u.riskLevel === "Critical").length,
        usersInGracePeriod: userRisks.filter((u) => u.daysUntilDecay < 0).length,
        totalActiveUsers,
        decayEfficiency: totalActiveUsers > 0 ? (usersWithDecay / totalActiveUsers) * 100 : 0,
      };

      setStats(calculatedStats);
      setRiskUsers(userRisks.slice(0, 10));
      setLastUpdated(new Date());
    } catch (err: any) {
      console.error(err);
      setError(err?.message ?? "Failed to fetch decay analytics");
    } finally {
      setLoading(false);
    }
  };

  const calculateUserRisks = async (userBalances: UserBalance[]): Promise<UserDecayRisk[]> => {
    const risks: UserDecayRisk[] = [];
    for (const user of userBalances) {
      // Heuristic projection for UI (child canister has previewDecayAmount if you want per-user calls)
      const decayAmount = Math.floor(user.balance * 0.02); // 2% placeholder
      const projectedBalance = Math.max(0, user.balance - decayAmount);
      const daysUntilDecay = Math.floor(Math.random() * 7) + 1; // UI placeholder

      let riskLevel: UserDecayRisk["riskLevel"] = "Low";
      if (projectedBalance <= 10) riskLevel = "Critical";
      else if (projectedBalance <= 50) riskLevel = "High";
      else if (projectedBalance <= 100) riskLevel = "Medium";

      risks.push({
        userId: user.userId,
        currentBalance: user.balance,
        projectedBalance,
        decayAmount,
        daysUntilDecay,
        riskLevel,
      });
    }

    return risks.sort((a, b) => {
      const order = { Critical: 4, High: 3, Medium: 2, Low: 1 };
      return order[b.riskLevel] - order[a.riskLevel];
    });
  };

  const formatPrincipal = (p: string) => (p.length > 12 ? `${p.slice(0, 8)}...${p.slice(-4)}` : p);
  const getRiskColor = (risk: UserDecayRisk["riskLevel"]) => {
    switch (risk) {
      case "Critical":
        return "hsl(var(--destructive))";
      case "High":
        return "hsl(var(--warning))";
      case "Medium":
        return "hsl(var(--info))";
      case "Low":
        return "hsl(var(--success))";
      default:
        return "hsl(var(--muted-foreground))";
    }
  };

  const StatCard: React.FC<{
    title: string;
    value: string | number;
    subtitle?: string;
    icon?: React.ReactNode;
  }> = ({ title, value, subtitle, icon }) => (
    <Paper
      sx={{
        p: 4,
        textAlign: "center",
        minHeight: 140,
        borderRadius: "var(--radius)",
        background: "hsl(var(--card))",
        boxShadow:
          "4px 4px 10px hsl(var(--muted)/0.2), -4px -4px 10px hsl(var(--muted)/0.05)",
        transition: "var(--transition-smooth)",
        "&:hover": {
          boxShadow:
            "6px 6px 14px hsl(var(--primary)/0.3), -6px -6px 14px hsl(var(--primary)/0.15)",
        },
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", mb: 2 }}>
        {icon && <Box sx={{ mr: 1, color: "hsl(var(--primary))" }}>{icon}</Box>}
        <Typography variant="h4" sx={{ fontWeight: 600, color: "hsl(var(--foreground))" }}>
          {typeof value === "number" ? value.toLocaleString() : value}
        </Typography>
      </Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 500, color: "hsl(var(--foreground))" }}>
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" sx={{ color: "hsl(var(--muted-foreground))" }}>
          {subtitle}
        </Typography>
      )}
    </Paper>
  );

  if (!isAdmin) {
    return (
      <Card className={className} sx={{ borderRadius: "var(--radius)", boxShadow: "none", background: "hsl(var(--background))" }}>
        <CardContent>
          <Alert
            severity="warning"
            sx={{
              color: "hsl(var(--foreground))",
              backgroundColor: "hsl(var(--warning)/0.1)",
              borderColor: "hsl(var(--warning))",
            }}
          >
            Decay analytics are only available to administrators.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className} sx={{ borderRadius: "var(--radius)", background: "hsl(var(--background))", boxShadow: "none" }}>
      <CardHeader
        title={
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <AnalyticsIcon sx={{ color: "hsl(var(--primary))" }} />
            <Typography variant="h6" sx={{ color: "hsl(var(--foreground))" }}>
              Decay Analytics
            </Typography>
          </Box>
        }
        subheader={
          <Typography variant="caption" sx={{ color: "hsl(var(--muted-foreground))" }}>
            Last updated: {lastUpdated.toLocaleString()}
          </Typography>
        }
        action={
          <Tooltip title="Refresh Analytics">
            <IconButton onClick={fetchAnalytics} size="small" disabled={loading} sx={{ color: "hsl(var(--foreground))" }}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        {loading && (
          <LinearProgress
            sx={{
              mb: 2,
              backgroundColor: "hsl(var(--muted))",
              "& .MuiLinearProgress-bar": { backgroundColor: "hsl(var(--primary))" },
            }}
          />
        )}
        {error && (
          <Alert
            severity="error"
            sx={{
              mb: 2,
              color: "hsl(var(--destructive-foreground))",
              backgroundColor: "hsl(var(--destructive)/0.1)",
            }}
          >
            {error}
          </Alert>
        )}

        {stats && (
          <>
            {/* Key Metrics */}
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1, color: "hsl(var(--foreground))" }}
            >
              <AssessmentIcon /> Key Metrics
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
                gap: 3,
                mb: 4,
              }}
            >
              <StatCard title="Total Decay Events" value={stats.decayTransactionsCount} icon={<ScheduleIcon />} />
              <StatCard title="Points Decayed" value={stats.totalDecayedPoints} icon={<TrendingDownIcon />} />
              <StatCard
                title="Users Affected"
                value={stats.totalUsersWithDecay}
                subtitle={`${stats.decayEfficiency.toFixed(1)}% of active users`}
                icon={<PeopleIcon />}
              />
              <StatCard title="Avg Decay/User" value={Math.round(stats.averageDecayPerUser)} icon={<TimelineIcon />} />
            </Box>

            <Divider sx={{ my: 4, borderColor: "hsl(var(--border))" }} />

            {/* User Risk Analysis */}
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: "flex", alignItems: "center", gap: 1, color: "hsl(var(--foreground))" }}
            >
              <WarningIcon /> User Risk Analysis
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
                gap: 3,
                mb: 4,
              }}
            >
              <StatCard
                title="Critical Risk"
                value={stats.usersAtMinimumThreshold}
                subtitle="Near minimum threshold"
                icon={<WarningIcon />}
              />
              <StatCard
                title="In Grace Period"
                value={stats.usersInGracePeriod}
                subtitle="Protected from decay"
                icon={<InfoIcon />}
              />
              <StatCard
                title="Total Active Users"
                value={stats.totalActiveUsers}
                subtitle="With reputation points"
                icon={<PeopleIcon />}
              />
            </Box>

            {/* High-Risk Users */}
            {riskUsers.length > 0 && (
              <>
                <Typography
                  variant="h6"
                  gutterBottom
                  sx={{ display: "flex", alignItems: "center", gap: 1, color: "hsl(var(--foreground))" }}
                >
                  <TrendingDownIcon /> Users at Risk (Top 10)
                </Typography>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 3,
                    borderRadius: "var(--radius)",
                    background: "hsl(var(--card))",
                    boxShadow:
                      "inset 2px 2px 6px hsl(var(--muted)/0.1), inset -2px -2px 6px hsl(var(--muted)/0.05)",
                  }}
                >
                  <List dense>
                    {riskUsers.map((user, i) => (
                      <ListItem key={user.userId} divider={i < riskUsers.length - 1}>
                        <ListItemIcon>
                          <Typography variant="body2" sx={{ color: "hsl(var(--muted-foreground))" }}>
                            #{i + 1}
                          </Typography>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                              <Typography
                                variant="body2"
                                sx={{ fontFamily: "monospace", color: "hsl(var(--foreground))" }}
                              >
                                {formatPrincipal(user.userId)}
                              </Typography>
                              <Chip
                                label={user.riskLevel}
                                size="small"
                                sx={{
                                  borderColor: getRiskColor(user.riskLevel),
                                  color: "hsl(var(--foreground))",
                                }}
                              />
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" sx={{ color: "hsl(var(--muted-foreground))" }}>
                              Current: {user.currentBalance} → Projected: {user.projectedBalance} (Decay: -
                              {user.decayAmount} in {user.daysUntilDecay} days)
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DecayAnalytics;
