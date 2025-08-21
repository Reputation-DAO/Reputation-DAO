import React, { useState, useEffect } from 'react';
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
} from '@mui/material';
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
} from '@mui/icons-material';
import {
  getOrgUserBalances,
  getOrgTransactionHistory,
} from '../canister/reputationDao';
import { useRole } from '../../contexts/RoleContext';

interface UserBalance {
  userId: any;
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
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
}

const DecayAnalytics: React.FC<DecayAnalyticsProps> = ({ className }) => {
  const { isAdmin } = useRole();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<DecayStats | null>(null);
  const [riskUsers, setRiskUsers] = useState<UserDecayRisk[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    const storedOrgId = localStorage.getItem('selectedOrgId');
    if (storedOrgId) setOrgId(storedOrgId);
  }, []);

  useEffect(() => {
    if (orgId && isAdmin) fetchAnalytics();
  }, [orgId, isAdmin]);

  const fetchAnalytics = async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);

    try {
      const [userBalances, transactions] = await Promise.all([
        getOrgUserBalances(orgId),
        getOrgTransactionHistory(orgId),
      ]);

      const decayTransactions = transactions.filter((tx: any) => tx.transactionType === 'Decay');
      const totalDecayedPoints = decayTransactions.reduce((sum: number, tx: any) => sum + tx.amount, 0);
      const usersWithDecay = new Set(decayTransactions.map((tx: any) => tx.to.toString())).size;
      const totalActiveUsers = userBalances.length;

      const userRisks = await calculateUserRisks(userBalances);

      const calculatedStats: DecayStats = {
        totalUsersWithDecay: usersWithDecay,
        totalDecayedPoints,
        averageDecayPerUser: usersWithDecay > 0 ? totalDecayedPoints / usersWithDecay : 0,
        decayTransactionsCount: decayTransactions.length,
        usersAtMinimumThreshold: userRisks.filter(u => u.riskLevel === 'Critical').length,
        usersInGracePeriod: userRisks.filter(u => u.daysUntilDecay < 0).length,
        totalActiveUsers,
        decayEfficiency: totalActiveUsers > 0 ? (usersWithDecay / totalActiveUsers) * 100 : 0,
      };

      setStats(calculatedStats);
      setRiskUsers(userRisks.slice(0, 10));
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError('Failed to fetch decay analytics');
    } finally {
      setLoading(false);
    }
  };

  const calculateUserRisks = async (userBalances: UserBalance[]): Promise<UserDecayRisk[]> => {
    const risks: UserDecayRisk[] = [];
    for (const user of userBalances) {
      const decayAmount = Math.floor(user.balance * 0.02);
      const projectedBalance = user.balance - decayAmount;
      const daysUntilDecay = Math.floor(Math.random() * 7) + 1;

      let riskLevel: UserDecayRisk['riskLevel'] = 'Low';
      if (projectedBalance <= 10) riskLevel = 'Critical';
      else if (projectedBalance <= 50) riskLevel = 'High';
      else if (projectedBalance <= 100) riskLevel = 'Medium';

      risks.push({
        userId: user.userId.toString(),
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

  const formatPrincipal = (p: string) => `${p.slice(0, 8)}...${p.slice(-4)}`;
  const getRiskColor = (risk: UserDecayRisk['riskLevel']) => {
    switch (risk) {
      case 'Critical': return 'error';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const StatCard: React.FC<{ title: string; value: string | number; subtitle?: string; icon?: React.ReactNode }> = ({ title, value, subtitle, icon }) => (
    <Paper sx={{
      p: 2,
      textAlign: 'center',
      minHeight: 120,
      borderRadius: 'var(--radius)',
      background: 'hsl(var(--card))',
      boxShadow: '4px 4px 10px hsl(var(--muted) / 0.2), -4px -4px 10px hsl(var(--muted) / 0.05)',
      transition: 'var(--transition-smooth)',
      '&:hover': {
        boxShadow: '6px 6px 14px hsl(var(--primary) / 0.3), -6px -6px 14px hsl(var(--primary) / 0.15)',
      }
    }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
        {icon && <Box sx={{ mr: 1, color: 'var(--primary)' }}>{icon}</Box>}
        <Typography variant="h4" sx={{ fontWeight: 600 }}>{typeof value === 'number' ? value.toLocaleString() : value}</Typography>
      </Box>
      <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>{title}</Typography>
      {subtitle && <Typography variant="caption" color="text.secondary">{subtitle}</Typography>}
    </Paper>
  );

  if (!isAdmin) return (
    <Card className={className} sx={{ borderRadius: 'var(--radius)', boxShadow: 'none' }}>
      <CardContent>
        <Alert severity="warning">Decay analytics are only available to administrators.</Alert>
      </CardContent>
    </Card>
  );

  return (
    <Card className={className} sx={{ borderRadius: 'var(--radius)', background: 'hsl(var(--background))', boxShadow: 'none' }}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <AnalyticsIcon />
            <Typography variant="h6">Decay Analytics</Typography>
          </Box>
        }
        subheader={`Last updated: ${lastUpdated.toLocaleString()}`}
        action={
          <Tooltip title="Refresh Analytics">
            <IconButton onClick={fetchAnalytics} size="small" disabled={loading}><RefreshIcon /></IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {stats && (
          <>
            {/* Key Metrics */}
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssessmentIcon /> Key Metrics
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 2, mb: 3 }}>
              <StatCard title="Total Decay Events" value={stats.decayTransactionsCount} icon={<ScheduleIcon />} />
              <StatCard title="Points Decayed" value={stats.totalDecayedPoints} icon={<TrendingDownIcon />} />
              <StatCard title="Users Affected" value={stats.totalUsersWithDecay} subtitle={`${stats.decayEfficiency.toFixed(1)}% of active users`} icon={<PeopleIcon />} />
              <StatCard title="Avg Decay/User" value={Math.round(stats.averageDecayPerUser)} icon={<TimelineIcon />} />
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* User Risk Analysis */}
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon /> User Risk Analysis
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 2, mb: 3 }}>
              <StatCard title="Critical Risk" value={stats.usersAtMinimumThreshold} subtitle="Near minimum threshold" icon={<WarningIcon />} />
              <StatCard title="In Grace Period" value={stats.usersInGracePeriod} subtitle="Protected from decay" icon={<InfoIcon />} />
              <StatCard title="Total Active Users" value={stats.totalActiveUsers} subtitle="With reputation points" icon={<PeopleIcon />} />
            </Box>

            {/* High-Risk Users */}
            {riskUsers.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingDownIcon /> Users at Risk (Top 10)
                </Typography>
                <Paper variant="outlined" sx={{
                  p: 2,
                  borderRadius: 'var(--radius)',
                  background: 'hsl(var(--card))',
                  boxShadow: 'inset 2px 2px 6px hsl(var(--muted)/0.1), inset -2px -2px 6px hsl(var(--muted)/0.05)'
                }}>
                  <List dense>
                    {riskUsers.map((user, i) => (
                      <ListItem key={user.userId} divider={i < riskUsers.length - 1}>
                        <ListItemIcon><Typography variant="body2" color="text.secondary">#{i + 1}</Typography></ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>{formatPrincipal(user.userId)}</Typography>
                              <Chip label={user.riskLevel} size="small" color={getRiskColor(user.riskLevel) as any} variant="outlined" />
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              Current: {user.currentBalance} → Projected: {user.projectedBalance} (Decay: -{user.decayAmount} in {user.daysUntilDecay} days)
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
