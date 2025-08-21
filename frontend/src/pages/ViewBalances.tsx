import React, { useState, useEffect, useCallback } from 'react';
import ProtectedPage from '../components/layout/ProtectedPage';
import { Principal } from '@dfinity/principal';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Snackbar,
  InputAdornment,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  AccountBalanceWallet,
  Search,
  Person,
  TrendingUp,
  History,
  Refresh,
  Download,
  FilterList
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
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBalance, setSelectedBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
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
  const fetchBalance = async (principalString: string): Promise<number> => {
    try {
      // Validate Principal format
      const principal = Principal.fromText(principalString);

      // Use getPlugActor to get actor instance
      const plugActor = await getPlugActor();
      if (!plugActor) {
        throw new Error('Failed to connect to blockchain');
      }

      if (!orgId) {
        throw new Error('Organization ID not found');
      }

      const balance = await plugActor.getBalance(orgId, principal);
      return Number(balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      if (error instanceof Error && error.message.includes('Invalid principal')) {
        throw new Error('Invalid Principal ID format');
      }
      throw new Error('Failed to fetch balance from blockchain');
    }
  };

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

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a Principal ID to search',
        severity: 'warning'
      });
      return;
    }

    setIsLoading(true);
    setSelectedBalance(null);

    try {
      const balance = await fetchBalance(searchTerm.trim());
      setSelectedBalance(balance);
      
      setSnackbar({
        open: true,
        message: balance > 0 
          ? `Found ${balance} reputation points`
          : 'No reputation found for this Principal ID',
        severity: balance > 0 ? 'success' : 'info'
      });
    } catch (error) {
      console.error('Search error:', error);
      setSnackbar({
        open: true,
        message: (error as Error).message,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAllBalances();
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'default';
  };

  const getChangeColor = (change: string) => {
    if (change.startsWith('+')) return 'hsl(var(--primary))';
    if (change.startsWith('-')) return 'hsl(var(--destructive))';
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
