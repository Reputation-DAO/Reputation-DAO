import React, { useState, useEffect } from 'react';
import {
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Alert,
  Box,
  Avatar,
  Stack,
  CircularProgress
} from '@mui/material';
import HistoryIcon from '@mui/icons-material/History';
import { getPlugActor } from '../components/canister/reputationDao';

interface Transaction {
  id: number;
  transactionType: { Award: null } | { Revoke: null } | { Decay: null };
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  reason: string[] | [];
}

const TransactionLogSimple: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const actor = await getPlugActor();
        const result = await actor.getTransactionHistory();
        // Transform bigint and Principal into usable JS format
        const formatted = result.map((tx: any) => ({
          id: Number(tx.id),
          transactionType: tx.transactionType,
          from: tx.from.toText(),
          to: tx.to.toText(),
          amount: Number(tx.amount),
          timestamp: Number(tx.timestamp),
          reason: tx.reason,
        }));
        setTransactions(formatted);
      } catch (err: any) {
        console.error(err);
        setError(err.message || 'Failed to fetch transactions.');
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatPrincipal = (principal: string): string => {
    if (principal.length <= 12) return principal;
    return `${principal.slice(0, 6)}...${principal.slice(-6)}`;
  };

  const getTransactionTypeColor = (
    type: Transaction['transactionType']
  ): 'success' | 'error' | 'warning' => {
    if ('Award' in type) return 'success';
    if ('Revoke' in type) return 'error';
    return 'warning';
  };

  const getTransactionTypeText = (type: Transaction['transactionType']): string => {
    if ('Award' in type) return 'Award';
    if ('Revoke' in type) return 'Revoke';
    return 'Decay';
  };

  if (loading) {
    return (
      <Box
        sx={{
          width: '100%',
          minHeight: '100vh',
          backgroundColor: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          px: { xs: 2, sm: 4, md: 8 },
          py: { xs: 6, sm: 8 },
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress sx={{ color: 'hsl(var(--primary))' }} />
      </Box>
    );
  }

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: '100vh',
        backgroundColor: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        px: { xs: 2, sm: 4, md: 8 },
        py: { xs: 6, sm: 8 },
      }}
    >
      <Paper
        elevation={4}
        sx={{
          maxWidth: { xs: '100%', md: 1200 },
          mx: 'auto',
          mt: { xs: 4, md: 6 },
          p: { xs: 3, sm: 5 },
          borderRadius: 3,
          background: 'linear-gradient(135deg, hsla(var(--primary), 0.2), hsla(var(--muted), 0.9))',
          border: 'var(--glass-border)',
          backdropFilter: 'var(--glass-blur)',
          boxShadow: 'var(--shadow-md)',
        }}
      >
        <Stack spacing={3} alignItems="center">
          <Avatar
            sx={{
              bgcolor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              width: 64,
              height: 64,
            }}
          >
            <HistoryIcon fontSize="large" />
          </Avatar>

          <Typography variant="h4" fontWeight={600} textAlign="center">
            Transaction Log
          </Typography>

          {error && (
            <Alert severity="error" sx={{ width: '100%' }}>
              {error}
            </Alert>
          )}

          {transactions.length === 0 ? (
            <Typography variant="body1" sx={{ color: 'hsl(var(--muted-foreground))' }}>
              No transactions found.
            </Typography>
          ) : (
            <Box sx={{ width: '100%', overflowX: 'auto' }}>
              <TableContainer component={Paper} sx={{ borderRadius: 2 }}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>ID</TableCell>
                      <TableCell>Type</TableCell>
                      <TableCell>From</TableCell>
                      <TableCell>To</TableCell>
                      <TableCell>Amount</TableCell>
                      <TableCell>Timestamp</TableCell>
                      <TableCell>Reason</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id}>
                        <TableCell>{tx.id}</TableCell>
                        <TableCell>
                          <Chip
                            label={getTransactionTypeText(tx.transactionType)}
                            color={getTransactionTypeColor(tx.transactionType)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>{formatPrincipal(tx.from)}</TableCell>
                        <TableCell>{formatPrincipal(tx.to)}</TableCell>
                        <TableCell>{tx.amount}</TableCell>
                        <TableCell>{formatTimestamp(tx.timestamp)}</TableCell>
                        <TableCell>{tx.reason.length ? tx.reason[0] : '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default TransactionLogSimple;
