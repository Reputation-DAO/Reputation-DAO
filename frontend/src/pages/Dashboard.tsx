// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Principal } from '@dfinity/principal';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Alert,
  IconButton,
} from '@mui/material';
import {
  People as Users,
  NorthEast as ArrowUpRight,
  Refresh,
  History,
  TrendingUp,
} from '@mui/icons-material';
import { makeChildWithPlug } from '../components/canister/child';
import { useRole } from '../contexts/RoleContext';

import StatCard from '../components/Dashboard/statscard';
import ActivityCard from '../components/Dashboard/cards/ActivityCard';
import ActivityChartCard from '../components/Dashboard/cards/ActivityChartCard';
import SystemFeaturesCard from '../components/Dashboard/cards/SystemFeaturesCard';
import TopMembersCard from '../components/Dashboard/cards/TopMemberCard';
import TrustedAwardersCard from '../components/Dashboard/cards/TrustedAwarderCard';

import ProtectedPage from '../components/layout/ProtectedPage';

/* -----------------------------------------
   Local types (match your did)
----------------------------------------- */
interface Transaction {
  id: number | bigint;
  transactionType: { Award: null } | { Revoke: null } | { Decay: null };
  from: Principal;
  to: Principal;
  amount: number | bigint;
  timestamp: number | bigint; // seconds
  reason?: [] | [string];
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
  userReputation: number;
  userTransactions: Transaction[];
}

interface ChartData {
  date: string;
  awards: number;
  revokes: number;
  net: number;
}

const Dashboard: React.FC = React.memo(() => {
  const { cid } = useParams<{ cid: string }>();
  const { userRole, userName, currentPrincipal } = useRole();

  const [child, setChild] = useState<any>(null);
  const [data, setData] = useState<DashboardData>({
    transactions: [],
    balances: [],
    awarders: [],
    transactionCount: 0,
    userReputation: 0,
    userTransactions: [],
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);

  /* -----------------------------------------
     Helpers
  ----------------------------------------- */
  const toNum = (v: number | bigint) => (typeof v === 'bigint' ? Number(v) : v);

  const formatTime = (timestamp: number | bigint): string => {
    const now = Date.now() / 1000;
    const ts = toNum(timestamp);
    const diff = now - ts;
    if (diff < 60) return 'just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  };

  const getUserDisplayName = (principal: Principal): string => {
    const pText = principal.toString();
    const awarder = data.awarders.find(a => a.id.toString() === pText);
    if (awarder) return awarder.name;
    if (pText === '3d34m-ksxgd-46a66-2ibf7-kutsn-jg3vv-2yfjf-anbwh-u4lpl-tqu7d-yae') return 'Admin';
    return `${pText.slice(0, 5)}...${pText.slice(-3)}`;
  };

  const processChartData = (transactions: Transaction[]): ChartData[] => {
    const last7ISO = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const daily = last7ISO.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      awards: 0,
      revokes: 0,
      net: 0,
    }));

    transactions.forEach(tx => {
      const txDate = new Date(toNum(tx.timestamp) * 1000).toISOString().split('T')[0];
      const idx = last7ISO.indexOf(txDate);
      if (idx !== -1) {
        const amt = toNum(tx.amount);
        if ('Award' in tx.transactionType) {
          daily[idx].awards += amt;
          daily[idx].net += amt;
        } else if ('Revoke' in tx.transactionType) {
          daily[idx].revokes += amt;
          daily[idx].net -= amt;
        } else if ('Decay' in tx.transactionType) {
          daily[idx].net -= amt;
        }
      }
    });

    return daily;
  };

  /* -----------------------------------------
     Build child actor on :cid
  ----------------------------------------- */
  useEffect(() => {
    (async () => {
      try {
        if (!cid) throw new Error('Missing :cid in route');
        setLoading(true);
        setError(null);
        const actor = await makeChildWithPlug({ canisterId: cid, host: 'https://icp-api.io' });
        setChild(actor);
      } catch (e: any) {
        setError(e?.message || 'Failed to connect to child canister');
      } finally {
        setLoading(false);
      }
    })();
  }, [cid]);

  /* -----------------------------------------
     Load dashboard data from child
  ----------------------------------------- */
  const loadDashboardData = async () => {
    if (isLoadingData || !child) return;
    try {
      setIsLoadingData(true);
      setError(null);

      // Parallel fetches from the child (no orgId param needed)
      const [transactionsResult, transactionCountResult, awardersResult] = await Promise.all([
        child.getTransactionHistory(),
        child.getTransactionCount(),
        child.getTrustedAwarders(),
      ]);

      const transactions: Transaction[] = transactionsResult ?? [];
      const transactionCount: number = Number(transactionCountResult ?? 0);
      const awarders: Awarder[] = awardersResult ?? [];

      // Balances from tx history
      const balanceMap = new Map<string, number>();
      for (const tx of transactions) {
        const toKey = tx.to.toString();
        const amt = toNum(tx.amount);
        if ('Award' in tx.transactionType) {
          balanceMap.set(toKey, (balanceMap.get(toKey) || 0) + amt);
        } else if ('Revoke' in tx.transactionType || 'Decay' in tx.transactionType) {
          balanceMap.set(toKey, (balanceMap.get(toKey) || 0) - amt);
        }
      }

      const balances = Array.from(balanceMap.entries())
        .map(([p, bal]) => ({ principal: Principal.fromText(p), balance: bal }))
        .filter(b => b.balance > 0)
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 10);

      const me = currentPrincipal?.toString();
      const userReputation = me ? balanceMap.get(me) || 0 : 0;
      const userTransactions = me
        ? transactions.filter(tx => tx.to.toString() === me || tx.from.toString() === me)
        : [];

      setData({
        transactions: transactions.slice(0, 10),
        balances,
        awarders,
        transactionCount,
        userReputation,
        userTransactions: userTransactions.slice(0, 10),
      });

      const chartTx = userRole === 'User' ? userTransactions : transactions;
      setChartData(processChartData(chartTx));
    } catch (e: any) {
      console.error(e);
      setError(e?.message || 'Failed to load dashboard data');
    } finally {
      setIsLoadingData(false);
      setRefreshing(false);
    }
  };

  // Initial + on-actor ready
  useEffect(() => {
    if (child) loadDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child]);

  const handleRefresh = () => {
    if (isLoadingData) return;
    setRefreshing(true);
    loadDashboardData();
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: 'hsl(var(--primary))' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
        bgcolor: 'hsl(var(--background))',
      }}
    >
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Main */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Stats + Welcome */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: userRole === 'User' ? '1fr 1fr 1fr' : '1fr 1fr',
              },
              gap: 2.5,
            }}
          >
            {/* Welcome */}
            <Box sx={{ gridColumn: '1 / -1', mb: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, fontSize: { xs: '1.5rem', md: '2rem' } }}
                >
                  Welcome, {userName || 'User'}
                </Typography>
                <IconButton onClick={handleRefresh} disabled={refreshing} sx={{ color: 'hsl(var(--primary))' }}>
                  {refreshing ? <CircularProgress size={20} /> : <Refresh />}
                </IconButton>
              </Box>
              <Typography sx={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
                Track your community&apos;s reputation and activity
              </Typography>
            </Box>

            {/* Stat Cards */}
            {userRole === 'User' && (
              <StatCard title="My Reputation" value={data.userReputation} statusLabel="Current Score" />
            )}
            <StatCard
              title="Total Transactions"
              value={data.transactionCount}
              statusLabel="All time activity"
              titleIcon={<History sx={{ color: 'hsl(var(--primary))', fontSize: 20 }} />}
              statusIcon={<TrendingUp sx={{ color: 'hsl(var(--success))', fontSize: 16 }} />}
            />
            <StatCard
              title="Active Members"
              value={data.balances.length}
              statusLabel="With reputation"
              titleIcon={<Users sx={{ color: 'hsl(var(--primary))', fontSize: 20 }} />}
              statusIcon={<ArrowUpRight sx={{ color: 'hsl(var(--success))', fontSize: 16 }} />}
            />
          </Box>

          {/* CTA */}
          <SystemFeaturesCard />

          {/* Activity + Chart */}
          <ActivityCard
            userRole={userRole}
            data={data}
            getUserDisplayName={getUserDisplayName}
            formatTime={formatTime}
          />
          <ActivityChartCard userRole={userRole} chartData={chartData} />
        </Box>

        {/* Sidebar */}
        <Box sx={{ width: { lg: 300 }, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 3 }}>
          <TopMembersCard balances={data.balances} getUserDisplayName={getUserDisplayName} />
          <TrustedAwardersCard awarders={data.awarders} />
        </Box>
      </Box>
    </Box>
  );
});

const DashboardWithProtection: React.FC = () => {
  return (
    <ProtectedPage>
      <Dashboard />
    </ProtectedPage>
  );
};

export default DashboardWithProtection;
