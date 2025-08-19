// frontend/src/pages/TransactionLog.tsx
import React, { useState, useEffect } from 'react';
import ProtectedPage from '../components/layout/ProtectedPage';
import { Principal } from '@dfinity/principal';
import {
  Container,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Box,
  TableSortLabel,
  Pagination,
  CircularProgress,
  Alert
} from '@mui/material';
import { getPlugActor } from '../components/canister/reputationDao';

/** Backend shape coming from the canister (Motoko) */
interface BackendTransaction {
  id: bigint;
  transactionType: { Award: null } | { Revoke: null } | { Decay: null };
  from: Principal;
  to: Principal;
  amount: bigint;
  timestamp: bigint; // seconds (Motoko Nat)
  reason: [] | [string];
}

/** UI-friendly transaction */
interface TransactionUI {
  id: string; // use string (toString on bigint) to avoid numeric-safety issues
  transactionType: { Award: null } | { Revoke: null } | { Decay: null };
  from: string;
  to: string;
  amount: number; // kept as number (mirrors your RevokeRep style)
  timestamp: number; // ms (JS)
  reason: string | null;
}

type SortField = 'id' | 'timestamp' | 'amount';
type SortDirection = 'asc' | 'desc';

const TransactionLog: React.FC = () => {
  const [transactions, setTransactions] = useState<TransactionUI[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<TransactionUI[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // filters + sort + pagination
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('id');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [orgId, setOrgId] = useState<string | null>(null);

  // read orgId from localStorage (same pattern as RevokeRep)
  useEffect(() => {
    const stored = localStorage.getItem('selectedOrgId');
    if (stored) setOrgId(stored);
  }, []);

  // load transactions whenever orgId is available
  useEffect(() => {
    if (!orgId) {
      setLoading(false);
      return;
    }
    loadTransactions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const loadTransactions = async () => {
    if (!orgId) return;
    try {
      setLoading(true);
      console.log('🔄 Loading transaction history...');
      console.log('🔗 Getting Plug actor connection...');
      const actor = await getPlugActor();
      console.log('✅ Actor connected:', !!actor);

      console.log('📞 Calling getTransactionHistory() with orgId:', orgId);
      const transactionsResult = await actor.getTransactionHistory(orgId);

      // **Mimic RevokeRep optional-unwrapping** exactly:
      // If Motoko returned ? [Transaction], it appears here as an array where index 0 is the vec.
      const rawTransactions: BackendTransaction[] = Array.isArray(transactionsResult)
        ? (transactionsResult[0] || [])
        : (transactionsResult || []);

      console.log('📊 Raw transactions:', rawTransactions);
      console.log('📊 Raw transactions count:', rawTransactions.length);

      if (!Array.isArray(rawTransactions) || rawTransactions.length === 0) {
        console.log('ℹ️ No transactions found in canister');
        setTransactions([]);
        setFilteredTransactions([]);
        setError(null);
        return;
      }

      // Convert to UI-friendly type (mirrors RevokeRep conversions)
      const processed: TransactionUI[] = rawTransactions.map(tx => {
        const tsSec = Number(tx.timestamp); // seconds
        const tsMs = tsSec > 0 ? tsSec * 1000 : Date.now();

        return {
          id: tx.id.toString(),
          transactionType: tx.transactionType,
          from: tx.from.toString(),
          to: tx.to.toString(),
          amount: Number(tx.amount), // keep same approach as RevokeRep
          timestamp: tsMs,
          reason: (tx.reason && tx.reason.length > 0) ? tx.reason[0]! : null
        };
      });

      // sort newest first by timestamp (same approach as suggested earlier)
      processed.sort((a, b) => b.timestamp - a.timestamp);

      console.log('🎯 Processed transactions:', processed);
      setTransactions(processed);
      setError(null);
    } catch (err: any) {
      console.error('❌ Error loading transactions:', err);
      setError('Failed to load transaction history: ' + (err?.message ?? String(err)));
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  // apply filters + sorting (keeps same behavior as your original, but uses the processed list)
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

    // sort
    filtered.sort((a, b) => {
      let aValue: number, bValue: number;
      switch (sortField) {
        case 'id':
          // compare numeric if possible, else fallback to string compare
          aValue = parseInt(a.id) || 0;
          bValue = parseInt(b.id) || 0;
          break;
        case 'timestamp':
          aValue = a.timestamp;
          bValue = b.timestamp;
          break;
        case 'amount':
          aValue = a.amount;
          bValue = b.amount;
          break;
        default:
          aValue = a.timestamp;
          bValue = b.timestamp;
      }
      return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
    });

    setFilteredTransactions(filtered);
    setPage(1); // reset to first page on filter change
  }, [transactions, searchTerm, typeFilter, sortField, sortDirection]);

  // pagination
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
  const totalPages = Math.max(1, Math.ceil(filteredTransactions.length / itemsPerPage));

  // helpers for UI
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getTransactionTypeText = (type: TransactionUI["transactionType"]) => {
    if ("Award" in type) return "Award";
    if ("Revoke" in type) return "Revoke";
    if ("Decay" in type) return "Decay";
    return "Unknown";
  };

  const getTransactionTypeColor = (type: TransactionUI["transactionType"]) => {
    if ("Award" in type) return "success";
    if ("Revoke" in type) return "error";
    if ("Decay" in type) return "warning";
    return "default";
  };

  const formatPrincipal = (principal: string) => {
    return principal.length > 12
      ? `${principal.slice(0, 5)}...${principal.slice(-5)}`
      : principal;
  };

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp).toLocaleString();
  };

  // rendering guard rails (loading/wallet/error)
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  // actor presence is implied by getPlugActor usage — but keep messaging if no org selected
  if (!orgId) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">No organization selected. Select an org to view transaction history.</Alert>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ color: 'hsl(var(--foreground))' }}>
        Transaction Log
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Complete history of all reputation awards, revocations and decay events.
      </Typography>

      {/* Filters */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by ID, principal, or reason..."
          sx={{
            minWidth: 300,
            '& .MuiOutlinedInput-root': {
              backgroundColor: 'hsl(var(--background))',
              '& fieldset': { borderColor: 'hsl(var(--border))' },
            },
            '& .MuiInputBase-input': { color: 'hsl(var(--foreground))' },
            '& .MuiInputLabel-root': { color: 'hsl(var(--muted-foreground))' }
          }}
        />

        <FormControl size="small" sx={{ minWidth: 150 }}>
          <InputLabel>Transaction Type</InputLabel>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            label="Transaction Type"
          >
            <MenuItem value="all">All Types</MenuItem>
            <MenuItem value="award">Award</MenuItem>
            <MenuItem value="revoke">Revoke</MenuItem>
            <MenuItem value="decay">Decay</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Stats */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Chip label={`Total Transactions: ${transactions.length}`} variant="outlined" />
        <Chip label={`Filtered Results: ${filteredTransactions.length}`} variant="outlined" />
      </Box>

      {/* Table */}
      <TableContainer component={Paper} sx={{
        backgroundColor: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))'
      }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: 'hsl(var(--card))' }}>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'id'}
                  direction={sortField === 'id' ? sortDirection : 'asc'}
                  onClick={() => handleSort('id')}
                >
                  ID
                </TableSortLabel>
              </TableCell>
              <TableCell>Type</TableCell>
              <TableCell>From</TableCell>
              <TableCell>To</TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'amount'}
                  direction={sortField === 'amount' ? sortDirection : 'asc'}
                  onClick={() => handleSort('amount')}
                >
                  Amount
                </TableSortLabel>
              </TableCell>
              <TableCell>
                <TableSortLabel
                  active={sortField === 'timestamp'}
                  direction={sortField === 'timestamp' ? sortDirection : 'asc'}
                  onClick={() => handleSort('timestamp')}
                >
                  Timestamp
                </TableSortLabel>
              </TableCell>
              <TableCell>Reason</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedTransactions.map(tx => (
              <TableRow key={tx.id} sx={{ '&:hover': { backgroundColor: 'hsl(var(--background))' } }}>
                <TableCell sx={{ color: 'hsl(var(--foreground))' }}>{tx.id}</TableCell>
                <TableCell>
                  <Chip
                    label={getTransactionTypeText(tx.transactionType)}
                    color={getTransactionTypeColor(tx.transactionType) as any}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace" sx={{ color: 'hsl(var(--foreground))' }}>
                    {formatPrincipal(tx.from)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace" sx={{ color: 'hsl(var(--foreground))' }}>
                    {formatPrincipal(tx.to)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold" sx={{ color: ('Revoke' in tx.transactionType) ? 'hsl(var(--destructive))' : 'hsl(var(--foreground))' }}>
                    {('Revoke' in tx.transactionType) ? `-${tx.amount}` : `${tx.amount}`}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                    {formatTimestamp(tx.timestamp)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))', maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {tx.reason || '-'}
                  </Typography>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'center' }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      )}

      {/* No results */}
      {filteredTransactions.length === 0 && !loading && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">No transactions found</Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || typeFilter !== 'all' ? 'Try adjusting your filters' : 'No transactions have been recorded yet'}
          </Typography>
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
