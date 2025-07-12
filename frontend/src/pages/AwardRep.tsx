import React, { useState } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Alert,
  Snackbar,
  InputAdornment,
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
  IconButton,
  Tooltip
} from '@mui/material';
import {
  EmojiEvents,
  Send,
  Person,
  Star,
  TrendingUp,
  History,
  Info
} from '@mui/icons-material';
import { Principal } from '@dfinity/principal';
import { reputationService } from '../components/canister/reputationDao';

interface AwardTransaction {
  id: string;
  recipient: string;
  amount: number;
  reason: string;
  date: string;
  status: string;
}

const AwardRep: React.FC = () => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [recentAwards, setRecentAwards] = useState<AwardTransaction[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  // Load recent transactions on component mount
  React.useEffect(() => {
    loadRecentTransactions();
  }, []);

  // Test function to debug the service
  const testService = async () => {
    try {
      console.log('Testing reputation service...');
      await reputationService.testConnection();
      console.log('Service test passed');
      
      const count = await reputationService.getTransactionCount();
      console.log('Transaction count:', count);
      
      const transactions = await reputationService.getTransactionHistory();
      console.log('All transactions:', transactions);
      
      setSnackbar({
        open: true,
        message: `Service test passed. Found ${transactions.length} transactions.`,
        severity: 'success'
      });
    } catch (error: any) {
      console.error('Service test failed:', error);
      setSnackbar({
        open: true,
        message: `Service test failed: ${error.message}`,
        severity: 'error'
      });
    }
  };

  const loadRecentTransactions = async () => {
    try {
      console.log('Loading recent transactions from reputationService...');
      const transactions = await reputationService.getTransactionHistory();
      console.log('Raw transactions from service:', transactions);
      
      // Convert backend transactions to UI format and get last 5
      const recentTxs = transactions
        .filter(tx => {
          console.log('Checking transaction type:', tx.transactionType);
          return 'Award' in tx.transactionType;
        })
        .slice(-5)
        .map((tx) => {
          console.log('Processing transaction:', tx);
          return {
            id: tx.id.toString(),
            recipient: tx.to.toString(),
            amount: Number(tx.amount),
            reason: tx.reason.length > 0 ? tx.reason[0]! : 'No reason provided',
            date: new Date(Number(tx.timestamp) / 1000000).toISOString().split('T')[0],
            status: 'completed'
          };
        })
        .reverse();
      
      console.log('Processed recent transactions:', recentTxs);
      setRecentAwards(recentTxs);
    } catch (error) {
      console.error('Failed to load recent transactions:', error);
      // Keep empty array on error
    }
  };

  const handleAwardSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!recipient || !amount || !reason) {
      setSnackbar({
        open: true,
        message: 'Please fill in all required fields',
        severity: 'warning'
      });
      return;
    }

    // Validate principal format
    let recipientPrincipal: Principal;
    try {
      recipientPrincipal = Principal.fromText(recipient);
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Invalid principal format',
        severity: 'error'
      });
      return;
    }

    const amountBigInt = BigInt(amount);
    if (amountBigInt <= 0) {
      setSnackbar({
        open: true,
        message: 'Amount must be greater than 0',
        severity: 'error'
      });
      return;
    }

    setIsLoading(true);

    try {
      console.log('About to award reputation with params:', {
        recipient: recipientPrincipal.toString(),
        amount: amountBigInt.toString(),
        reason
      });
      
      const result = await reputationService.awardReputation(
        recipientPrincipal,
        amountBigInt,
        reason
      );
      
      console.log('Award result:', result);

      setSnackbar({
        open: true,
        message: `Successfully awarded ${amount} reputation points to ${recipient}`,
        severity: 'success'
      });
      
      // Reset form
      setRecipient('');
      setAmount('');
      setReason('');
      setCategory('');
      
      // Reload recent transactions
      await loadRecentTransactions();
      
    } catch (error: any) {
      console.error('Award error:', error);
      setSnackbar({
        open: true,
        message: error.message || 'Failed to award reputation',
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
        <EmojiEvents sx={{ color: 'hsl(var(--primary))' }} />
        Award Reputation
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Award Form */}
        <Box sx={{ flex: 1 }}>
          <Card sx={{ 
            backgroundColor: 'hsl(var(--muted))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3, 
                  color: 'hsl(var(--foreground))',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <Send sx={{ color: 'hsl(var(--primary))' }} />
                Award Reputation Points
              </Typography>

              <Box component="form" onSubmit={handleAwardSubmit}>
                <Box
                  sx={{
                    display: 'grid',
                    gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' },
                    gap: 3,
                    mb: 3,
                  }}
                >
                  <TextField
                    fullWidth
                    label="Recipient Address"
                    value={recipient}
                    onChange={(e) => setRecipient(e.target.value)}
                    placeholder="Enter ICP address or username"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Person sx={{ color: 'hsl(var(--muted-foreground))' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'hsl(var(--background))',
                        '& fieldset': {
                          borderColor: 'hsl(var(--border))',
                        },
                        '&:hover fieldset': {
                          borderColor: 'hsl(var(--primary))',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'hsl(var(--primary))',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'hsl(var(--muted-foreground))',
                      },
                      '& .MuiInputBase-input': {
                        color: 'hsl(var(--foreground))',
                      },
                    }}
                  />

                  <TextField
                    fullWidth
                    label="Reputation Amount"
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Enter amount"
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <Star sx={{ color: 'hsl(var(--muted-foreground))' }} />
                        </InputAdornment>
                      ),
                    }}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        backgroundColor: 'hsl(var(--background))',
                        '& fieldset': {
                          borderColor: 'hsl(var(--border))',
                        },
                        '&:hover fieldset': {
                          borderColor: 'hsl(var(--primary))',
                        },
                        '&.Mui-focused fieldset': {
                          borderColor: 'hsl(var(--primary))',
                        },
                      },
                      '& .MuiInputLabel-root': {
                        color: 'hsl(var(--muted-foreground))',
                      },
                      '& .MuiInputBase-input': {
                        color: 'hsl(var(--foreground))',
                      },
                    }}
                  />
                </Box>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel sx={{ color: 'hsl(var(--muted-foreground))' }}>Category</InputLabel>
                  <Select
                    value={category}
                    label="Category"
                    onChange={(e) => setCategory(e.target.value)}
                    sx={{
                      backgroundColor: 'hsl(var(--background))',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'hsl(var(--border))',
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'hsl(var(--primary))',
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'hsl(var(--primary))',
                      },
                      '& .MuiSelect-select': {
                        color: 'hsl(var(--foreground))',
                      },
                    }}
                  >
                    <MenuItem value="development">Development</MenuItem>
                    <MenuItem value="community">Community</MenuItem>
                    <MenuItem value="governance">Governance</MenuItem>
                    <MenuItem value="documentation">Documentation</MenuItem>
                    <MenuItem value="testing">Testing</MenuItem>
                    <MenuItem value="other">Other</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Reason for Award"
                  multiline
                  rows={3}
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Explain why this person deserves reputation points"
                  sx={{
                    mb: 3,
                    '& .MuiOutlinedInput-root': {
                      backgroundColor: 'hsl(var(--background))',
                      '& fieldset': {
                        borderColor: 'hsl(var(--border))',
                      },
                      '&:hover fieldset': {
                        borderColor: 'hsl(var(--primary))',
                      },
                      '&.Mui-focused fieldset': {
                        borderColor: 'hsl(var(--primary))',
                      },
                    },
                    '& .MuiInputLabel-root': {
                      color: 'hsl(var(--muted-foreground))',
                    },
                    '& .MuiInputBase-input': {
                      color: 'hsl(var(--foreground))',
                    },
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  disabled={isLoading}
                  startIcon={<EmojiEvents />}
                  sx={{
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    px: 4,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    fontSize: '1rem',
                    mr: 2,
                    '&:hover': {
                      backgroundColor: 'hsl(var(--primary))/90',
                    },
                    '&:disabled': {
                      backgroundColor: 'hsl(var(--muted))',
                    },
                  }}
                >
                  {isLoading ? 'Awarding...' : 'Award Reputation'}
                </Button>

                <Button
                  type="button"
                  variant="outlined"
                  onClick={testService}
                  sx={{
                    borderColor: 'hsl(var(--border))',
                    color: 'hsl(var(--foreground))',
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    '&:hover': {
                      borderColor: 'hsl(var(--primary))',
                      backgroundColor: 'hsl(var(--muted))',
                    },
                  }}
                >
                  Test Service
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Box>

        {/* Award Summary */}
        <Box sx={{ width: { xs: '100%', lg: '300px' } }}>
          <Card sx={{ 
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            mb: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <Typography 
                variant="h6" 
                sx={{ 
                  mb: 3, 
                  color: 'hsl(var(--foreground))',
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 1
                }}
              >
                <TrendingUp sx={{ color: 'hsl(var(--primary))' }} />
                Award Summary
              </Typography>

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  p: 2,
                  backgroundColor: 'hsl(var(--muted))',
                  borderRadius: 1,
                  border: '1px solid hsl(var(--border))'
                }}>
                  <Typography sx={{ color: 'hsl(var(--muted-foreground))' }}>
                    Available Balance
                  </Typography>
                  <Typography sx={{ 
                    color: 'hsl(var(--primary))', 
                    fontWeight: 600 
                  }}>
                    1,250 REP
                  </Typography>
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  p: 2,
                  backgroundColor: 'hsl(var(--muted))',
                  borderRadius: 1,
                  border: '1px solid hsl(var(--border))'
                }}>
                  <Typography sx={{ color: 'hsl(var(--muted-foreground))' }}>
                    Awards This Month
                  </Typography>
                  <Typography sx={{ 
                    color: 'hsl(var(--foreground))', 
                    fontWeight: 600 
                  }}>
                    15
                  </Typography>
                </Box>

                <Box sx={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  p: 2,
                  backgroundColor: 'hsl(var(--muted))',
                  borderRadius: 1,
                  border: '1px solid hsl(var(--border))'
                }}>
                  <Typography sx={{ color: 'hsl(var(--muted-foreground))' }}>
                    Total Awarded
                  </Typography>
                  <Typography sx={{ 
                    color: 'hsl(var(--foreground))', 
                    fontWeight: 600 
                  }}>
                    3,450 REP
                  </Typography>
                </Box>
              </Box>

              <Alert 
                severity="info" 
                sx={{ 
                  mt: 2,
                  backgroundColor: 'rgba(33, 150, 243, 0.1)',
                  border: '1px solid rgba(33, 150, 243, 0.2)',
                  '& .MuiAlert-message': {
                    color: 'hsl(var(--foreground))'
                  }
                }}
              >
                <Typography variant="body2">
                  Tip: Include detailed reasons to help build trust in the reputation system.
                </Typography>
              </Alert>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Recent Awards */}
      <Box sx={{ mt: 3 }}>
        <Card sx={{ 
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 2,
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}>
          <CardContent sx={{ p: 3 }}>
            <Typography 
              variant="h6" 
              sx={{ 
                mb: 3, 
                color: 'hsl(var(--foreground))',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <History sx={{ color: 'hsl(var(--primary))' }} />
              Recent Awards
            </Typography>

            <TableContainer component={Paper} sx={{ 
              backgroundColor: 'hsl(var(--muted))',
              boxShadow: 'none',
              border: '1px solid hsl(var(--border))'
            }}>
              <Table>
                <TableHead>
                  <TableRow sx={{ backgroundColor: 'hsl(var(--card))' }}>
                    <TableCell sx={{ 
                      color: 'hsl(var(--foreground))', 
                      fontWeight: 600,
                      borderBottom: '1px solid hsl(var(--border))'
                    }}>
                      Recipient
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'hsl(var(--foreground))', 
                      fontWeight: 600,
                      borderBottom: '1px solid hsl(var(--border))'
                    }}>
                      Amount
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'hsl(var(--foreground))', 
                      fontWeight: 600,
                      borderBottom: '1px solid hsl(var(--border))'
                    }}>
                      Reason
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'hsl(var(--foreground))', 
                      fontWeight: 600,
                      borderBottom: '1px solid hsl(var(--border))'
                    }}>
                      Date
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'hsl(var(--foreground))', 
                      fontWeight: 600,
                      borderBottom: '1px solid hsl(var(--border))'
                    }}>
                      Status
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'hsl(var(--foreground))', 
                      fontWeight: 600,
                      borderBottom: '1px solid hsl(var(--border))'
                    }}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {recentAwards.map((award) => (
                    <TableRow 
                      key={award.id}
                      sx={{ 
                        '&:hover': { 
                          backgroundColor: 'hsl(var(--card))' 
                        } 
                      }}
                    >
                      <TableCell sx={{ 
                        color: 'hsl(var(--foreground))',
                        borderBottom: '1px solid hsl(var(--border))'
                      }}>
                        {award.recipient}
                      </TableCell>
                      <TableCell sx={{ 
                        color: 'hsl(var(--primary))', 
                        fontWeight: 600,
                        borderBottom: '1px solid hsl(var(--border))'
                      }}>
                        {award.amount} REP
                      </TableCell>
                      <TableCell sx={{ 
                        color: 'hsl(var(--muted-foreground))',
                        borderBottom: '1px solid hsl(var(--border))',
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {award.reason}
                      </TableCell>
                      <TableCell sx={{ 
                        color: 'hsl(var(--muted-foreground))',
                        borderBottom: '1px solid hsl(var(--border))'
                      }}>
                        {award.date}
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        <Chip
                          label={award.status}
                          color={getStatusColor(award.status) as any}
                          size="small"
                          sx={{ textTransform: 'capitalize' }}
                        />
                      </TableCell>
                      <TableCell sx={{ borderBottom: '1px solid hsl(var(--border))' }}>
                        <Tooltip title="View Details">
                          <IconButton 
                            size="small"
                            sx={{ color: 'hsl(var(--muted-foreground))' }}
                          >
                            <Info />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </CardContent>
        </Card>
      </Box>

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

export default AwardRep;
