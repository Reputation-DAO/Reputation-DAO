// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { Principal } from '@dfinity/principal';
import { useNavigate } from 'react-router-dom';
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
import { getPlugActor } from '../components/canister/reputationDao';
import { useRole } from '../contexts/RoleContext';

import StatCard from '../components/Dashboard/statscard';
import ActivityCard from '../components/Dashboard/cards/ActivityCard';
import ActivityChartCard from '../components/Dashboard/cards/ActivityChartCard';
import SystemFeaturesCard from '../components/Dashboard/cards/SystemFeaturesCard';
import TopMembersCard from '../components/Dashboard/cards/TopMemberCard';
import TrustedAwardersCard from '../components/Dashboard/cards/TrustedAwarderCard';

import ProtectedPage from '../components/layout/ProtectedPage';


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
  const navigate = useNavigate();

  
  // Get role information from context
  const { userRole, userName, currentPrincipal } = useRole();
  
  // Get organization ID from localStorage
  const [orgId, setOrgId] = useState<string | null>(null);
  
  useEffect(() => {
    const storedOrgId = localStorage.getItem('selectedOrgId');
    if (storedOrgId) {
      setOrgId(storedOrgId);
      // Trigger role refresh when organization changes
      window.dispatchEvent(new CustomEvent('orgChanged'));
    } else {
      // Redirect to org selector if no org selected
      navigate('/org-selector');
    }
  }, [navigate]);
  

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

  const formatTime = (timestamp: number | bigint): string => {
    const now = Date.now() / 1000;
    const ts = typeof timestamp === 'bigint' ? Number(timestamp) : timestamp;
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
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return d.toISOString().split('T')[0];
    });

    const daily = last7.map(date => ({
      date: new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
      awards: 0,
      revokes: 0,
      net: 0,
    }));

    transactions.forEach(tx => {
      const txDate = new Date((typeof tx.timestamp === 'bigint' ? Number(tx.timestamp) : tx.timestamp) * 1000);
      const txDateStr = txDate.toISOString().split('T')[0];
      const idx = last7.indexOf(txDateStr);
      if (idx !== -1) {
        const amt = typeof tx.amount === 'bigint' ? Number(tx.amount) : tx.amount;
        if ('Award' in tx.transactionType) {
          daily[idx].awards += amt;
          daily[idx].net += amt;
        } else {
          daily[idx].revokes += amt;
          daily[idx].net -= amt;
        }
      }
    });

    return daily;
  };

  const loadDashboardData = async () => {

    if (isLoadingData || !orgId) return; // Prevent multiple simultaneous loads and ensure orgId exists
    

    try {
      setIsLoadingData(true);
      setError(null);
      const actor = await getPlugActor();
      if (!actor) throw new Error('Failed to connect to blockchain');


      // Simply verify the organization exists - don't restrict access
      // The role-based UI will handle what data to show based on user permissions
      try {
        const orgCheckResult = await actor.getTransactionCount(orgId);
        const orgExists = Array.isArray(orgCheckResult) ? orgCheckResult[0] !== null : orgCheckResult !== null;
        
        if (!orgExists) {
          throw new Error('Organization does not exist');
        }
      } catch (error) {
        console.warn('Organization verification failed:', error);
        throw new Error('Access denied: Organization does not exist or is not accessible');
      }

      // Fetch all data in parallel with orgId parameter
      const [
        transactionsResult,
        transactionCountResult,
        awardersResult,
      ] = await Promise.all([
        actor.getTransactionHistory(orgId),
        actor.getTransactionCount(orgId),
        actor.getTrustedAwarders(orgId),
      ]);

      // Handle optional array results from Motoko
      const transactions = Array.isArray(transactionsResult) ? transactionsResult[0] || [] : transactionsResult || [];
      const transactionCount = Array.isArray(transactionCountResult) ? transactionCountResult[0] || 0 : transactionCountResult || 0;
      const awarders = Array.isArray(awardersResult) ? awardersResult[0] || [] : awardersResult || [];

      // Get balances by fetching transaction history and calculating

      const balanceMap = new Map<string, number>();
      transactions.forEach((tx: any) => {
        const toKey = tx.to.toString();
        const amt = typeof tx.amount === 'bigint' ? Number(tx.amount) : Number(tx.amount);
        if ('Award' in tx.transactionType) {
          balanceMap.set(toKey, (balanceMap.get(toKey) || 0) + amt);
        } else {
          balanceMap.set(toKey, (balanceMap.get(toKey) || 0) - amt);
        }
      });

      const balances = Array.from(balanceMap.entries())
        .map(([p, bal]) => ({ principal: Principal.fromText(p), balance: bal }))
        .filter(b => b.balance > 0)
        .sort((a, b) => b.balance - a.balance)
        .slice(0, 10);

      const currentUser = currentPrincipal?.toString();
      let userReputation = 0;
      let userTransactions: Transaction[] = [];

      if (currentUser) {
        userReputation = balanceMap.get(currentUser) || 0;
        userTransactions = transactions.filter((tx: any) =>
          tx.to.toString() === currentUser || tx.from.toString() === currentUser
        );
      }

      setData({
        transactions: transactions.slice(0, 10),
        balances,
        awarders,
        transactionCount: Number(transactionCount),
        userReputation,
        userTransactions: userTransactions.slice(0, 10),
      });

      const chartTx = userRole === 'User' ? userTransactions : transactions;
      setChartData(processChartData(chartTx));
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setLoading(false);
      setRefreshing(false);
      setIsLoadingData(false);
    }
  };


  // Load data on component mount and when orgId changes
  useEffect(() => {
    if (orgId) {
      loadDashboardData();
    }
  }, [orgId]); // Run when orgId is set

  // Refresh data
  const handleRefresh = () => {
    if (isLoadingData) return; // Prevent refresh while loading
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
        {/* 👇 Full-width Welcome */}
        <Box sx={{ gridColumn: '1 / -1', mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography
              variant="h6"
              sx={{ fontWeight: 600, fontSize: { xs: '1.5rem', md: '2rem' } }}
            >
              Welcome, {userName || 'User'}
            </Typography>
            <IconButton onClick={loadDashboardData} disabled={refreshing} sx={{ color: 'hsl(var(--primary))' }}>
              {refreshing ? <CircularProgress size={20} /> : <Refresh />}
            </IconButton>
          </Box>
          <Typography sx={{ color: 'hsl(var(--muted-foreground))', fontSize: '0.875rem' }}>
            Track your community's reputation and activity
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