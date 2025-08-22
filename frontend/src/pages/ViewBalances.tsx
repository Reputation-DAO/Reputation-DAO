import React, { useState, useEffect} from 'react';
import ProtectedPage from '../components/layout/ProtectedPage';
import { Principal } from '@dfinity/principal';
import {
  Box,
  Typography,
  Alert,
  Snackbar,
  Chip,
} from '@mui/material';
import {
  AccountBalanceWallet,
} from '@mui/icons-material';
import { getPlugActor } from '../components/canister/reputationDao';
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
  timestamp: bigint;
  reason: [] | [string];
}

const ViewBalances: React.FC = () => {
  const searchTerm = '';
  const [refreshing, setRefreshing] = useState(false);
  const [userBalances, setUserBalances] = useState<UserBalance[]>([]);
  const [orgId, setOrgId] = useState<string | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  // Get orgId from localStorage
  useEffect(() => {
    const storedOrgId = localStorage.getItem('selectedOrgId');
    if (storedOrgId) {
      setOrgId(storedOrgId);
    }
  }, []);

  // Load balances when orgId is available
  useEffect(() => {
    console.log('ViewBalances useEffect triggered with orgId:', orgId);
    if (orgId) {
      console.log('Loading balances for orgId:', orgId);
      loadAllBalances();
    }
  }, [orgId]);

  // Real function to fetch balance from blockchain
  

  // Load all balances from transaction history
  const loadAllBalances = async () => {
    if (!orgId) return;
    
    try {
      setRefreshing(true);

      const plugActor = await getPlugActor();
      if (!plugActor) {
        console.log('No actor available');
        return;
      }

      console.log('Loading transaction history to calculate balances for orgId:', orgId);
      const transactions = await plugActor.getTransactionHistory(orgId) as BackendTransaction[];
      console.log('Raw transactions for balance calculation:', transactions);

      // Check if transactions is valid
      if (!transactions || !Array.isArray(transactions)) {
        console.log('No valid transactions array received');
        setUserBalances([]);
        return;
      }

      // Calculate balances from transaction history
      const balanceMap = new Map<string, number>();
      const activityMap = new Map<string, number>();

      transactions.forEach(tx => {
        const fromStr = tx.from?.toString() || '';
        const toStr = tx.to?.toString() || '';
        const amount = Number(tx.amount || 0);
        const timestamp = Number(tx.timestamp || 0) / 1000000; // Convert to milliseconds

        // Skip if principals are invalid
        if (!fromStr || !toStr) {
          console.warn('Skipping transaction with invalid principals:', tx);
          return;
        }

        // Track latest activity
        if (!activityMap.has(fromStr) || activityMap.get(fromStr)! < timestamp) {
          activityMap.set(fromStr, timestamp);
        }
        if (!activityMap.has(toStr) || activityMap.get(toStr)! < timestamp) {
          activityMap.set(toStr, timestamp);
        }

        // Calculate balances
        if ('Award' in tx.transactionType) {
          // Award: to user gets reputation
          const currentBalance = balanceMap.get(toStr) || 0;
          balanceMap.set(toStr, currentBalance + amount);
        } else {
          // Revoke: to user loses reputation (from is the admin/awarder doing the revoke)
          const currentBalance = balanceMap.get(toStr) || 0;
          balanceMap.set(toStr, Math.max(0, currentBalance - amount));
        }
      });

      // Convert to UserBalance array
      const userBalancesList: UserBalance[] = Array.from(balanceMap.entries())
        .map(([address, reputation], index) => ({
          id: (index + 1).toString(),
          address,
          name: `User ${address.slice(0, 8)}`,
          reputation,
          rank: 0, // Will be set after sorting
          change: '+0', // Could calculate from recent transactions
          lastActivity: activityMap.has(address) 
            ? new Date(activityMap.get(address)!).toLocaleDateString()
            : 'Never',
          status: (activityMap.has(address) && 
                   Date.now() - activityMap.get(address)! < 7 * 24 * 60 * 60 * 1000) 
                   ? 'active' as const 
                   : 'inactive' as const
        }))
        .sort((a, b) => b.reputation - a.reputation) // Sort by reputation descending
        .map((user, index) => ({ ...user, rank: index + 1 })); // Set ranks

      console.log('Processed user balances:', userBalancesList);
      setUserBalances(userBalancesList);

    } catch (error) {
      console.error('Error loading balances:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load balances: ' + (error as Error).message,
        severity: 'error'
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Load balances on component mount
  useEffect(() => {
    loadAllBalances();
  }, []);

 

  const handleRefresh = () => {
    loadAllBalances();
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'default';
  };

 const getChangeColor = (change: string | number) => {
    const strChange = typeof change === 'number' ? change.toString() : change;
    if (strChange.startsWith('+')) return 'hsl(var(--primary))';
    if (strChange.startsWith('-')) return 'hsl(var(--destructive))';
    return 'hsl(var(--muted-foreground))';
  };


  const filteredBalances = userBalances.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalReputation = userBalances.reduce((sum, user) => sum + user.reputation, 0);
  const activeUsers = userBalances.filter(user => user.status === 'active').length;

  return (
    <Box sx={{ 
      p: 3, 
      backgroundColor: 'hsl(var(--background))',
      minHeight: '100vh'
    }}>
      <Typography 
        variant="h4" 
        sx={{ 
          mb: 3, 
          color: 'hsl(var(--foreground))',
          fontWeight: 600,
          display: 'flex',
          alignItems: 'center',
          gap: 2
        }}
      >
        <AccountBalanceWallet sx={{ color: 'hsl(var(--primary))' }} />
        View Balances
        {orgId && (
          <Chip 
            label={`Org: ${orgId}`} 
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
            if (!orgId) throw new Error('Org ID missing');
            const principal = Principal.fromText(principalString);
            const plugActor = await getPlugActor();
            if (!plugActor) throw new Error('Actor not connected');
            const balance = await plugActor.getBalance(orgId, principal);
            return Number(balance);
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

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const ViewBalancesWithProtection: React.FC = () => {
  return (
    <ProtectedPage>
      <ViewBalances />
    </ProtectedPage>
  );
};

export default ViewBalancesWithProtection;
