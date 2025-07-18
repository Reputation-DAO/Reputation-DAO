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

interface BackendTransaction {
  id: bigint;
  transactionType: { Award: null } | { Revoke: null };
  from: Principal;
  to: Principal;
  amount: bigint;
  timestamp: bigint;
  reason: [] | [string];
}

interface Transaction {
  id: number;
  transactionType: { Award: null } | { Revoke: null };
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  reason: string;
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
      console.log('Actor:', actor); // Debug log
      if (!actor) {
        console.log('No actor available');
        setLoading(false);
        return;
      }
      
      try {
        setLoading(true);
        console.log('Fetching transaction history from actor...'); // Debug log
        const result = await actor.getTransactionHistory() as BackendTransaction[];
        console.log('Raw transaction result from actor:', result); // Debug log
        console.log('Number of transactions received:', result?.length || 0);
        
        if (!result || result.length === 0) {
          console.log('No transactions found in result');
          setTransactions([]);
          setError(null);
          setLoading(false);
          return;
        }
        
        // Convert backend data to frontend format
        const processedTransactions: Transaction[] = result.map((tx, index) => {
          console.log(`Processing transaction ${index}:`, tx);
          return {
            id: Number(tx.id),
            transactionType: tx.transactionType,
            from: tx.from.toString(),
            to: tx.to.toString(),
            amount: Number(tx.amount),
            timestamp: Number(tx.timestamp) / 1000000, // Convert nanoseconds to milliseconds
            reason: tx.reason.length > 0 ? tx.reason[0]! : ''
          };
        });
        
        console.log('Processed transactions:', processedTransactions);
        setTransactions(processedTransactions);
        setError(null);
      } catch (err) {
        console.error('Error fetching transactions:', err);
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

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(tx => 
        tx.from.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.to.toLowerCase().includes(searchTerm.toLowerCase()) ||
        tx.id.toString().includes(searchTerm) ||
        (tx.reason && tx.reason.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    // Type filter
    if (typeFilter !== 'all') {
      filtered = filtered.filter(tx => {
        if (typeFilter === 'award') return 'Award' in tx.transactionType;
        if (typeFilter === 'revoke') return 'Revoke' in tx.transactionType;
        return true;
      });
    }

    // Sorting
    filtered.sort((a, b) => {
      let aValue, bValue;
      
      switch (sortField) {
        case 'id':
          aValue = a.id;
          bValue = b.id;
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

      if (sortDirection === 'asc') {
        return aValue > bValue ? 1 : -1;
      } else {
        return aValue < bValue ? 1 : -1;
      }
    });

    setFilteredTransactions(filtered);
    setPage(1); // Reset to first page when filters change
  }, [transactions, searchTerm, typeFilter, sortField, sortDirection]);

  // Helper functions
  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp).toLocaleString(); // timestamp is already in milliseconds
  };

  const formatPrincipal = (principal: string): string => {
    if (principal.length <= 12) return principal;
    return `${principal.slice(0, 6)}...${principal.slice(-6)}`;
  };

  const getTransactionTypeColor = (type: Transaction['transactionType']): 'success' | 'error' => {
    return 'Award' in type ? 'success' : 'error';
  };

  const getTransactionTypeText = (type: Transaction['transactionType']): string => {
    return 'Award' in type ? 'Award' : 'Revoke';
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  // Pagination
  const startIndex = (page - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedTransactions = filteredTransactions.slice(startIndex, endIndex);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

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
