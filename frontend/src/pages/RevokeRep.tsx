import React, { useState, useEffect } from 'react';
import ProtectedPage from '../components/layout/ProtectedPage';
import { Principal } from '@dfinity/principal';
import {
  Box,
  Typography,
  Button,
  Alert,
  Snackbar,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle
} from '@mui/material';
import {
  RemoveCircle,

} from '@mui/icons-material';
import { getPlugActor } from '../components/canister/reputationDao';
import  RevokeReputationCard  from '../components/Dashboard/revokerep/RevokeForm';
import  RevocationSummary  from '../components/Dashboard/revokerep/RevokeSum';
import  RevocationRecent  from '../components/Dashboard/revokerep/RecentRevoke';

interface RevokeTransaction {
  id: string;
  recipient: string;
  amount: number;
  reason: string;
  date: string;
  status: 'pending' | 'completed' | 'failed';
  revokedBy: string;
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

const RevokeRep: React.FC = () => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);
  const [totalPointsRevoked , setTotalPointsRevoked] = useState(0);
  const [totalRevocations, setTotalRevocations] = useState(0);
  const [recentRevocations, setRecentRevocations] = useState<RevokeTransaction[]>([]);
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

  // Load recent revocations when orgId is available
  useEffect(() => {
    if (orgId) {
      loadRecentRevocations();
    }
  }, [orgId]);

  // Load recent revocations from blockchain
  const loadRecentRevocations = async () => {
    if (!orgId) return;
    try {
      console.log('🔄 Loading recent revoke transactions...');
      console.log('🔗 Getting Plug actor connection...');
      const actor = await getPlugActor();
      console.log('✅ Actor connected:', !!actor);

      console.log('📞 Calling getTransactionHistory() with orgId:', orgId);
      const transactionsResult = await actor.getTransactionHistory(orgId);

      // Handle Motoko optional array (? [Transaction]) exactly like AwardRep
      const transactions: BackendTransaction[] = Array.isArray(transactionsResult)
        ? (transactionsResult[0] || [])
        : (transactionsResult || []);

      console.log('📊 Raw transactions for revocations:', transactions);
      console.log('📊 Total transactions count:', transactions.length);

      if (!Array.isArray(transactions)) {
        console.warn('⚠️ Transactions is not an array:', transactions);
        setRecentRevocations([]);
        setTotalPointsRevoked(0);
        setTotalRevocations(0);
        return;
      }

      // Filter and convert revoke transactions (last 10, newest first)
      const revokeTransactions: RevokeTransaction[] = transactions
        .filter(tx => tx.transactionType && 'Revoke' in tx.transactionType)
        .slice(-10)
        .map(tx => {
          const timestamp = Number(tx.timestamp);
          const date = timestamp > 0
            ? new Date(timestamp * 1000).toISOString().split('T')[0] // seconds → ms
            : new Date().toISOString().split('T')[0];

          return {
            id: tx.id.toString(),
            recipient: tx.to.toString(),
            amount: Number(tx.amount),
            reason: (tx.reason && tx.reason.length > 0) ? tx.reason[0]! : 'No reason provided',
            date,
            status: 'completed' as const,
            revokedBy: tx.from.toString()
          };
        })
        .reverse();

      console.log('🎯 Processed revoke transactions:', revokeTransactions);
      console.log('🎯 Revoke transactions count:', revokeTransactions.length);

      setRecentRevocations(revokeTransactions);

      // Totals
      const totalPointsRevoked = revokeTransactions.reduce((sum, tx) => sum + tx.amount, 0);
      setTotalPointsRevoked(totalPointsRevoked);
      setTotalRevocations(revokeTransactions.length);

    } catch (error) {
      console.error('❌ Error loading recent revocations:', error);
      setRecentRevocations([]);
      setTotalPointsRevoked(0);
      setTotalRevocations(0);
      setSnackbar({
        open: true,
        message: 'Failed to load recent revocations from blockchain. The canister may be empty or connection failed.',
        severity: 'warning'
      });
    }
  };

  const handleRevokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!recipient || !amount || !reason) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'warning'
      });
      return;
    }

    // Validate Principal ID format
    try {
      Principal.fromText(recipient);
    } catch {
      setSnackbar({
        open: true,
        message: 'Invalid Principal ID format',
        severity: 'error'
      });
      return;
    }

    // Validate amount
    const numAmount = parseInt(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setSnackbar({
        open: true,
        message: 'Amount must be a positive number',
        severity: 'error'
      });
      return;
    }

    setConfirmDialog(true);
  };

  const handleConfirmRevoke = async () => {
    setConfirmDialog(false);
    setIsLoading(true);

    try {
      const actor = await getPlugActor();
      if (!actor) {
        throw new Error('Failed to connect to blockchain. Please ensure you are logged in.');
      }

      const recipientPrincipal = Principal.fromText(recipient);
      const numAmount = parseInt(amount);

      console.log('Revoking reputation:', {
        to: recipientPrincipal.toString(),
        amount: numAmount,
        reason: reason
      });

      const orgId = localStorage.getItem('selectedOrgId')?.trim();
      if (!orgId) {
        throw new Error('No orgId found in localStorage');
      }

      console.log('📞 Calling revokeRep() - auto-injecting orgId...');
      const result = await actor.revokeRep(orgId, recipientPrincipal, BigInt(numAmount), [reason]);
      console.log('✅ Revoke result:', result);

      // Backend string error pattern handling (mirrors Award)
      if (typeof result === 'string' && result.startsWith('Error:')) {
        console.error('❌ Backend returned error:', result);
        setSnackbar({
          open: true,
          message: result,
          severity: 'error'
        });
        return;
      }

      setSnackbar({
        open: true,
        message: `Successfully revoked ${amount} reputation points from ${recipient}`,
        severity: 'success'
      });

      // Reset form
      setRecipient('');
      setAmount('');
      setReason('');
      setCategory('');

      // Reload recent revocations immediately (no setTimeout needed)
      await loadRecentRevocations();

    } catch (error: any) {
      console.error('❌ Error revoking reputation:', error);
      let errorMessage = 'Failed to revoke reputation. Please try again.';
      if (error?.message) {
        // mirror Award-style surface of backend reasons
        if (error.message.includes('Not a trusted awarder')) {
          errorMessage = 'You are not authorized to revoke reputation points.';
        } else if (error.message.includes('Daily mint cap exceeded')) {
          errorMessage = 'Daily limit exceeded.';
        } else if (error.message.includes('Cannot revoke from yourself')) {
          errorMessage = 'You cannot revoke reputation points from yourself.';
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
        <RemoveCircle sx={{ color: 'hsl(var(--destructive))' }} />
        Revoke Reputation
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Revoke Form */}
        <RevokeReputationCard
          recipient={recipient}
          setRecipient={setRecipient}
          amount={amount}
          setAmount={setAmount}
          category={category}
          setCategory={setCategory}
          reason={reason}
          setReason={setReason}
          isLoading={isLoading}
          handleRevokeSubmit={handleRevokeSubmit}
        />


        {/* Revocation Summary */}
        <RevocationSummary 
  totalRevocations={totalRevocations} 
  totalPointsRevoked={totalPointsRevoked} 
/>

      </Box>

      {/* Recent Revocations */}
      <RevocationRecent
  recentRevocations={recentRevocations} 
  getStatusColor={getStatusColor} 
/>


      {/* Confirmation Dialog */}
      <Dialog
        open={confirmDialog}
        onClose={() => setConfirmDialog(false)}
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        <DialogTitle id="confirm-dialog-title" sx={{ color: 'hsl(var(--foreground))' }}>
          Confirm Reputation Revocation
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="confirm-dialog-description" sx={{ color: 'hsl(var(--muted-foreground))' }}>
            Are you sure you want to revoke <strong>{amount} reputation points</strong> from <strong>{recipient}</strong>?
            This action requires administrative approval and will be logged for audit purposes.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)} sx={{ color: 'hsl(var(--muted-foreground))' }}>
            Cancel
          </Button>
          <Button 
            onClick={handleConfirmRevoke} 
            sx={{ 
              color: 'hsl(var(--destructive))',
              fontWeight: 600
            }}
            autoFocus
          >
            Confirm Revocation
          </Button>
        </DialogActions>
      </Dialog>

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

const RevokeRepWithProtection: React.FC = () => {
  return (
    <ProtectedPage>
      <RevokeRep />
    </ProtectedPage>
  );
};

export default RevokeRepWithProtection;
