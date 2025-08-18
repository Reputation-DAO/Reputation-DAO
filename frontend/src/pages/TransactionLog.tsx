import React, { useState, useEffect } from 'react';
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
import { useCanister } from '@connect2ic/react';
import { Principal } from '@dfinity/principal';

// --- Raw type (from canister) ---
interface RawTransaction {
  id: bigint;
  transactionType: { Award: null } | { Revoke: null } | { Decay: null };
  from: Principal;
  to: Principal;
  amount: bigint;
  timestamp: bigint; // Motoko stores Nat (seconds since Unix epoch)
  reason: [] | [string];
}

// --- UI-friendly type ---
interface Transaction {
  id: number;
  transactionType: { Award: null } | { Revoke: null } | { Decay: null };
  from: string;
  to: string;
  amount: number;
  timestamp: number; // JS timestamp (ms)
  reason: string | null;
}

type SortField = 'id' | 'timestamp' | 'amount';
type SortDirection = 'asc' | 'desc';

const TransactionLog: React.FC = () => {
  const [actor] = useCanister('reputation_dao');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and sorting
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('timestamp');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  // Pagination
  const [page, setPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Fetch transactions
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!actor) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);

        const orgId = localStorage.getItem("selectedOrgId")?.trim();
        if (!orgId) {
          throw new Error("No orgId found in localStorage");
        }

        const result = await actor.getTransactionHistory(orgId) 

        if (!result || result.length === 0) {
          setTransactions([]);
          setError(null);
          return;
        }

        // Convert raw canister data to UI-friendly type
        const processedTransactions: Transaction[] = result.map((tx) => ({
          id: Number(tx.id),
          transactionType: tx.transactionType,
          from: tx.from.toString(),
          to: tx.to.toString(),
          amount: Number(tx.amount),
          timestamp: Number(tx.timestamp) * 1000, // seconds → ms for JS Date
          reason: tx.reason.length > 0 ? tx.reason[0] : null
        }));

        setTransactions(processedTransactions);
        setError(null);
      } catch (err) {
        setError('Failed to fetch transaction history: ' + (err as Error).message);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, [actor]);

  // Apply filters and sorting
  useEffect(() => {
    let filtered = [...transactions];

    if (searchTerm) {
      filtered = filtered.filter(tx =>
        tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.id.toString().includes(searchTerm) ||
        (tx.reason && tx.reason.toLowerCase().includes(searchTerm.toLowerCase()))
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

    filtered.sort((a, b) => {
      let aValue: number, bValue: number;
      switch (sortField) {
        case 'id': aValue = a.id; bValue = b.id; break;
        case 'timestamp': aValue = a.timestamp; bValue = b.timestamp; break;
        case 'amount': aValue = a.amount; bValue = b.amount; break;
        default: aValue = a.timestamp; bValue = b.timestamp;
      }
      return sortDirection === 'asc'
        ? aValue - bValue
        : bValue - aValue;
    });

    setFilteredTransactions(filtered);
    setPage(1);
  }, [transactions, searchTerm, typeFilter, sortField, sortDirection]);

  // Pagination
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  // --- Helpers ---
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const getTransactionTypeText = (type: Transaction["transactionType"]) => {
    if ("Award" in type) return "Award";
    if ("Revoke" in type) return "Revoke";
    if ("Decay" in type) return "Decay";
    return "Unknown";
  };

  const getTransactionTypeColor = (type: Transaction["transactionType"]) => {
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

  // --- Rendering ---
  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: 'flex', justifyContent: 'center' }}>
        <CircularProgress />
      </Container>
    );
  }

  if (!actor) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="warning">
          Please connect your wallet to view transaction history.
        </Alert>
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
      <Typography variant="h4" component="h1" gutterBottom>
        Transaction Log
      </Typography>

      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Complete history of all reputation awards and revocations
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
          sx={{ minWidth: 300 }}
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

      {/* Statistics */}
      <Box sx={{ mb: 3, display: 'flex', gap: 2 }}>
        <Chip
          label={`Total Transactions: ${transactions.length}`}
          variant="outlined"
        />
        <Chip
          label={`Filtered Results: ${filteredTransactions.length}`}
          variant="outlined"
        />
      </Box>

      {/* Transaction Table */}
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
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
            {paginatedTransactions.map((transaction) => (
              <TableRow key={transaction.id}>
                <TableCell>{transaction.id}</TableCell>
                <TableCell>
                  <Chip
                    label={getTransactionTypeText(transaction.transactionType)}
                    color={getTransactionTypeColor(transaction.transactionType)}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {formatPrincipal(transaction.from)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontFamily="monospace">
                    {formatPrincipal(transaction.to)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2" fontWeight="bold">
                    {transaction.amount}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {formatTimestamp(transaction.timestamp)}
                  </Typography>
                </TableCell>
                <TableCell>
                  <Typography variant="body2">
                    {transaction.reason || '-'}
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

      {filteredTransactions.length === 0 && !loading && (
        <Box sx={{ mt: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary">
            No transactions found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {searchTerm || typeFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'No transactions have been recorded yet'
            }
          </Typography>
        </Box>
      )}
    </Container>
  );
};

export default TransactionLog;
