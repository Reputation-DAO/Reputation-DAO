import React, { useState, useEffect } from 'react';
import ProtectedPage from '../components/layout/ProtectedPage';
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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  CircularProgress
} from '@mui/material';
import {
  EmojiEvents,
  Send,
  Person,
  Star,
  TrendingUp,
  History,
  Info
} from '@mui/icons-material';
import { Principal } from '@dfinity/principal';
import { getPlugActor } from '../components/canister/reputationDao';
import Awardform from '../components/Dashboard/awardrep/Awardform';
import AwardSummary from '../components/Dashboard/awardrep/AwardSummary';
import RecentAwardsTable from '../components/Dashboard/awardrep/RecentAward';

// Backend transaction interface
interface BackendTransaction {
  id: bigint;
  transactionType: { Award: null } | { Revoke: null };
  from: Principal;
  to: Principal;
  amount: bigint;
  timestamp: bigint;
  reason: [] | [string];
}

interface AwardTransaction {
  id: string;
  recipient: string;
  amount: number;
  reason: string;
  date: string;
  status: string;
}

const AwardRep: React.FC = () => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [totalAwards, setTotalAwards] = useState(0);
  const [totalRepAwarded , setTotalRepAwarded] = useState(0);
  const [recentAwards, setRecentAwards] = useState<AwardTransaction[]>([]);
  const [loadingAwards, setLoadingAwards] = useState(false);
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

  // Load recent transactions when orgId is available
  useEffect(() => {
    if (orgId) {
      loadRecentAwards();
    }
  }, [orgId]);

  const loadRecentAwards = async () => {
    if (!orgId) return;
    
    setLoadingAwards(true);
    try {
      console.log('🔄 Loading recent award transactions...');
      console.log('🔗 Getting Plug actor connection...');
      const actor = await getPlugActor();
      console.log('✅ Actor connected:', !!actor);
      
      console.log('📞 Calling getTransactionHistory() with orgId:', orgId);
      const transactionsResult = await actor.getTransactionHistory(orgId);
      
      // Handle optional array result from Motoko
      const transactions = Array.isArray(transactionsResult) ? transactionsResult[0] || [] : transactionsResult || [];
      console.log('📊 Raw transactions received:', transactions);
      console.log('📊 Total transactions count:', transactions.length);
      
      // Check if transactions is an array
      if (!Array.isArray(transactions)) {
        console.warn('⚠️ Transactions is not an array:', transactions);
        setRecentAwards([]);
        return;
      }

      // Calcuate total REP awarded
      const totalRepAwarded = transactions.reduce((sum, tx) => {
        if (tx.transactionType && 'Award' in tx.transactionType) {
          return sum + Number(tx.amount);
        }
        return sum;
      }, 0);

      setTotalRepAwarded(totalRepAwarded);

      // Calculate total awards
      const totalAwards = transactions.filter(tx =>{
        return tx.transactionType && 'Award' in tx.transactionType;
      }).length;

      setTotalAwards(totalAwards);

      // Filter for award transactions and convert to frontend format
      const awardTransactions = transactions
        .filter(tx => {
          console.log('🔍 Checking transaction:', tx);
          return tx.transactionType && 'Award' in tx.transactionType;
        })
        .slice(-5) // Get last 5 awards
        .map(tx => {
          const timestamp = Number(tx.timestamp);
          const date = timestamp > 0 
            ? new Date(timestamp * 1000).toISOString().split('T')[0] // Convert from seconds to milliseconds
            : new Date().toISOString().split('T')[0];
            
          return {
            id: tx.id.toString(),
            recipient: tx.to.toString(),
            amount: Number(tx.amount),
            reason: (tx.reason && tx.reason.length > 0) ? tx.reason[0]! : 'No reason provided',
            date,
            status: 'completed'
          };
        })
        .reverse(); // Show newest first
      
      console.log('🎯 Filtered award transactions:', awardTransactions);
      console.log('🎯 Award transactions count:', awardTransactions.length);
      setRecentAwards(awardTransactions);
      
    } catch (error) {
      console.error('❌ Failed to load recent awards:', error);
      console.error('❌ Error details:', error);
      
      // Set empty array on error to prevent infinite loading
      setRecentAwards([]);
      
      setSnackbar({
        open: true,
        message: 'Failed to load recent awards from blockchain. The canister may be empty or connection failed.',
        severity: 'warning'
      });
    } finally {
      setLoadingAwards(false);
      console.log('🏁 loadRecentAwards completed');
    }
  };

  const handleAwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipient || !amount || !reason) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'warning'
      });
      return;
    }

    // Validate principal format
    let recipientPrincipal: Principal;
    try {
      recipientPrincipal = Principal.fromText(recipient);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Invalid principal format. Please enter a valid ICP address.',
        severity: 'error'
      });
      return;
    }

    const amountBigInt = BigInt(amount);
    if (amountBigInt <= 0) {
      setSnackbar({
        open: true,
        message: 'Amount must be greater than 0',
        severity: 'error'
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('🎯 Starting award submission...');
      console.log('🎯 Award details:', {
        recipient: recipientPrincipal.toString(),
        amount: amountBigInt.toString(),
        reason
      });

      console.log('🔗 Getting Plug actor for award...');
      const actor = await getPlugActor();
      console.log('✅ Actor connected for award:', !!actor);
      
      // Get current user principal for logging
      const currentPrincipal = await window.ic.plug.agent.getPrincipal();
      console.log('� Current user principal:', currentPrincipal.toString());
      
      console.log('�📞 Calling autoAwardRep() - auto-injecting orgId...');





      const orgId = localStorage.getItem("selectedOrgId")?.trim();

      if (!orgId) {
        throw new Error("No orgId found in localStorage");
      }




      // PROBLEM IS HERE
      const result = await actor.awardRep(orgId,recipientPrincipal, amountBigInt, [reason]);
      console.log('✅ Award result:', result);
      
      // Check if the result indicates an error
      if (typeof result === 'string' && result.startsWith('Error:')) {
        console.error('❌ Backend returned error:', result);
        setSnackbar({
          open: true,
          message: result,
          severity: 'error'
        });
        return;
      }
      
      console.log('✅ Award successful!');
      setSnackbar({
        open: true,
        message: `Successfully awarded ${amount} reputation points to ${recipient}`,
        severity: 'success'
      });
      
      // Reset form
      setRecipient('');
      setAmount('');
      setReason('');
      setCategory('');
      
      // Reload recent awards
      console.log('🔄 Reloading recent awards after successful award...');
      await loadRecentAwards();
      
    } catch (error: any) {
      console.error('❌ Award error:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Full error object:', error);
      
      let errorMessage = 'Failed to award reputation. Please try again.';
      
      // Handle specific error types
      if (error.message) {
        if (error.message.includes('Not a trusted awarder')) {
          errorMessage = 'You are not authorized to award reputation points. Only trusted awarders can perform this action.';
        } else if (error.message.includes('Daily mint cap exceeded')) {
          errorMessage = 'Daily minting limit exceeded. Please try again tomorrow.';
        } else if (error.message.includes('Cannot award rep to yourself')) {
          errorMessage = 'You cannot award reputation points to yourself.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
      console.log('🏁 Award submission completed');
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

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
        <EmojiEvents sx={{ color: 'hsl(var(--primary))' }} />
        Award Reputation
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Award Form */}
        <Awardform
        recipient={recipient}
        setRecipient={setRecipient}
        amount={amount}
        setAmount={setAmount}
        category={category}
        setCategory={setCategory}
        reason={reason}
        setReason={setReason}
        isLoading={isLoading}
        handleAwardSubmit={handleAwardSubmit}
      />


        {/* Award Summary */}
        <AwardSummary totalAwards={totalAwards} totalRepAwarded={totalRepAwarded} />






      </Box>

      {/* Recent Awards */}
      <RecentAwardsTable
        recentAwards={recentAwards}
        loadingAwards={loadingAwards}
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

const AwardRepWithProtection: React.FC = () => {
  return (
    <ProtectedPage>
      <AwardRep />
    </ProtectedPage>
  );
};

export default AwardRepWithProtection;
