// @ts-nocheck
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ProtectedPage from '../components/layout/ProtectedPage';
import {
  Box,
  Typography,
  Alert,
  Snackbar,
} from '@mui/material';
import { EmojiEvents } from '@mui/icons-material';
import { Principal } from '@dfinity/principal';
import { makeChildWithPlug } from '../components/canister/child';
import { useRole } from '../contexts/RoleContext';

import Awardform from '../components/Dashboard/awardrep/Awardform';
import AwardSummary from '../components/Dashboard/awardrep/AwardSummary';
import RecentAwardsTable from '../components/Dashboard/awardrep/RecentAward';

interface AwardTransaction {
  id: string;
  recipient: string;
  amount: number;
  reason: string;
  date: string;
  status: string;
}

const AwardRep: React.FC = () => {
  const { cid } = useParams<{ cid: string }>();
  const { currentPrincipal } = useRole();

  const [child, setChild] = useState<any>(null);

  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [totalAwards, setTotalAwards] = useState(0);
  const [totalRepAwarded, setTotalRepAwarded] = useState(0);
  const [recentAwards, setRecentAwards] = useState<AwardTransaction[]>([]);
  const [loadingAwards, setLoadingAwards] = useState(false);

  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  const toNum = (v: number | bigint) => (typeof v === 'bigint' ? Number(v) : v);

  /* Build child actor from :cid */
  useEffect(() => {
    (async () => {
      try {
        if (!cid) throw new Error('Missing :cid in route');
        const actor = await makeChildWithPlug({ canisterId: cid, host: 'https://icp-api.io' });
        setChild(actor);
      } catch (e: any) {
        setSnackbar({ open: true, message: e?.message || 'Failed to connect to org canister', severity: 'error' });
      }
    })();
  }, [cid]);

  /* Load recent awards / summary */
  const loadRecentAwards = async () => {
    if (!child) return;
    setLoadingAwards(true);
    try {
      const transactions = await child.getTransactionHistory(); // newest-first (per Motoko implementation)
      const awards = (Array.isArray(transactions) ? transactions : []).filter(
        (tx: any) => tx?.transactionType && 'Award' in tx.transactionType
      );

      const totalRep = awards.reduce((sum: number, tx: any) => sum + toNum(tx.amount), 0);
      setTotalRepAwarded(totalRep);
      setTotalAwards(awards.length);

      const lastFive = awards.slice(0, 5).map((tx: any) => {
        const ts = toNum(tx.timestamp);
        const date = ts > 0 ? new Date(ts * 1000).toISOString().split('T')[0] : new Date().toISOString().split('T')[0];
        const r = Array.isArray(tx.reason) && tx.reason.length ? tx.reason[0] : 'No reason provided';
        return {
          id: String(tx.id),
          recipient: tx.to?.toString?.() ?? '',
          amount: toNum(tx.amount),
          reason: r,
          date,
          status: 'completed',
        } as AwardTransaction;
      });

      setRecentAwards(lastFive);
    } catch (error) {
      console.error('Failed to load recent awards:', error);
      setRecentAwards([]);
      setSnackbar({
        open: true,
        message: 'Failed to load recent awards from the canister.',
        severity: 'warning',
      });
    } finally {
      setLoadingAwards(false);
    }
  };

  useEffect(() => {
    if (child) loadRecentAwards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child]);

  /* Submit award */
  const handleAwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!child) {
      setSnackbar({ open: true, message: 'Not connected to the canister.', severity: 'error' });
      return;
    }
    if (!recipient || !amount || !reason) {
      setSnackbar({ open: true, message: 'Please fill in all required fields', severity: 'warning' });
      return;
    }

    // Validate principal
    let toP: Principal;
    try {
      toP = Principal.fromText(recipient.trim());
    } catch {
      setSnackbar({ open: true, message: 'Invalid principal format.', severity: 'error' });
      return;
    }

    // Prevent self-award UI-side (canister also enforces)
    if (currentPrincipal && toP?.toString() === currentPrincipal.toString()) {
      setSnackbar({ open: true, message: 'You cannot award reputation to yourself.', severity: 'error' });
      return;
    }

    let amt: bigint;
    try {
      amt = BigInt(amount);
    } catch {
      setSnackbar({ open: true, message: 'Amount must be a valid integer.', severity: 'error' });
      return;
    }
    if (amt <= 0n) {
      setSnackbar({ open: true, message: 'Amount must be greater than 0.', severity: 'error' });
      return;
    }

    setIsLoading(true);
    try {
      // Optional string is `[reason]` for Some, `[]` for None in JS candid
      const optReason = reason.trim() ? [reason.trim()] : [];
      const result: string = await child.awardRep(toP, amt, optReason);

      if (typeof result === 'string' && result.startsWith('Error:')) {
        setSnackbar({ open: true, message: result, severity: 'error' });
        return;
      }

      setSnackbar({
        open: true,
        message: `Successfully awarded ${amount} REP to ${recipient}.`,
        severity: 'success',
      });

      // reset form
      setRecipient('');
      setAmount('');
      setReason('');
      setCategory('');

      // refresh
      await loadRecentAwards();
    } catch (error: any) {
      console.error('Award error:', error);
      let message = 'Failed to award reputation.';
      const msg = error?.message || '';
      if (/Not a trusted awarder/i.test(msg)) message = 'You are not authorized to award reputation.';
      else if (/Daily mint cap exceeded/i.test(msg)) message = 'Daily mint limit exceeded. Try again tomorrow.';
      else if (/Cannot self-award/i.test(msg)) message = 'You cannot award reputation to yourself.';
      else if (msg) message = msg;

      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCloseSnackbar = () => setSnackbar((s) => ({ ...s, open: false }));

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'failed': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ p: 3, backgroundColor: 'hsl(var(--background))', minHeight: '100vh' }}>
      <Typography
        variant="h4"
        sx={{ mb: 3, color: 'hsl(var(--foreground))', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 2 }}
      >
        <EmojiEvents sx={{ color: 'hsl(var(--primary))' }} />
        Award Reputation
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
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

        <AwardSummary totalAwards={totalAwards} totalRepAwarded={totalRepAwarded} />
      </Box>

      <RecentAwardsTable
        recentAwards={recentAwards}
        loadingAwards={loadingAwards}
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

const AwardRepWithProtection: React.FC = () => (
  <ProtectedPage>
    <AwardRep />
  </ProtectedPage>
);

export default AwardRepWithProtection;
