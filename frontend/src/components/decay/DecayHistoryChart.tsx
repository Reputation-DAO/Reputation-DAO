import React, { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  LinearProgress,
  IconButton,
  Tooltip,
  Paper,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  ShowChart as ShowChartIcon,
} from '@mui/icons-material';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip as ChartTooltip, 
  Legend,
  BarChart,
  Bar,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  getOrgTransactionHistory,
  // @ts-ignore - Type definitions will be updated after interface regeneration
  getDecayAnalytics,
} from '../canister/reputationDao';

interface DecayHistoryChartProps {
  className?: string;
}

interface ChartDataPoint {
  date: string;
  timestamp: number;
  decayEvents: number;
  totalDecayed: number;
  usersAffected: number;
  averageDecay: number;
}

interface UserDecayBreakdown {
  userId: string;
  totalDecayed: number;
  eventCount: number;
  lastDecay: number;
}

const DecayHistoryChart: React.FC<DecayHistoryChartProps> = ({ className }) => {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [userBreakdown, setUserBreakdown] = useState<UserDecayBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [orgId, setOrgId] = useState<string | null>(null);

  // Get orgId from localStorage
  useEffect(() => {
    const storedOrgId = localStorage.getItem('selectedOrgId');
    if (storedOrgId) {
      setOrgId(storedOrgId);
    }
  }, []);

  // Color scheme for charts
  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  useEffect(() => {
    if (orgId) {
      fetchDecayHistory();
    }
  }, [timeRange, orgId]);

  const fetchDecayHistory = async () => {
    if (!orgId) return;
    
    setLoading(true);
    setError(null);

    try {
      const allTransactions = await getOrgTransactionHistory(orgId);
      const decayTransactions = allTransactions.filter((tx: any) => tx.transactionType === 'Decay');
      
      setTransactions(decayTransactions);
      processChartData(decayTransactions);
      processUserBreakdown(decayTransactions);
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Error fetching decay history:', err);
      setError('Failed to fetch decay history');
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (decayTransactions: any[]) => {
    const now = Date.now() / 1000;
    const ranges = {
      '7d': 7 * 24 * 3600,
      '30d': 30 * 24 * 3600,
      '90d': 90 * 24 * 3600,
      '1y': 365 * 24 * 3600,
    };

    const cutoff = now - (ranges[timeRange as keyof typeof ranges] || ranges['30d']);
    const relevantTransactions = decayTransactions.filter(tx => tx.timestamp >= cutoff);

    // Group transactions by day
    const dailyData = new Map<string, {
      decayEvents: number;
      totalDecayed: number;
      usersAffected: Set<string>;
    }>();

    relevantTransactions.forEach((tx: any) => {
      const date = new Date(tx.timestamp * 1000).toISOString().split('T')[0];
      
      if (!dailyData.has(date)) {
        dailyData.set(date, {
          decayEvents: 0,
          totalDecayed: 0,
          usersAffected: new Set(),
        });
      }

      const dayData = dailyData.get(date)!;
      dayData.decayEvents++;
      dayData.totalDecayed += tx.amount;
      dayData.usersAffected.add(tx.to.toString());
    });

    // Convert to chart format
    const chartPoints: ChartDataPoint[] = Array.from(dailyData.entries()).map(([date, data]) => ({
      date,
      timestamp: new Date(date).getTime(),
      decayEvents: data.decayEvents,
      totalDecayed: data.totalDecayed,
      usersAffected: data.usersAffected.size,
      averageDecay: data.usersAffected.size > 0 ? data.totalDecayed / data.usersAffected.size : 0,
    }));

    // Fill in missing days with zeros
    const startDate = new Date(cutoff * 1000);
    const endDate = new Date();
    const filledData: ChartDataPoint[] = [];

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const existingData = chartPoints.find(p => p.date === dateStr);
      
      filledData.push(existingData || {
        date: dateStr,
        timestamp: d.getTime(),
        decayEvents: 0,
        totalDecayed: 0,
        usersAffected: 0,
        averageDecay: 0,
      });
    }

    setChartData(filledData.sort((a, b) => a.timestamp - b.timestamp));
  };

  const processUserBreakdown = (decayTransactions: any[]) => {
    const userMap = new Map<string, {
      totalDecayed: number;
      eventCount: number;
      lastDecay: number;
    }>();

    decayTransactions.forEach((tx: any) => {
      const userId = tx.to.toString();
      
      if (!userMap.has(userId)) {
        userMap.set(userId, {
          totalDecayed: 0,
          eventCount: 0,
          lastDecay: 0,
        });
      }

      const userData = userMap.get(userId)!;
      userData.totalDecayed += tx.amount;
      userData.eventCount++;
      userData.lastDecay = Math.max(userData.lastDecay, tx.timestamp);
    });

    const breakdown: UserDecayBreakdown[] = Array.from(userMap.entries())
      .map(([userId, data]) => ({
        userId,
        totalDecayed: data.totalDecayed,
        eventCount: data.eventCount,
        lastDecay: data.lastDecay,
      }))
      .sort((a, b) => b.totalDecayed - a.totalDecayed)
      .slice(0, 10); // Top 10 users by total decay

    setUserBreakdown(breakdown);
  };

  const formatPrincipal = (principal: string) => {
    return `${principal.slice(0, 8)}...${principal.slice(-4)}`;
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  const totalStats = useMemo(() => {
    const total = chartData.reduce((acc, day) => ({
      events: acc.events + day.decayEvents,
      points: acc.points + day.totalDecayed,
      users: acc.users + day.usersAffected,
    }), { events: 0, points: 0, users: 0 });

    return {
      ...total,
      avgPerDay: chartData.length > 0 ? total.events / chartData.length : 0,
      avgPointsPerDay: chartData.length > 0 ? total.points / chartData.length : 0,
    };
  }, [chartData]);

  const pieChartData = useMemo(() => {
    return userBreakdown.slice(0, 5).map((user, index) => ({
      name: formatPrincipal(user.userId),
      value: user.totalDecayed,
      color: colors[index % colors.length],
    }));
  }, [userBreakdown]);

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, border: '1px solid #ccc' }}>
          <Typography variant="body2" fontWeight="bold">
            {new Date(label).toLocaleDateString()}
          </Typography>
          {payload.map((entry: any, index: number) => (
            <Typography key={index} variant="body2" sx={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (chartData.length === 0) {
      return (
        <Box sx={{ textAlign: 'center', py: 4 }}>
          <Typography variant="body2" color="text.secondary">
            No decay data available for the selected time range
          </Typography>
        </Box>
      );
    }

    const commonProps = {
      width: '100%',
      height: 400,
      data: chartData,
    };

    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()} 
              />
              <YAxis />
              <ChartTooltip content={<CustomTooltip />} />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="decayEvents" 
                stroke="#8884d8" 
                name="Decay Events"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="totalDecayed" 
                stroke="#82ca9d" 
                name="Points Decayed"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="usersAffected" 
                stroke="#ffc658" 
                name="Users Affected"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="date" 
                tickFormatter={(value) => new Date(value).toLocaleDateString()} 
              />
              <YAxis />
              <ChartTooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="decayEvents" fill="#8884d8" name="Decay Events" />
              <Bar dataKey="totalDecayed" fill="#82ca9d" name="Points Decayed" />
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
            <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
              Top 5 Users by Total Points Decayed
            </Typography>
          </Box>
        );

      default:
        return null;
    }
  };

  // Show loading message if orgId is not available
  if (!orgId) {
    return (
      <Card className={className}>
        <CardContent>
          <Alert severity="info">
            Please select an organization to view decay history and trends.
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
            <TimelineIcon />
            <Typography variant="h6">Decay History & Trends</Typography>
          </Box>
        }
        subheader={`Last updated: ${lastUpdated.toLocaleString()}`}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Range</InputLabel>
              <Select
                value={timeRange}
                onChange={(e) => setTimeRange(e.target.value)}
                label="Range"
              >
                <MenuItem value="7d">7 Days</MenuItem>
                <MenuItem value="30d">30 Days</MenuItem>
                <MenuItem value="90d">90 Days</MenuItem>
                <MenuItem value="1y">1 Year</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 100 }}>
              <InputLabel>Chart</InputLabel>
              <Select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as 'line' | 'bar' | 'pie')}
                label="Chart"
              >
                <MenuItem value="line">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <ShowChartIcon fontSize="small" />
                    Line
                  </Box>
                </MenuItem>
                <MenuItem value="bar">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BarChartIcon fontSize="small" />
                    Bar
                  </Box>
                </MenuItem>
                <MenuItem value="pie">
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TrendingDownIcon fontSize="small" />
                    Pie
                  </Box>
                </MenuItem>
              </Select>
            </FormControl>

            <Tooltip title="Refresh Data">
              <IconButton onClick={fetchDecayHistory} size="small" disabled={loading}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      <CardContent>
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Summary Stats */}
        <Box sx={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
          gap: 2, 
          mb: 3 
        }}>
          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5" color="warning.main" fontWeight="bold">
              {totalStats.events}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Total Events
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {totalStats.avgPerDay.toFixed(1)}/day avg
            </Typography>
          </Paper>

          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5" color="error.main" fontWeight="bold">
              {totalStats.points}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Points Decayed
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {totalStats.avgPointsPerDay.toFixed(1)}/day avg
            </Typography>
          </Paper>

          <Paper sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="h5" color="info.main" fontWeight="bold">
              {userBreakdown.length}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Users Affected
            </Typography>
            <Typography variant="caption" color="text.secondary">
              In time range
            </Typography>
          </Paper>
        </Box>

        {/* Chart */}
        <Box sx={{ mb: 3 }}>
          {renderChart()}
        </Box>

        {/* Top Users by Decay */}
        {userBreakdown.length > 0 && (
          <>
            <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TrendingDownIcon />
              Most Affected Users
            </Typography>
            
            <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
              <List dense>
                {userBreakdown.map((user, index) => (
                  <ListItem key={user.userId} divider={index < userBreakdown.length - 1}>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="body2" sx={{ fontFamily: 'monospace', minWidth: '120px' }}>
                            {formatPrincipal(user.userId)}
                          </Typography>
                          <Chip
                            label={`${user.totalDecayed} points`}
                            size="small"
                            color="error"
                            variant="outlined"
                          />
                          <Chip
                            label={`${user.eventCount} events`}
                            size="small"
                            color="warning"
                            variant="outlined"
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="caption" color="text.secondary">
                          Last decay: {formatDate(user.lastDecay * 1000)}
                        </Typography>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </>
        )}

        {transactions.length === 0 && !loading && (
          <Alert severity="info">
            No decay transactions found. The decay system may not have run yet, or no users have experienced decay.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default DecayHistoryChart;
