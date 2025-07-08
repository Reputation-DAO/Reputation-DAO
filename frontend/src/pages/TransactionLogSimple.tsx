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

interface Transaction {
  id: number;
  transactionType: { Award: null } | { Revoke: null };
  from: string;
  to: string;
  amount: number;
  timestamp: number;
  reason: string[] | [];
}

const TransactionLogSimple: React.FC = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for testing - load immediately
    const mockTransactions: Transaction[] = [
      {
        id: 1,
        transactionType: { Award: null },
        from: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
        to: 'rrkah-fqaaa-aaaah-qcaiq-cai',
        amount: 10,
        timestamp: Math.floor(Date.now() / 1000) - 3600,
        reason: ['Good trading behavior']
      },
      {
        id: 2,
        transactionType: { Revoke: null },
        from: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
        to: 'rrkah-fqaaa-aaaah-qcaiq-cai',
        amount: 5,
        timestamp: Math.floor(Date.now() / 1000) - 1800,
        reason: ['Violation of rules']
      },
      {
        id: 3,
        transactionType: { Award: null },
        from: 'rdmx6-jaaaa-aaaah-qcaiq-cai',
        to: 'abc12-3def4-5ghi6-7jkl8-9mno0',
        amount: 15,
        timestamp: Math.floor(Date.now() / 1000) - 7200,
        reason: ['Excellent community contribution']
      }
    ];

    // Load immediately, no artificial delay
    setTransactions(mockTransactions);
    setLoading(false);
  }, []);

  const formatTimestamp = (timestamp: number): string => {
    return new Date(timestamp * 1000).toLocaleString();
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
          transition: 'background-color var(--transition-smooth), color var(--transition-smooth)',
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
        transition: 'background-color var(--transition-smooth), color var(--transition-smooth)',
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
          color: 'hsl(var(--foreground))',
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

          <Typography
            variant="h4"
            component="h1"
            textAlign="center"
            fontWeight={600}
            sx={{ color: 'hsl(var(--foreground))' }}
          >
            Transaction Log
          </Typography>

          <Typography
            variant="body1"
            textAlign="center"
            sx={{ 
              color: 'hsl(var(--muted-foreground))',
              maxWidth: 600,
              mx: 'auto'
            }}
          >
            Complete history of all reputation awards and revocations
          </Typography>

          <Alert 
            severity="info" 
            sx={{ 
              width: '100%',
              backgroundColor: 'hsla(var(--primary), 0.1)',
              color: 'hsl(var(--foreground))',
              borderColor: 'hsl(var(--border))',
              '& .MuiAlert-icon': {
                color: 'hsl(var(--primary))',
              },
            }}
          >
            This is a test version with mock data. Connect to the canister to see real transactions.
          </Alert>

          {transactions.length === 0 ? (
            <Box sx={{ mt: 4, textAlign: 'center', width: '100%' }}>
              <Typography variant="h6" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                No transactions found
              </Typography>
            </Box>
          ) : (
            <Box sx={{ width: '100%', overflowX: 'auto' }}>
              <TableContainer 
                component={Paper}
                sx={{
                  backgroundColor: 'hsl(var(--card))',
                  borderRadius: 2,
                  border: '1px solid hsl(var(--border))',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <Table sx={{ minWidth: { xs: 650, md: 750 } }}>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: 'hsl(var(--muted))' }}>
                      <TableCell sx={{ 
                        color: 'hsl(var(--foreground))', 
                        fontWeight: 600,
                        borderColor: 'hsl(var(--border))'
                      }}>
                        ID
                      </TableCell>
                      <TableCell sx={{ 
                        color: 'hsl(var(--foreground))', 
                        fontWeight: 600,
                        borderColor: 'hsl(var(--border))'
                      }}>
                        Type
                      </TableCell>
                      <TableCell sx={{ 
                        color: 'hsl(var(--foreground))', 
                        fontWeight: 600,
                        borderColor: 'hsl(var(--border))'
                      }}>
                        From
                      </TableCell>
                      <TableCell sx={{ 
                        color: 'hsl(var(--foreground))', 
                        fontWeight: 600,
                        borderColor: 'hsl(var(--border))'
                      }}>
                        To
                      </TableCell>
                      <TableCell sx={{ 
                        color: 'hsl(var(--foreground))', 
                        fontWeight: 600,
                        borderColor: 'hsl(var(--border))'
                      }}>
                        Amount
                      </TableCell>
                      <TableCell sx={{ 
                        color: 'hsl(var(--foreground))', 
                        fontWeight: 600,
                        borderColor: 'hsl(var(--border))'
                      }}>
                        Timestamp
                      </TableCell>
                      <TableCell sx={{ 
                        color: 'hsl(var(--foreground))', 
                        fontWeight: 600,
                        borderColor: 'hsl(var(--border))'
                      }}>
                        Reason
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {transactions.map((transaction, index) => (
                      <TableRow 
                        key={transaction.id}
                        sx={{
                          backgroundColor: index % 2 === 0 
                            ? 'hsl(var(--card))' 
                            : 'hsla(var(--muted), 0.3)',
                          '&:hover': {
                            backgroundColor: 'hsla(var(--primary), 0.1)',
                          },
                          transition: 'background-color var(--transition-smooth)',
                        }}
                      >
                        <TableCell sx={{ 
                          color: 'hsl(var(--foreground))',
                          borderColor: 'hsl(var(--border))',
                          fontWeight: 500
                        }}>
                          {transaction.id}
                        </TableCell>
                        <TableCell sx={{ borderColor: 'hsl(var(--border))' }}>
                          <Chip
                            label={getTransactionTypeText(transaction.transactionType)}
                            color={getTransactionTypeColor(transaction.transactionType)}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              ...(getTransactionTypeColor(transaction.transactionType) === 'success' && {
                                backgroundColor: 'hsla(var(--primary), 0.2)',
                                color: 'hsl(var(--primary))',
                              }),
                              ...(getTransactionTypeColor(transaction.transactionType) === 'error' && {
                                backgroundColor: 'hsla(var(--destructive), 0.3)',
                                color: 'hsl(var(--foreground))', // Changed to foreground color for better visibility
                              }),
                            }}
                          />
                        </TableCell>
                        <TableCell sx={{ borderColor: 'hsl(var(--border))' }}>
                          <Typography 
                            variant="body2" 
                            fontFamily="monospace"
                            sx={{ 
                              color: 'hsl(var(--muted-foreground))',
                              fontSize: '0.75rem'
                            }}
                          >
                            {formatPrincipal(transaction.from)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ borderColor: 'hsl(var(--border))' }}>
                          <Typography 
                            variant="body2" 
                            fontFamily="monospace"
                            sx={{ 
                              color: 'hsl(var(--muted-foreground))',
                              fontSize: '0.75rem'
                            }}
                          >
                            {formatPrincipal(transaction.to)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ borderColor: 'hsl(var(--border))' }}>
                          <Typography 
                            variant="body2" 
                            fontWeight="bold"
                            sx={{ color: 'hsl(var(--foreground))' }}
                          >
                            {transaction.amount}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ borderColor: 'hsl(var(--border))' }}>
                          <Typography 
                            variant="body2"
                            sx={{ 
                              color: 'hsl(var(--muted-foreground))',
                              fontSize: '0.75rem'
                            }}
                          >
                            {formatTimestamp(transaction.timestamp)}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ borderColor: 'hsl(var(--border))' }}>
                          <Typography 
                            variant="body2"
                            sx={{ 
                              color: 'hsl(var(--foreground))',
                              maxWidth: 200,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap'
                            }}
                          >
                            {transaction.reason.length > 0 ? transaction.reason[0] : '-'}
                          </Typography>
                        </TableCell>
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
