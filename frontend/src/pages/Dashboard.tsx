import React, { useState, useEffect } from 'react';
import { Principal } from '@dfinity/principal';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  People as Users,
  AdminPanelSettings,
  Star,
  NorthEast as ArrowUpRight,
  Refresh,
  History,
  TrendingUp,
} from '@mui/icons-material';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { getPlugActor, getCurrentPrincipal } from '../components/canister/reputationDao';

interface Transaction {
  id: number;
  transactionType: { Award: null } | { Revoke: null };
  from: Principal;
  to: Principal;
  amount: number | bigint;
  timestamp: number | bigint;
  reason: string | null;
}

interface Balance {
  principal: Principal;
  balance: number;
}

interface Awarder {
  id: Principal;
  name: string;
}

interface DashboardData {
  transactions: Transaction[];
  balances: Balance[];
  awarders: Awarder[];
  transactionCount: number;
  currentUser: Principal | null;
  userRole: 'Admin' | string | 'User';
}

interface ChartData {
  date: string;
  awards: number;
  revokes: number;
  net: number;
}

const Dashboard: React.FC = () => {
  const [data, setData] = useState<DashboardData>({
    transactions: [],
    balances: [],
    awarders: [],
    transactionCount: 0,
    currentUser: null,
    userRole: 'User',
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // Format timestamp to relative time
  const formatTime = (timestamp: number | bigint): string => {
    const now = Date.now() / 1000; // Convert to seconds
    const timestampSeconds = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
    const diff = now - timestampSeconds;
    
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  // Get user display name
  const getUserDisplayName = (principal: Principal): string => {
    const principalText = principal.toString();
    
    // Check if it's an awarder
    const awarder = data.awarders.find(a => a.id.toString() === principalText);
    if (awarder) return awarder.name;
    
    // Check if it's the admin/owner (you'll need to replace this with actual owner principal)
    if (principalText === '3d34m-ksxgd-46a66-2ibf7-kutsn-jg3vv-2yfjf-anbwh-u4lpl-tqu7d-yae') {
      return 'Admin';
    }
    
    // Return shortened principal for regular users
    return `${principalText.slice(0, 5)}...${principalText.slice(-3)}`;
  };

  // Process chart data from transactions
  const processChartData = (transactions: Transaction[]): ChartData[] => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - i));
      return date.toISOString().split('T')[0];
    });

    const dailyData = last7Days.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      awards: 0,
      revokes: 0,
      net: 0,
    }));

    // Group transactions by day
    transactions.forEach(tx => {
      const txDate = new Date(typeof tx.timestamp === 'bigint' ? Number(tx.timestamp) * 1000 : tx.timestamp * 1000);
      const txDateString = txDate.toISOString().split('T')[0];
      const dayIndex = last7Days.indexOf(txDateString);
      
      if (dayIndex !== -1) {
        const amount = typeof tx.amount === 'bigint' ? Number(tx.amount) : tx.amount;
        if ('Award' in tx.transactionType) {
          dailyData[dayIndex].awards += amount;
          dailyData[dayIndex].net += amount;
        } else {
          dailyData[dayIndex].revokes += amount;
          dailyData[dayIndex].net -= amount;
        }
      }
    });

    return dailyData;
  };

  // Load all dashboard data
  const loadDashboardData = async () => {
    try {
      setError(null);
      
      const actor = await getPlugActor();
      if (!actor) {
        throw new Error('Failed to connect to blockchain');
      }

      // Get current user
      const currentUser = await getCurrentPrincipal();
      
      // Fetch all data in parallel
      const [
        transactions,
        transactionCount,
        awarders,
      ] = await Promise.all([
        actor.getTransactionHistory(),
        actor.getTransactionCount(),
        actor.getTrustedAwarders(),
      ]);

      // Get balances by fetching transaction history and calculating
      const balanceMap = new Map<string, number>();
      
      // Calculate balances from transaction history
      transactions.forEach((tx: any) => {
        const toKey = tx.to.toString();
        const amount = typeof tx.amount === 'bigint' ? Number(tx.amount) : Number(tx.amount);
        
        if ('Award' in tx.transactionType) {
          // Award transaction - add to recipient
          balanceMap.set(toKey, (balanceMap.get(toKey) || 0) + amount);
        } else {
          // Revoke transaction - subtract from recipient (to field is the user losing reputation)
          balanceMap.set(toKey, (balanceMap.get(toKey) || 0) - amount);
        }
      });

      // Convert to balance array and sort
      const balances = Array.from(balanceMap.entries())
        .map(([principal, balance]) => ({
          principal: Principal.fromText(principal),
          balance: balance,
        }))
        .filter(b => b.balance > 0)
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 10);

      // Determine user role
      let userRole = 'User';
      const currentUserText = currentUser.toString();
      
      // Check if owner (replace with actual owner principal)
      if (currentUserText === '3d34m-ksxgd-46a66-2ibf7-kutsn-jg3vv-2yfjf-anbwh-u4lpl-tqu7d-yae') {
        userRole = 'Admin';
      } else {
        // Check if awarder
        const awarder = awarders.find((a: any) => a.id.toString() === currentUserText);
        if (awarder) {
          userRole = awarder.name;
        }
      }

      setData({
        transactions: transactions.slice(0, 10), // Get latest 10 transactions
        balances: balances, // Already sorted and limited
        awarders,
        transactionCount: Number(transactionCount),
        currentUser,
        userRole,
      });

      // Process chart data
      const processedChartData = processChartData(transactions);
      setChartData(processedChartData);

    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Load data on component mount
  useEffect(() => {
    loadDashboardData();
  }, []);

  // Refresh data
  const handleRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: 'hsl(var(--background))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <CircularProgress sx={{ color: 'hsl(var(--primary))' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'hsl(var(--background))',
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
        transition: 'background-color var(--transition-smooth)',
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography
            variant="h4"
            sx={{
              color: 'hsl(var(--foreground))',
              fontWeight: 600,
              fontSize: { xs: '1.5rem', md: '2rem' },
            }}
          >
            Welcome, {data.userRole}
          </Typography>
          <IconButton
            onClick={handleRefresh}
            disabled={refreshing}
            sx={{
              color: 'hsl(var(--primary))',
              '&:hover': {
                backgroundColor: 'hsl(var(--muted))',
              },
            }}
          >
            {refreshing ? <CircularProgress size={20} /> : <Refresh />}
          </IconButton>
        </Box>
        <Typography
          variant="body1"
          sx={{
            color: 'hsl(var(--muted-foreground))',
            fontSize: '0.875rem',
          }}
        >
          Track your community's reputation and activity
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Main Content */}
        <Box sx={{ flex: 1 }}>
          {/* Stats Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
              mb: 4,
            }}
          >
            {/* Total Transactions Card */}
            <Card
              sx={{
                backgroundColor: 'hsl(var(--muted))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'hsl(var(--foreground) / 0.8)', fontSize: '0.875rem', fontWeight: 500 }}>
                    Total Transactions
                  </Typography>
                  <History sx={{ color: 'hsl(var(--primary))', fontSize: '20px' }} />
                </Box>
                <Typography variant="h4" sx={{ color: 'hsl(var(--foreground))', fontWeight: 600, mb: 1 }}>
                  {data.transactionCount}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TrendingUp sx={{ color: 'hsl(var(--success))', fontSize: '16px' }} />
                  <Typography variant="body2" sx={{ color: 'hsl(var(--success))', fontSize: '0.75rem' }}>
                    All time activity
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Active Members Card */}
            <Card
              sx={{
                backgroundColor: 'hsl(var(--muted))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'hsl(var(--foreground) / 0.8)', fontSize: '0.875rem', fontWeight: 500 }}>
                    Active Members
                  </Typography>
                  <Users sx={{ color: 'hsl(var(--primary))', fontSize: '20px' }} />
                </Box>
                <Typography variant="h4" sx={{ color: 'hsl(var(--foreground))', fontWeight: 600, mb: 1 }}>
                  {data.balances.length}
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ArrowUpRight sx={{ color: 'hsl(var(--success))', fontSize: '16px' }} />
                  <Typography variant="body2" sx={{ color: 'hsl(var(--success))', fontSize: '0.75rem' }}>
                    With reputation
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Recent Activity */}
          <Card
            sx={{
              backgroundColor: 'hsl(var(--muted))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 2,
              mb: 4,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ color: 'hsl(var(--foreground))', fontSize: '1rem', fontWeight: 600 }}>
                  Recent Activity
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    color: 'hsl(var(--primary))',
                    borderColor: 'hsl(var(--border))',
                    fontSize: '0.75rem',
                    '&:hover': {
                      borderColor: 'hsl(var(--primary))',
                      backgroundColor: 'hsl(var(--muted))',
                    },
                  }}
                >
                  View all
                </Button>
              </Box>
              <List sx={{ p: 0 }}>
                {data.transactions.slice(0, 5).map((transaction, index) => (
                  <React.Fragment key={transaction.id}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: 'hsl(var(--primary))',
                            color: 'hsl(var(--primary-foreground))',
                            fontSize: '0.875rem',
                          }}
                        >
                          {getUserDisplayName(transaction.to).charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Box
                              sx={{
                                width: 8,
                                height: 8,
                                borderRadius: 1,
                                backgroundColor: 'Award' in transaction.transactionType ? '#22c55e' : '#ef4444',
                                flexShrink: 0,
                              }}
                            />
                            <Typography variant="body2" sx={{ color: 'hsl(var(--foreground))', fontSize: '0.875rem' }}>
                              {getUserDisplayName(transaction.to)} {'Award' in transaction.transactionType ? 'earned' : 'lost'} {typeof transaction.amount === 'bigint' ? Number(transaction.amount) : transaction.amount} REP
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.75rem', ml: 2.125 }}>
                            from {getUserDisplayName(transaction.from)} • {formatTime(transaction.timestamp)}
                          </Typography>
                        }
                      />
                      <Chip
                        label={'Award' in transaction.transactionType ? '+' + (typeof transaction.amount === 'bigint' ? Number(transaction.amount) : transaction.amount) : '-' + (typeof transaction.amount === 'bigint' ? Number(transaction.amount) : transaction.amount)}
                        size="small"
                        sx={{
                          backgroundColor: 'Award' in transaction.transactionType ? '#22c55e' : '#ef4444',
                          color: 'white',
                          fontSize: '0.65rem',
                          minWidth: 60,
                          fontWeight: 600,
                        }}
                      />
                    </ListItem>
                    {index < Math.min(data.transactions.length, 5) - 1 && (
                      <Divider sx={{ borderColor: 'hsl(var(--border))' }} />
                    )}
                  </React.Fragment>
                ))}
                {data.transactions.length === 0 && (
                  <Typography sx={{ color: 'hsl(var(--muted-foreground))', textAlign: 'center', py: 2 }}>
                    No recent activity
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Activity Chart */}
          <Card
            sx={{
              backgroundColor: 'hsl(var(--muted))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: 'hsl(var(--foreground))', fontSize: '1rem', fontWeight: 600, mb: 3 }}>
                7-Day Activity Overview
              </Typography>
              {chartData.length > 0 ? (
                <Box sx={{ height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorAwards" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0.1}/>
                        </linearGradient>
                        <linearGradient id="colorRevokes" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis 
                        dataKey="date" 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <YAxis 
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'hsl(var(--background))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          color: 'hsl(var(--foreground))',
                        }}
                        labelStyle={{ color: 'hsl(var(--foreground))' }}
                      />
                      <Legend />
                      <Area
                        type="monotone"
                        dataKey="awards"
                        stackId="1"
                        stroke="#22c55e"
                        fillOpacity={1}
                        fill="url(#colorAwards)"
                        name="Awards"
                      />
                      <Area
                        type="monotone"
                        dataKey="revokes"
                        stackId="2"
                        stroke="#ef4444"
                        fillOpacity={1}
                        fill="url(#colorRevokes)"
                        name="Revokes"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </Box>
              ) : (
                <Box
                  sx={{
                    height: 200,
                    backgroundColor: 'hsl(var(--background))',
                    borderRadius: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1px solid hsl(var(--border))',
                  }}
                >
                  <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                    No activity data available
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Right Sidebar */}
        <Box sx={{ width: { lg: 300 }, flexShrink: 0 }}>
          {/* Top Members */}
          <Card
            sx={{
              backgroundColor: 'hsl(var(--muted))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 2,
              mb: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: 'hsl(var(--foreground))', fontSize: '0.875rem', fontWeight: 600, mb: 3 }}>
                Top Members
              </Typography>
              <List sx={{ p: 0 }}>
                {data.balances.slice(0, 5).map((member, index) => (
                  <React.Fragment key={member.principal.toString()}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: 'hsl(var(--primary))',
                            color: 'hsl(var(--primary-foreground))',
                            fontSize: '0.75rem',
                          }}
                        >
                          {getUserDisplayName(member.principal).charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ color: 'hsl(var(--foreground))', fontSize: '0.75rem' }}>
                              {getUserDisplayName(member.principal)}
                            </Typography>
                            <Chip
                              label={`#${index + 1}`}
                              size="small"
                              sx={{
                                backgroundColor: index === 0 ? 'hsl(var(--warning))' : 'hsl(var(--muted-foreground))',
                                color: 'white',
                                fontSize: '0.65rem',
                                height: 18,
                                '& .MuiChip-label': { px: 1 }
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.7rem' }}>
                            {Number(member.balance)} REP
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < Math.min(data.balances.length, 5) - 1 && <Divider sx={{ borderColor: 'hsl(var(--border))' }} />}
                  </React.Fragment>
                ))}
                {data.balances.length === 0 && (
                  <Typography sx={{ color: 'hsl(var(--muted-foreground))', textAlign: 'center', py: 2 }}>
                    No members found
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>

          {/* Trusted Awarders */}
          <Card
            sx={{
              backgroundColor: 'hsl(var(--muted))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: 'hsl(var(--foreground))', fontSize: '0.875rem', fontWeight: 600, mb: 3 }}>
                Trusted Awarders ({data.awarders.length})
              </Typography>
              <List sx={{ p: 0 }}>
                {data.awarders.slice(0, 5).map((awarder, index) => (
                  <React.Fragment key={awarder.id.toString()}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            backgroundColor: 'hsl(var(--success))',
                            color: 'white',
                            fontSize: '0.75rem',
                          }}
                        >
                          <AdminPanelSettings fontSize="small" />
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ color: 'hsl(var(--foreground))', fontSize: '0.75rem', lineHeight: 1.4 }}>
                            {awarder.name}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.65rem' }}>
                            Trusted Awarder
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < Math.min(data.awarders.length, 5) - 1 && <Divider sx={{ borderColor: 'hsl(var(--border))' }} />}
                  </React.Fragment>
                ))}
                {data.awarders.length === 0 && (
                  <Typography sx={{ color: 'hsl(var(--muted-foreground))', textAlign: 'center', py: 2 }}>
                    No awarders found
                  </Typography>
                )}
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>
    </Box>
  );
};

export default Dashboard;
