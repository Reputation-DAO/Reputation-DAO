import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Paper,
  Tooltip,
  Alert,
  LinearProgress,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  TrendingDown as TrendingDownIcon,
  TrendingUp as TrendingUpIcon,
  Remove as RevokeIcon,
  Refresh as RefreshIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import { useRole } from '../../contexts/RoleContext';
import {
  getTransactionHistory,
  getTransactionsByUser,
  type Transaction,
  type TransactionType,
} from '../canister/reputationDao';

interface DecayTransactionFilterProps {
  className?: string;
  userId?: string; // Optional - if provided, shows only this user's transactions
  showOnlyDecay?: boolean; // If true, only shows decay transactions
}

const DecayTransactionFilter: React.FC<DecayTransactionFilterProps> = ({ 
  className, 
  userId, 
  showOnlyDecay = false 
}) => {
  const { currentPrincipal, isAdmin } = useRole();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filter states
  const [typeFilter, setTypeFilter] = useState<TransactionType | 'All'>('All');
  const [dateRange, setDateRange] = useState<string>('all'); // 'day', 'week', 'month', 'all'
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    fetchTransactions();
  }, [currentPrincipal, userId]);

  useEffect(() => {
    applyFilters();
  }, [transactions, typeFilter, dateRange, searchTerm, showOnlyDecay]);

  const fetchTransactions = async () => {
    setLoading(true);
    setError(null);

    try {
      let txs: Transaction[];
      
      if (userId && currentPrincipal) {
        // Get specific user's transactions
        txs = await getTransactionsByUser(currentPrincipal);
      } else if (isAdmin) {
        // Admin can see all transactions
        txs = await getTransactionHistory();
      } else if (currentPrincipal) {
        // Regular users see only their own transactions
        txs = await getTransactionsByUser(currentPrincipal);
      } else {
        txs = [];
      }

      setTransactions(txs);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to fetch transaction history');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Filter by transaction type
    if (showOnlyDecay) {
      filtered = filtered.filter(tx => tx.transactionType === 'Decay');
    } else if (typeFilter !== 'All') {
      filtered = filtered.filter(tx => tx.transactionType === typeFilter);
    }

    // Filter by date range
    const now = Date.now() / 1000;
    const ranges = {
      day: 86400,
      week: 604800,
      month: 2592000,
    };

    if (dateRange !== 'all' && ranges[dateRange as keyof typeof ranges]) {
      const cutoff = now - ranges[dateRange as keyof typeof ranges];
      filtered = filtered.filter(tx => tx.timestamp >= cutoff);
    }

    // Filter by search term (reason or amount)
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(tx => 
        tx.reason?.toLowerCase().includes(term) ||
        tx.amount.toString().includes(term)
      );
    }

    // Sort by timestamp (newest first)
    filtered.sort((a, b) => b.timestamp - a.timestamp);

    setFilteredTransactions(filtered);
  };

  const getTransactionIcon = (type: TransactionType) => {
    switch (type) {
      case 'Award':
        return <TrendingUpIcon color="success" />;
      case 'Revoke':
        return <RevokeIcon color="error" />;
      case 'Decay':
        return <ScheduleIcon color="warning" />;
      default:
        return <TrendingDownIcon />;
    }
  };

  const getTransactionColor = (type: TransactionType) => {
    switch (type) {
      case 'Award':
        return 'success';
      case 'Revoke':
        return 'error';
      case 'Decay':
        return 'warning';
      default:
        return 'default';
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  const formatPrincipal = (principal: any) => {
    const str = principal.toString();
    return `${str.slice(0, 5)}...${str.slice(-3)}`;
  };

  const exportToCSV = () => {
    const csvContent = [
      ['Date', 'Type', 'From', 'To', 'Amount', 'Reason'],
      ...filteredTransactions.map(tx => [
        formatDate(tx.timestamp),
        tx.transactionType,
        formatPrincipal(tx.from),
        formatPrincipal(tx.to),
        tx.amount.toString(),
        tx.reason || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transactions-${showOnlyDecay ? 'decay-' : ''}${Date.now()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const decayCount = transactions.filter(tx => tx.transactionType === 'Decay').length;
  const totalDecayAmount = transactions
    .filter(tx => tx.transactionType === 'Decay')
    .reduce((sum, tx) => sum + tx.amount, 0);

  return (
    <Card className={className}>
      <CardHeader
        title={
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <TrendingDownIcon />
            <Typography variant="h6">
              {showOnlyDecay ? 'Decay' : 'Transaction'} History
            </Typography>
            {decayCount > 0 && (
              <Chip 
                label={`${decayCount} decay events`} 
                size="small" 
                color="warning" 
                variant="outlined"
              />
            )}
          </Box>
        }
        action={
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Tooltip title="Export to CSV">
              <IconButton onClick={exportToCSV} size="small">
                <DownloadIcon />
              </IconButton>
            </Tooltip>
            <Tooltip title="Refresh">
              <IconButton onClick={fetchTransactions} size="small">
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>
        }
      />
      <CardContent>
        {/* Filters */}
        {!showOnlyDecay && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Type</InputLabel>
              <Select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value as TransactionType | 'All')}
                label="Type"
              >
                <MenuItem value="All">All Types</MenuItem>
                <MenuItem value="Award">Awards</MenuItem>
                <MenuItem value="Revoke">Revocations</MenuItem>
                <MenuItem value="Decay">Decay</MenuItem>
              </Select>
            </FormControl>

            <FormControl size="small" sx={{ minWidth: 120 }}>
              <InputLabel>Period</InputLabel>
              <Select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                label="Period"
              >
                <MenuItem value="all">All Time</MenuItem>
                <MenuItem value="day">Last Day</MenuItem>
                <MenuItem value="week">Last Week</MenuItem>
                <MenuItem value="month">Last Month</MenuItem>
              </Select>
            </FormControl>

            <TextField
              size="small"
              label="Search"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by reason or amount"
              sx={{ minWidth: 200 }}
            />
          </Box>
        )}

        {/* Decay Statistics */}
        {decayCount > 0 && (
          <Alert severity="info" sx={{ mb: 3 }}>
            <Typography variant="body2">
              <strong>{decayCount}</strong> decay events found, 
              totaling <strong>{totalDecayAmount}</strong> points decayed
            </Typography>
          </Alert>
        )}

        {/* Loading State */}
        {loading && <LinearProgress sx={{ mb: 2 }} />}

        {/* Error State */}
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Transactions Table */}
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>From</TableCell>
                <TableCell>To</TableCell>
                <TableCell align="right">Amount</TableCell>
                <TableCell>Reason</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    <Typography variant="body2" color="text.secondary">
                      {loading ? 'Loading...' : 'No transactions found'}
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx.id} hover>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {formatDate(tx.timestamp)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {getTransactionIcon(tx.transactionType)}
                        <Chip
                          label={tx.transactionType}
                          size="small"
                          color={getTransactionColor(tx.transactionType) as any}
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {formatPrincipal(tx.from)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
                        {formatPrincipal(tx.to)}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography 
                        variant="body2" 
                        color={tx.transactionType === 'Award' ? 'success.main' : 
                               tx.transactionType === 'Decay' ? 'warning.main' : 'error.main'}
                        sx={{ fontWeight: 'bold' }}
                      >
                        {tx.transactionType === 'Award' ? '+' : '-'}{tx.amount}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                        {tx.reason || '-'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {filteredTransactions.length > 0 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
            Showing {filteredTransactions.length} of {transactions.length} transactions
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default DecayTransactionFilter;
