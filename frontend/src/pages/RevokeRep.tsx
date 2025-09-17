// frontend/src/pages/RevokeRep.tsx
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import ProtectedPage from '../components/layout/ProtectedPage';
import { useParams } from 'react-router-dom';
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
  DialogTitle,
  Chip,
  CircularProgress,
} from '@mui/material';
import { RemoveCircle } from '@mui/icons-material';
import { makeChildWithPlug } from '../components/canister/child';

import RevokeReputationCard from '../components/Dashboard/revokerep/RevokeForm';
import RevocationSummary from '../components/Dashboard/revokerep/RevokeSum';
import RevocationRecent from '../components/Dashboard/revokerep/RecentRevoke';

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
  timestamp: bigint; // seconds
  reason: [] | [string];
}

const RevokeRep: React.FC = () => {
  const { cid } = useParams<{ cid: string }>();

  const [child, setChild] = useState<any>(null);

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState(false);

  const [totalPointsRevoked, setTotalPointsRevoked] = useState(0);
  const [totalRevocations, setTotalRevocations] = useState(0);
  const [recentRevocations, setRecentRevocations] = useState<RevokeTransaction[]>([]);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  const [connecting, setConnecting] = useState(true);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Build child actor from :cid
  useEffect(() => {
    (async () => {
      try {
        if (!cid) {
          setConnectError('No organization selected.');
          return;
        }
        const actor = await makeChildWithPlug({ canisterId: cid, host: 'https://icp-api.io' });
        setChild(actor);
      } catch (e: any) {
        setConnectError(e?.message || 'Failed to connect to org canister');
      } finally {
        setConnecting(false);
      }
    })();
  }, [cid]);

  // Load recent revocations from child
  const loadRecentRevocations = async () => {
    if (!child) return;
    try {
      const txs: BackendTransaction[] = await child.getTransactionHistory();
      const arr = Array.isArray(txs) ? txs : [];

      // Newest-first comes from backend already; take latest 10 revokes
      const revokeTx = arr
        .filter((tx) => tx.transactionType && 'Revoke' in tx.transactionType)
        .slice(0, 10)
        .map((tx) => {
          const tsSec = Number(tx.timestamp || 0);
          const date =
            tsSec > 0
              ? new Date(tsSec * 1000).toISOString().split('T')[0]
              : new Date().toISOString().split('T')[0];
          return {
            id: tx.id.toString(),
            recipient: tx.to.toString(),
            amount: Number(tx.amount),
            reason: tx.reason?.[0] || 'No reason provided',
            date,
            status: 'completed' as const,
            revokedBy: tx.from.toString(),
          };
        });

      setRecentRevocations(revokeTx);
      setTotalPointsRevoked(revokeTx.reduce((s, t) => s + t.amount, 0));
      setTotalRevocations(revokeTx.length);
    } catch (error) {
      console.error('Failed to load recent revocations:', error);
      setRecentRevocations([]);
      setTotalPointsRevoked(0);
      setTotalRevocations(0);
      setSnackbar({
        open: true,
        message: 'Failed to load recent revocations from blockchain.',
        severity: 'warning',
      });
    }
  };

  // Load on child ready
  useEffect(() => {
    if (child) loadRecentRevocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child]);

  // Submit (open confirm)
  const handleRevokeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient || !amount || !reason) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'warning',
      });
      return;
    }
    try {
      Principal.fromText(recipient); // validate format
    } catch {
      setSnackbar({ open: true, message: 'Invalid Principal ID format', severity: 'error' });
      return;
    }
    const numAmount = Number(amount);
    if (!Number.isFinite(numAmount) || numAmount <= 0) {
      setSnackbar({
        open: true,
        message: 'Amount must be a positive number',
        severity: 'error',
      });
      return;
    }
    setConfirmDialog(true);
  };

  // Confirm + perform revoke on child canister
  const handleConfirmRevoke = async () => {
    setConfirmDialog(false);
    setIsLoading(true);
    try {
      if (!child) throw new Error('Not connected to the organization canister');

      const recipientPrincipal = Principal.fromText(recipient);
      const amt = BigInt(Number(amount));

      // Only owner can revoke (child will enforce)
      const res: string = await child.revokeRep(recipientPrincipal, amt, [reason]);

      if (typeof res === 'string' && res.startsWith('Error:')) {
        setSnackbar({ open: true, message: res, severity: 'error' });
        return;
      }

      setSnackbar({
        open: true,
        message: `Successfully revoked ${amount} reputation points from ${recipient}`,
        severity: 'success',
      });

      // Reset form
      setRecipient('');
      setAmount('');
      setReason('');
      setCategory('');

      // Reload list
      await loadRecentRevocations();
    } catch (error: any) {
      console.error('Revoke error:', error);
      let msg = 'Failed to revoke reputation. Please try again.';
      if (error?.message) {
        if (error.message.includes('Only owner')) msg = 'Only the organization admin can revoke reputation.';
        else if (error.message.includes('Insufficient balance')) msg = 'User has insufficient balance to revoke.';
        else msg = error.message;
      }
      setSnackbar({ open: true, message: msg, severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbar((p) => ({ ...p, open: false }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'success';
      case 'pending':
        return 'warning';
      case 'failed':
        return 'error';
      default:
        return 'default';
    }
  };

  // Loading / error states for connecting the child
  if (connecting) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress sx={{ color: 'hsl(var(--primary))' }} />
      </Box>
    );
  }

  if (!cid || connectError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{connectError || 'No organization selected.'}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: 'hsl(var(--background))', minHeight: '100vh' }}>
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
        <RemoveCircle sx={{ color: 'hsl(var(--destructive))' }} />
        Revoke Reputation
        <Chip
          label={`Org: ${cid}`}
          size="small"
          sx={{ ml: 2, bgcolor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }}
        />
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

        {/* Summary */}
        <RevocationSummary totalRevocations={totalRevocations} totalPointsRevoked={totalPointsRevoked} />
      </Box>

      {/* Recent Revocations */}
      <RevocationRecent recentRevocations={recentRevocations} getStatusColor={getStatusColor} />

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
            Are you sure you want to revoke <strong>{amount} reputation points</strong> from{' '}
            <strong>{recipient}</strong>? This action requires administrative permissions and will be logged for audit
            purposes.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialog(false)} sx={{ color: 'hsl(var(--muted-foreground))' }}>
            Cancel
          </Button>
          <Button
            onClick={handleConfirmRevoke}
            sx={{ color: 'hsl(var(--destructive))', fontWeight: 600 }}
            autoFocus
            disabled={isLoading}
          >
            {isLoading ? 'Revoking…' : 'Confirm Revocation'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

const RevokeRepWithProtection: React.FC = () => (
  <ProtectedPage>
    <RevokeRep />
  </ProtectedPage>
);

export default RevokeRepWithProtection;
