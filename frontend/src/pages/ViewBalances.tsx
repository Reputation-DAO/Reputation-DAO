// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProtectedPage from '../components/layout/ProtectedPage';
import { Principal } from '@dfinity/principal';
import {
  Box,
  Typography,
  Alert,
  Snackbar,
  Chip,
} from '@mui/material';
import { AccountBalanceWallet } from '@mui/icons-material';

import { makeChildWithPlug } from '../components/canister/child';

import UserBalanceSearchCard from '../components/Dashboard/ViewBalances/BalanceCard';
import OverviewCard from '../components/Dashboard/ViewBalances/statscard';
import TopUsersCard from '../components/Dashboard/ViewBalances/TopUser';

interface UserBalance {
  id: string;
  address: string;
  name: string;
  reputation: number;
  rank: number;
  change: string;
  lastActivity: string;
  status: 'active' | 'inactive';
}

interface BackendTransaction {
  id: bigint;
  transactionType: { Award: null } | { Revoke: null } | { Decay: null };
  from: Principal;
  to: Principal;
  amount: bigint;
  timestamp: bigint; // seconds
  reason: [] | [string];
}

const ViewBalances: React.FC = () => {
  const { cid } = useParams<{ cid: string }>();

  const searchTerm = '';
  const [child, setChild] = useState<any>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [userBalances, setUserBalances] = useState<UserBalance[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  // build child actor from :cid
  useEffect(() => {
    (async () => {
      try {
        if (!cid) throw new Error('Missing :cid in route');
        const actor = await makeChildWithPlug({ canisterId: cid, host: 'https://icp-api.io' });
        setChild(actor);
      } catch (e: any) {
        setSnackbar({
          open: true,
          message: e?.message || 'Failed to connect to org canister',
          severity: 'error',
        });
      }
    })();
  }, [cid]);

  // Load all balances from transaction history
  const loadAllBalances = async () => {
    if (!child) return;

    try {
      setRefreshing(true);

      const transactions: BackendTransaction[] = await child.getTransactionHistory();
      const txs = Array.isArray(transactions) ? transactions : [];

      // Compute balances + last activity
      const balanceMap = new Map<string, number>();
      const activityMap = new Map<string, number>(); // ms

      txs.forEach((tx) => {
        const fromStr = tx.from?.toString?.() || '';
        const toStr = tx.to?.toString?.() || '';
        const amount = Number(tx.amount || 0);
        const tsMs = Number(tx.timestamp || 0) * 1000; // seconds -> ms

        if (fromStr) {
          const prev = activityMap.get(fromStr) ?? 0;
          if (tsMs > prev) activityMap.set(fromStr, tsMs);
        }
        if (toStr) {
          const prev = activityMap.get(toStr) ?? 0;
          if (tsMs > prev) activityMap.set(toStr, tsMs);
        }

        if (!toStr) return;

        if ('Award' in tx.transactionType) {
          balanceMap.set(toStr, (balanceMap.get(toStr) || 0) + amount);
        } else if ('Revoke' in tx.transactionType) {
          balanceMap.set(toStr, Math.max(0, (balanceMap.get(toStr) || 0) - amount));
        } else if ('Decay' in tx.transactionType) {
          // decay tx have from == to; subtract from the user
          balanceMap.set(toStr, Math.max(0, (balanceMap.get(toStr) || 0) - amount));
        }
      });

      const list: UserBalance[] = Array.from(balanceMap.entries())
        .map(([address, reputation], idx) => {
          const last = activityMap.get(address);
          const lastActivity = last ? new Date(last).toLocaleDateString() : 'Never';
          const active = last ? (Date.now() - last) < 7 * 24 * 60 * 60 * 1000 : false;

          return {
            id: String(idx + 1),
            address,
            name: `User ${address.slice(0, 8)}`,
            reputation,
            rank: 0, // assigned after sort
            change: '+0', // placeholder (compute deltas if needed)
            lastActivity,
            status: active ? 'active' : 'inactive',
          };
        })
        .sort((a, b) => b.reputation - a.reputation)
        .map((u, i) => ({ ...u, rank: i + 1 }));

      setUserBalances(list);
    } catch (error: any) {
      console.error('Error loading balances:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load balances: ' + (error?.message || 'unknown error'),
        severity: 'error',
      });
    } finally {
      setRefreshing(false);
    }
  };

  // load whenever the child actor is ready
  useEffect(() => {
    if (child) loadAllBalances();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child]);

  const handleRefresh = () => loadAllBalances();
  const handleCloseSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  const getStatusColor = (status: string) => (status === 'active' ? 'success' : 'default');
  const getChangeColor = (change: string | number) => {
    const s = typeof change === 'number' ? `${change}` : change;
    if (s.startsWith('+')) return 'hsl(var(--primary))';
    if (s.startsWith('-')) return 'hsl(var(--destructive))';
    return 'hsl(var(--muted-foreground))';
  };

  const filteredBalances = userBalances.filter(
    (u) =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalReputation = userBalances.reduce((sum, u) => sum + u.reputation, 0);
  const activeUsers = userBalances.filter((u) => u.status === 'active').length;

  return (
    <Box
      sx={{
        p: 3,
        backgroundColor: 'hsl(var(--background))',
        minHeight: '100vh',
      }}
    >
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          color: 'hsl(var(--foreground))',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <AccountBalanceWallet sx={{ color: 'hsl(var(--primary))' }} />
        View Balances
        {cid && (
          <Chip
            label={`Org: ${cid}`}
            size="small"
            sx={{ ml: 2, bgcolor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
          />
        )}
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Search Section */}
        <Box sx={{ flex: 1 }}>
          <UserBalanceSearchCard
            fetchBalance={async (principalString: string) => {
              if (!child) throw new Error('Not connected to canister');
              const principal = Principal.fromText(principalString.trim());
              const bal = await child.getBalance(principal);
              return Number(bal);
            }}
          />
        </Box>

        {/* Statistics */}
        <OverviewCard
          totalUsers={userBalances.length}
          activeUsers={activeUsers}
          totalReputation={totalReputation}
          refreshing={refreshing}
          onRefresh={handleRefresh}
        />
      </Box>

      {/* User Balances Table */}
      <TopUsersCard
        filteredBalances={filteredBalances}
        getChangeColor={getChangeColor}
        getStatusColor={getStatusColor}
      />

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const ViewBalancesWithProtection: React.FC = () => (
  <ProtectedPage>
    <ViewBalances />
  </ProtectedPage>
);

export default ViewBalancesWithProtection;
