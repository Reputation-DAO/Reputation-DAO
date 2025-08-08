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
  // @ts-ignore - Type definitions will be updated after interface regeneration
  getAllUserBalances,
  getTransactionHistory,
  // @ts-ignore - Type definitions will be updated after interface regeneration
  getDecayAnalytics,
  // @ts-ignore - Type definitions will be updated after interface regeneration
  getDecayStatistics,
} from '../canister/reputationDao';

// Temporary type definitions until interface regeneration
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
  decayEfficiency: number; // Percentage of users affected by decay
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
  // @ts-ignore - Temporary until RoleContext is updated
  const isAdmin = true; // Temporary admin check
  const [stats, setStats] = useState<DecayStats | null>(null);
  const [riskUsers, setRiskUsers] = useState<UserDecayRisk[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  useEffect(() => {
    if (isAdmin) {
      fetchAnalytics();
    }
  }, [isAdmin]);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError(null);

    try {
      // Fetch all necessary data
      const [userBalances, transactions] = await Promise.all([
        getAllUserBalances(),
        getTransactionHistory(),
      ]);

      // Calculate decay statistics
      const decayTransactions = transactions.filter((tx: any) => tx.transactionType === 'Decay');
      const totalDecayedPoints = decayTransactions.reduce((sum: number, tx: any) => sum + tx.amount, 0);
      const usersWithDecay = new Set(decayTransactions.map((tx: any) => tx.to.toString())).size;
      const totalActiveUsers = userBalances.length;

      // Calculate user risk analysis
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
      setRiskUsers(userRisks.slice(0, 10)); // Top 10 at-risk users
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching decay analytics:', err);
      setError('Failed to fetch decay analytics');
    } finally {
      setLoading(false);
    }
  };

  const calculateUserRisks = async (userBalances: UserBalance[]): Promise<UserDecayRisk[]> => {
    const risks: UserDecayRisk[] = [];

    // This is a simplified calculation - in practice, this would use the actual decay calculation from the backend
    for (const user of userBalances) {
      // Simplified decay calculation (2% per week as example)
      const weeklyDecayRate = 0.02;
      const decayAmount = Math.floor(user.balance * weeklyDecayRate);
      const projectedBalance = user.balance - decayAmount;
      
      // Simulate days until next decay (would come from backend)
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
      const riskOrder = { 'Critical': 4, 'High': 3, 'Medium': 2, 'Low': 1 };
      return riskOrder[b.riskLevel] - riskOrder[a.riskLevel];
    });
  };

  const formatPrincipal = (principal: string) => {
    return `${principal.slice(0, 8)}...${principal.slice(-4)}`;
  };

  const getRiskColor = (risk: UserDecayRisk['riskLevel']) => {
    switch (risk) {
      case 'Critical': return 'error';
      case 'High': return 'warning';
      case 'Medium': return 'info';
      case 'Low': return 'success';
      default: return 'default';
    }
  };

  const StatCard: React.FC<{ title: string; value: string | number; subtitle?: string; color?: string; icon?: React.ReactNode }> = ({
    title, value, subtitle, color = 'primary', icon
  }) => (
    <Paper sx={{ p: 2, textAlign: 'center', minHeight: 120 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 1 }}>
        {icon && <Box sx={{ mr: 1, color: `${color}.main` }}>{icon}</Box>}
        <Typography variant="h4" color={`${color}.main`} fontWeight="bold">
          {typeof value === 'number' ? value.toLocaleString() : value}
        </Typography>
      </Box>
      <Typography variant="subtitle2" color="text.primary" fontWeight="medium">
        {title}
      </Typography>
      {subtitle && (
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      )}
    </Paper>
  );

  if (!isAdmin) {
    return (
      <Card className={className}>
        <CardContent>
          <Alert severity="warning">
            Decay analytics are only available to administrators.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
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
            <IconButton onClick={fetchAnalytics} size="small" disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        }
      />
      <CardContent>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {stats && (
          <>
            {/* Key Metrics */}
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AssessmentIcon />
              Key Metrics
            </Typography>
            
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: 2, 
              mb: 3 
            }}>
              <StatCard
                title="Total Decay Events"
                value={stats.decayTransactionsCount}
                icon={<ScheduleIcon />}
                color="warning"
              />
              <StatCard
                title="Points Decayed"
                value={stats.totalDecayedPoints}
                icon={<TrendingDownIcon />}
                color="error"
              />
              <StatCard
                title="Users Affected"
                value={stats.totalUsersWithDecay}
                subtitle={`${stats.decayEfficiency.toFixed(1)}% of active users`}
                icon={<PeopleIcon />}
                color="info"
              />
              <StatCard
                title="Avg Decay/User"
                value={Math.round(stats.averageDecayPerUser)}
                icon={<TimelineIcon />}
                color="secondary"
              />
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Risk Analysis */}
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <WarningIcon />
              User Risk Analysis
            </Typography>

            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 2, 
              mb: 3 
            }}>
              <StatCard
                title="Critical Risk"
                value={stats.usersAtMinimumThreshold}
                subtitle="Near minimum threshold"
                color="error"
                icon={<WarningIcon />}
              />
              <StatCard
                title="In Grace Period"
                value={stats.usersInGracePeriod}
                subtitle="Protected from decay"
                color="success"
                icon={<InfoIcon />}
              />
              <StatCard
                title="Total Active Users"
                value={stats.totalActiveUsers}
                subtitle="With reputation points"
                color="primary"
                icon={<PeopleIcon />}
              />
            </Box>

            {/* High-Risk Users */}
            {riskUsers.length > 0 && (
              <>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingDownIcon />
                  Users at Risk (Top 10)
                </Typography>
                
                <Paper variant="outlined" sx={{ p: 2 }}>
                  <List dense>
                    {riskUsers.map((user, index) => (
                      <ListItem key={user.userId} divider={index < riskUsers.length - 1}>
                        <ListItemIcon>
                          <Typography variant="body2" color="text.secondary">
                            #{index + 1}
                          </Typography>
                        </ListItemIcon>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                                {formatPrincipal(user.userId)}
                              </Typography>
                              <Chip
                                label={user.riskLevel}
                                size="small"
                                color={getRiskColor(user.riskLevel) as any}
                                variant="outlined"
                              />
                            </Box>
                          }
                          secondary={
                            <Typography variant="caption" color="text.secondary">
                              Current: {user.currentBalance} → Projected: {user.projectedBalance} 
                              (Decay: -{user.decayAmount} in {user.daysUntilDecay} days)
                            </Typography>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                </Paper>
              </>
            )}

            {/* System Health Summary */}
            <Box sx={{ mt: 3, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="subtitle1" gutterBottom>
                System Health Summary
              </Typography>
              <Typography variant="body2" color="text.secondary">
                The decay system is functioning with {stats.decayEfficiency.toFixed(1)}% efficiency, 
                affecting {stats.totalUsersWithDecay} out of {stats.totalActiveUsers} active users. 
                {stats.usersAtMinimumThreshold > 0 && (
                  <span style={{ color: '#f44336' }}>
                    {' '}⚠️ {stats.usersAtMinimumThreshold} users are at critical risk.
                  </span>
                )}
                {stats.usersInGracePeriod > 0 && (
                  <span style={{ color: '#4caf50' }}>
                    {' '}✅ {stats.usersInGracePeriod} users are protected by grace period.
                  </span>
                )}
              </Typography>
            </Box>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export default DecayAnalytics;
