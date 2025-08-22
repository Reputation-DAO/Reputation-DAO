// frontend/src/pages/TransactionLog.tsx
import React, { useState, useEffect } from 'react';
import ProtectedPage from '../components/layout/ProtectedPage';
import { Principal } from '@dfinity/principal';
import {
  Container,
  Typography,
  Box,
  TextField,
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
  CircularProgress,
  Pagination,
  Alert,
} from '@mui/material';
import { getPlugActor } from '../components/canister/reputationDao';

interface BackendTransaction {
  id: bigint;
  transactionType: { Award: null } | { Revoke: null } | { Decay: null };
  from: Principal;
  to: Principal;
  amount: bigint;
  timestamp: bigint;
  reason: [] | [string];
}

interface TransactionUI {
  id: string;
  transactionType: { Award: null } | { Revoke: null } | { Decay: null };
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  reason: string | null;
}

const TransactionLog: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionUI[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const itemsPerPage = 10;
  const [orgId, setOrgId] = useState<string | null>(null);

  // Load orgId
  useEffect(() => {
    const stored = localStorage.getItem('selectedOrgId');
    if (stored) setOrgId(stored);
  }, []);

  useEffect(() => {
    if (orgId) loadTransactions();
    else setLoading(false);
  }, [orgId]);

  const loadTransactions = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      const actor = await getPlugActor();
      const result = await actor.getTransactionHistory(orgId);
      const rawTransactions: BackendTransaction[] = Array.isArray(result) ? (result[0] || []) : (result || []);

      const processed: TransactionUI[] = rawTransactions.map(tx => ({
        id: tx.id.toString(),
        transactionType: tx.transactionType,
        from: tx.from.toString(),
        to: tx.to.toString(),
        amount: Number(tx.amount),
        timestamp: Number(tx.timestamp) * 1000,
        reason: tx.reason?.[0] || null,
      }));

      processed.sort((a, b) => b.timestamp - a.timestamp);
      setTransactions(processed);
      setError(null);
    } catch (err: any) {
      console.error(err);
      setError('Failed to load transaction history: ' + (err?.message ?? String(err)));
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // Filtering
  useEffect(() => {
    let filtered = [...transactions];

    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      filtered = filtered.filter(tx =>
        tx.from.toLowerCase().includes(q) ||
        tx.to.toLowerCase().includes(q) ||
        tx.id.toLowerCase().includes(q) ||
        (tx.reason && tx.reason.toLowerCase().includes(q))
      );
    }

    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => {
        if (typeFilter === 'award') return 'Award' in tx.transactionType;
        if (typeFilter === 'revoke') return 'Revoke' in tx.transactionType;
        if (typeFilter === 'decay') return 'Decay' in tx.transactionType;
        return true;
      });
    }

    setFilteredTransactions(filtered);
    setPage(1);
  }, [transactions, searchTerm, typeFilter]);

  const paginatedTransactions = filteredTransactions.slice((page - 1) * itemsPerPage, page * itemsPerPage);
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));

  const getTransactionTypeText = (type: TransactionUI['transactionType']) => {
    if ('Award' in type) return 'Award';
    if ('Revoke' in type) return 'Revoke';
    if ('Decay' in type) return 'Decay';
    return 'Unknown';
  };

  const getTransactionTypeColor = (type: TransactionUI['transactionType']) => {
    if ('Award' in type) return 'hsl(var(--success))';
    if ('Revoke' in type) return 'hsl(var(--destructive))';
    if ('Decay' in type) return 'hsl(var(--warning))';
    return 'hsl(var(--muted))';
  };

  const formatPrincipal = (principal: string) =>
    principal.length > 12 ? `${principal.slice(0, 5)}...${principal.slice(-5)}` : principal;

  const formatTimestamp = (ts: number) => new Date(ts).toLocaleString();

  // Loading/Error handling
  if (loading) return (
    <Container maxWidth="lg" sx={{ py: 6, display: 'flex', justifyContent: 'center' }}>
      <CircularProgress sx={{ color: 'hsl(var(--primary))' }} />
    </Container>
  );

  if (!orgId) return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Alert severity="warning">No organization selected. Select an org to view transaction history.</Alert>
    </Container>
  );

  if (error) return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Alert severity="error">{error}</Alert>
    </Container>
  );

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      {/* Header */}
      <Typography variant="h4" gutterBottom sx={{ color: 'hsl(var(--foreground))', fontWeight: 700 }}>
        Transaction Log
      </Typography>
      <Typography variant="body1" sx={{ color: 'hsl(var(--muted-foreground))', mb: 4 }}>
        Complete history of all reputation awards, revocations, and decay events.
      </Typography>

      {/* Filters */}
      <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', mb: 4 }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
          placeholder="Search by ID, principal, or reason..."
          sx={{
            minWidth: 280,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'hsl(var(--background))',
              borderRadius: 'var(--radius)',
              '& fieldset': { borderColor: 'hsl(var(--border))' },
              '&:hover fieldset': { borderColor: 'hsl(var(--primary))' },
            },
            '& .MuiInputBase-input': { color: 'hsl(var(--foreground))' },
            '& .MuiInputLabel-root': { color: 'hsl(var(--muted-foreground))' },
          }}
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Transaction Type</InputLabel>
          <Select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            label="Transaction Type"
            sx={{
              backgroundColor: 'hsl(var(--background))',
              borderRadius: 'var(--radius)',
              '& .MuiSelect-select': { color: 'hsl(var(--foreground))' },
            }}
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="award">Award</MenuItem>
            <MenuItem value="revoke">Revoke</MenuItem>
            <MenuItem value="decay">Decay</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Stats */}
      <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
        <Chip label={`Total: ${transactions.length}`} variant="outlined" sx={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
        <Chip label={`Filtered: ${filteredTransactions.length}`} variant="outlined" sx={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }} />
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{ borderRadius: 'var(--radius)', overflow: 'hidden', boxShadow: 'var(--shadow-md)', border: '1px solid hsl(var(--border))' , background:"hsl(var(--background))"}}>
        <Table sx={{ minWidth: 720 }}>
          <TableHead sx={{ backgroundColor: 'hsl(var(--secondary))' }}>
            <TableRow>
              {['ID', 'Type', 'From', 'To', 'Amount', 'Timestamp', 'Reason'].map(header => (
                <TableCell key={header} sx={{ color: 'hsl(var(--secondary-foreground))', fontWeight: 600 }}>{header}</TableCell>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTransactions.map(tx => (
              <TableRow key={tx.id} sx={{
                '&:hover': { backgroundColor: 'hsl(var(--muted))', transition: 'var(--transition-fast)' },
              }}>
                <TableCell sx={{ fontFamily: 'monospace', color: 'hsl(var(--foreground))' }}>{tx.id}</TableCell>
                <TableCell>
                  <Chip
                    label={getTransactionTypeText(tx.transactionType)}
                    sx={{
                      bgcolor: getTransactionTypeColor(tx.transactionType),
                      color: 'hsl(var(--primary-foreground))',
                      fontWeight: 600,
                      borderRadius: 'var(--radius)',
                    }}
                    size="small"
                  />
                </TableCell>
                <TableCell sx={{ fontFamily: 'monospace', color: 'hsl(var(--foreground))' }}>{formatPrincipal(tx.from)}</TableCell>
                <TableCell sx={{ fontFamily: 'monospace', color: 'hsl(var(--foreground))' }}>{formatPrincipal(tx.to)}</TableCell>
                <TableCell sx={{ fontWeight: 600, color: 'hsl(var(--foreground))' }}>
                  {getTransactionTypeText(tx.transactionType) === 'Revoke' ? `-${tx.amount}` : `+${tx.amount}`}
                </TableCell>
                <TableCell sx={{ color: 'hsl(var(--muted-foreground))' }}>{formatTimestamp(tx.timestamp)}</TableCell>
                <TableCell sx={{
                  color: 'hsl(var(--muted-foreground))',
                  maxWidth: 200,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {tx.reason || '-'}
                </TableCell>
              </TableRow>
            ))}
            {filteredTransactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} sx={{ textAlign: 'center', py: 4, color: 'hsl(var(--muted-foreground))' }}>
                  No transactions found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
          <Pagination count={totalPages} page={page} onChange={(_, p) => setPage(p)} color="primary" />
        </Box>
      )}
    </Container>
  );
};

const TransactionLogWithProtection: React.FC = () => (
  <ProtectedPage>
    <TransactionLog />
  </ProtectedPage>
);

export default TransactionLogWithProtection;
