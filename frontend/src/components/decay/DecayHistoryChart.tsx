// src/components/decay/DecayHistoryChart.tsx
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
  Paper,
  List,
  ListItem,
  ListItemText,
  Divider,
} from '@mui/material';
import {
  Timeline as TimelineIcon,
  TrendingDown as TrendingDownIcon,
  Refresh as RefreshIcon,
  BarChart as BarChartIcon,
  ShowChart as ShowChartIcon,
} from '@mui/icons-material';
import { useParams } from 'react-router-dom';
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
import { makeChildWithPlug, type ChildActor } from '../canister/child';

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
  lastDecay: number; // seconds since epoch
}

type TxUI = {
  id: string;
  from: string;
  to: string;
  amount: number;
  timestamp: number; // seconds
  type: 'Award' | 'Revoke' | 'Decay';
  reason: string | null;
};

const DecayHistoryChart: React.FC<DecayHistoryChartProps> = ({ className }) => {
  const { cid } = useParams<{ cid: string }>();

  const [transactions, setTransactions] = useState<TxUI[]>([]);
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [userBreakdown, setUserBreakdown] = useState<UserDecayBreakdown[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState<string>('30d');
  const [chartType, setChartType] = useState<'line' | 'bar' | 'pie'>('line');
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [orgId, setOrgId] = useState<string | null>(null);

  useEffect(() => {
    const storedOrgId = localStorage.getItem('selectedOrgId');
    setOrgId(cid ?? storedOrgId ?? null);
  }, [cid]);

  useEffect(() => {
    if (orgId) fetchDecayHistory();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeRange, orgId]);

  const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#8dd1e1'];

  const normalizeTx = (tx: any): TxUI => {
    const type: TxUI['type'] =
      tx?.transactionType && 'Decay' in tx.transactionType
        ? 'Decay'
        : tx?.transactionType && 'Award' in tx.transactionType
        ? 'Award'
        : 'Revoke';

    return {
      id: String(tx.id),
      from: tx.from?.toString?.() ?? String(tx.from),
      to: tx.to?.toString?.() ?? String(tx.to),
      amount: Number(tx.amount ?? 0),
      timestamp: Number(tx.timestamp ?? 0), // child returns seconds
      type,
      reason: tx?.reason?.[0] ?? null,
    };
  };

  const fetchDecayHistory = async () => {
    if (!orgId) return;
    setLoading(true);
    setError(null);
    try {
      const actor: ChildActor = await makeChildWithPlug({ canisterId: orgId });
      const raw = await actor.getTransactionHistory();
      const allTx: TxUI[] = (raw as any[]).map(normalizeTx);
      const decayTx = allTx.filter((tx) => tx.type === 'Decay');

      setTransactions(decayTx);
      processChartData(decayTx);
      processUserBreakdown(decayTx);
      setLastUpdated(new Date());
    } catch (err) {
      console.error(err);
      setError('Failed to fetch decay history');
    } finally {
      setLoading(false);
    }
  };

  const processChartData = (decayTx: TxUI[]) => {
    const nowSec = Math.floor(Date.now() / 1000);
    const ranges = { '7d': 7 * 86400, '30d': 30 * 86400, '90d': 90 * 86400, '1y': 365 * 86400 };
    const cutoff = nowSec - (ranges[timeRange as keyof typeof ranges] || ranges['30d']);
    const relevant = decayTx.filter((tx) => tx.timestamp >= cutoff);

    const dailyMap = new Map<
      string,
      { decayEvents: number; totalDecayed: number; usersAffected: Set<string> }
    >();

    relevant.forEach((tx) => {
      const date = new Date(tx.timestamp * 1000).toISOString().split('T')[0];
      if (!dailyMap.has(date)) {
        dailyMap.set(date, { decayEvents: 0, totalDecayed: 0, usersAffected: new Set() });
      }
      const d = dailyMap.get(date)!;
      d.decayEvents += 1;
      d.totalDecayed += tx.amount;
      d.usersAffected.add(tx.to);
    });

    const chartPoints: ChartDataPoint[] = Array.from(dailyMap.entries()).map(([date, d]) => ({
      date,
      timestamp: new Date(date).getTime(),
      decayEvents: d.decayEvents,
      totalDecayed: d.totalDecayed,
      usersAffected: d.usersAffected.size,
      averageDecay: d.usersAffected.size > 0 ? d.totalDecayed / d.usersAffected.size : 0,
    }));

    // Fill missing days
    const startDate = new Date(cutoff * 1000);
    const endDate = new Date();
    const filledData: ChartDataPoint[] = [];
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const existing = chartPoints.find((p) => p.date === dateStr);
      filledData.push(
        existing || {
          date: dateStr,
          timestamp: d.getTime(),
          decayEvents: 0,
          totalDecayed: 0,
          usersAffected: 0,
          averageDecay: 0,
        }
      );
    }
    setChartData(filledData.sort((a, b) => a.timestamp - b.timestamp));
  };

  const processUserBreakdown = (decayTx: TxUI[]) => {
    const map = new Map<string, { totalDecayed: number; eventCount: number; lastDecay: number }>();
    decayTx.forEach((tx) => {
      const uid = tx.to;
      if (!map.has(uid)) map.set(uid, { totalDecayed: 0, eventCount: 0, lastDecay: 0 });
      const d = map.get(uid)!;
      d.totalDecayed += tx.amount;
      d.eventCount += 1;
      d.lastDecay = Math.max(d.lastDecay, tx.timestamp);
    });

    const topUsers = Array.from(map.entries())
      .map(([userId, d]) => ({ userId, ...d }))
      .sort((a, b) => b.totalDecayed - a.totalDecayed)
      .slice(0, 10);

    setUserBreakdown(topUsers);
  };

  const formatPrincipal = (p: string) => `${p.slice(0, 8)}...${p.slice(-4)}`;
  const formatDate = (tsMs: number) => new Date(tsMs).toLocaleDateString();

  const totalStats = useMemo(() => {
    const total = chartData.reduce(
      (acc, day) => ({
        events: acc.events + day.decayEvents,
        points: acc.points + day.totalDecayed,
        users: acc.users + day.usersAffected,
      }),
      { events: 0, points: 0, users: 0 }
    );
    return {
      ...total,
      avgPerDay: chartData.length ? total.events / chartData.length : 0,
      avgPointsPerDay: chartData.length ? total.points / chartData.length : 0,
    };
  }, [chartData]);

  const pieChartData = useMemo(
    () =>
      userBreakdown.slice(0, 5).map((u, i) => ({
        name: formatPrincipal(u.userId),
        value: u.totalDecayed,
        color: colors[i % colors.length],
      })),
    [userBreakdown]
  );

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <Paper sx={{ p: 2, border: '1px solid #ccc' }}>
          <Typography variant="body2" fontWeight="bold">
            {new Date(label).toLocaleDateString()}
          </Typography>
          {payload.map((entry: any, i: number) => (
            <Typography key={i} variant="body2" sx={{ color: entry.color }}>
              {`${entry.dataKey}: ${entry.value}`}
            </Typography>
          ))}
        </Paper>
      );
    }
    return null;
  };

  const renderChart = () => {
    if (!chartData.length)
      return (
        <Typography textAlign="center" color="text.secondary" py={4}>
          No decay data available
        </Typography>
      );

    const commonProps = { width: '100%', height: 400, data: chartData };
    switch (chartType) {
      case 'line':
        return (
          <ResponsiveContainer {...commonProps}>
            <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString()} />
              <YAxis />
              <ChartTooltip content={<CustomTooltip />} />
              <Legend />
              <Line type="monotone" dataKey="decayEvents" stroke="#8884d8" strokeWidth={2} />
              <Line type="monotone" dataKey="totalDecayed" stroke="#82ca9d" strokeWidth={2} />
              <Line type="monotone" dataKey="usersAffected" stroke="#ffc658" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        );
      case 'bar':
        return (
          <ResponsiveContainer {...commonProps}>
            <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tickFormatter={(v) => new Date(v).toLocaleDateString()} />
              <YAxis />
              <ChartTooltip content={<CustomTooltip />} />
              <Legend />
              <Bar dataKey="decayEvents" fill="#8884d8" />
              <Bar dataKey="totalDecayed" fill="#82ca9d" />
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
                  outerRadius={80}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent ?? 0 * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((entry, i) => (
                    <Cell key={i} fill={entry.color} />
                  ))}
                </Pie>
                <ChartTooltip />
              </PieChart>
            </ResponsiveContainer>
            <Typography variant="caption" color="text.secondary" mt={1}>
              Top 5 Users by Total Points Decayed
            </Typography>
          </Box>
        );
      default:
        return null;
    }
  };

  if (!orgId)
    return (
      <Card
        className={className}
        sx={{
          background: 'hsl(var(--background))',
          border: `1px solid hsl(var(--border))`,
          borderRadius: 'var(--radius)',
          boxShadow: '4px 4px 10px hsl(var(--muted)/0.4), -4px -4px 10px hsl(var(--muted)/0.1)',
        }}
      >
        <CardContent>
          <Alert severity="info">Please select an organization to view decay history and trends.</Alert>
        </CardContent>
      </Card>
    );

  return (
    <Card
      className={className}
      sx={{
        background: 'hsl(var(--background))',
        border: `1px solid hsl(var(--border))`,
        borderRadius: 'var(--radius)',
        boxShadow: '4px 4px 10px hsl(var(--muted)/0.4), -4px -4px 10px hsl(var(--muted)/0.1)',
        mb: 4,
        color: 'hsl(var(--foreground))',
      }}
    >
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TimelineIcon /> <Typography variant="h6">Decay History & Trends</Typography>
          </Box>
        }
        subheader={`Last updated: ${lastUpdated.toLocaleString()}`}
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <FormControl
              size="small"
              sx={{
                minWidth: 100,
                color: 'hsl(var(--foreground))',
                '& .MuiInputLabel-root': { color: 'hsl(var(--foreground))' },
                '& .MuiSelect-select': { color: 'hsl(var(--foreground))' },
                '& .MuiSvgIcon-root': { color: 'hsl(var(--foreground))' },
                '& .MuiMenuItem-root': { color: 'hsl(var(--foreground))' },
              }}
            >
              <InputLabel>Range</InputLabel>
              <Select value={timeRange} onChange={(e) => setTimeRange(e.target.value)} label="Range">
                <MenuItem value="7d">7 Days</MenuItem>
                <MenuItem value="30d">30 Days</MenuItem>
                <MenuItem value="90d">90 Days</MenuItem>
                <MenuItem value="1y">1 Year</MenuItem>
              </Select>
            </FormControl>

            <FormControl
              size="small"
              sx={{
                minWidth: 100,
                color: 'hsl(var(--foreground))',
                '& .MuiInputLabel-root': { color: 'hsl(var(--foreground))' },
                '& .MuiSelect-select': { color: 'hsl(var(--foreground))' },
                '& .MuiSvgIcon-root': { color: 'hsl(var(--foreground))' },
                '& .MuiMenuItem-root': { color: 'hsl(var(--foreground))' },
              }}
            >
              <InputLabel>Chart</InputLabel>
              <Select
                value={chartType}
                onChange={(e) => setChartType(e.target.value as any)}
                label="Chart"
              >
                <MenuItem value="line">
                  <ShowChartIcon fontSize="small" /> Line
                </MenuItem>
                <MenuItem value="bar">
                  <BarChartIcon fontSize="small" /> Bar
                </MenuItem>
                <MenuItem value="pie">
                  <TrendingDownIcon fontSize="small" /> Pie
                </MenuItem>
              </Select>
            </FormControl>

            <IconButton onClick={fetchDecayHistory} size="small" disabled={loading}>
              <RefreshIcon sx={{ color: 'hsl(var(--foreground))' }} />
            </IconButton>
          </Box>
        }
      />
      <CardContent sx={{ p: 3 }}>
        {loading && <LinearProgress sx={{ mb: 2 }} />}
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

        {/* Stats Grid */}
        <Box
          sx={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))',
            gap: 2,
            mb: 3,
          }}
        >
          <Paper sx={{ p: 2, textAlign: 'center', background: 'hsl(var(--background))' }}>
            <Typography variant="h5" color="warning.main" fontWeight="bold">
              {totalStats.events}
            </Typography>
            <Typography variant="body2" sx={{ color: 'hsl(var(--foreground))' }}>
              Total Events
            </Typography>
            <Typography variant="caption" sx={{ color: 'hsl(var(--foreground))' }}>
              {totalStats.avgPerDay.toFixed(1)}/day avg
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center', background: 'hsl(var(--background))' }}>
            <Typography variant="h5" color="error.main" fontWeight="bold">
              {totalStats.points}
            </Typography>
            <Typography variant="body2" sx={{ color: 'hsl(var(--foreground))' }}>
              Points Decayed
            </Typography>
            <Typography variant="caption" sx={{ color: 'hsl(var(--foreground))' }}>
              {totalStats.avgPointsPerDay.toFixed(1)}/day avg
            </Typography>
          </Paper>
          <Paper sx={{ p: 2, textAlign: 'center', background: 'hsl(var(--background))' }}>
            <Typography variant="h5" color="info.main" fontWeight="bold">
              {userBreakdown.length}
            </Typography>
            <Typography variant="body2" sx={{ color: 'hsl(var(--foreground))' }}>
              Users Affected
            </Typography>
            <Typography variant="caption" sx={{ color: 'hsl(var(--foreground))' }}>
              In time range
            </Typography>
          </Paper>
        </Box>

        {/* Chart */}
        <Box sx={{ mb: 3 }}>{renderChart()}</Box>

        {/* Top Users */}
        {userBreakdown.length > 0 && (
          <>
            <Typography
              variant="h6"
              gutterBottom
              sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
            >
              <TrendingDownIcon /> Most Affected Users
            </Typography>
            <Paper variant="outlined" sx={{ maxHeight: 300, overflow: 'auto' }}>
              <List dense>
                {userBreakdown.map((u, i) => (
                  <React.Fragment key={u.userId}>
                    <ListItem divider={i < userBreakdown.length - 1}>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography
                              variant="body2"
                              sx={{ fontFamily: 'monospace', minWidth: 120 }}
                            >
                              {formatPrincipal(u.userId)}
                            </Typography>
                            <Chip
                              label={`${u.totalDecayed} pts`}
                              size="small"
                              color="error"
                              variant="outlined"
                            />
                            <Chip
                              label={`${u.eventCount} events`}
                              size="small"
                              color="warning"
                              variant="outlined"
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="caption" color="text.secondary">
                            Last decay: {formatDate(u.lastDecay * 1000)}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {i < userBreakdown.length - 1 && (
                      <Divider sx={{ borderColor: 'hsl(var(--border))' }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </Paper>
          </>
        )}

        {transactions.length === 0 && !loading && (
          <Alert severity="info">
            No decay transactions found. The decay system may not have run yet, or no users have
            experienced decay.
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default DecayHistoryChart;
