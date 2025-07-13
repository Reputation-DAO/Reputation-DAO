import React, { useState, useEffect } from 'react';
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
  Tooltip,
  CircularProgress
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
import { getPlugActor } from '../components/canister/reputationDao';

// Backend transaction interface
interface BackendTransaction {
  id: bigint;
  transactionType: { Award: null } | { Revoke: null };
  from: Principal;
  to: Principal;
  amount: bigint;
  timestamp: bigint;
  reason: [] | [string];
}

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
  const [totalAwards, setTotalAwards] = useState(0);
  const [totalRepAwarded , setTotalRepAwarded] = useState(0);
  const [recentAwards, setRecentAwards] = useState<AwardTransaction[]>([]);
  const [loadingAwards, setLoadingAwards] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  // Load recent transactions on component mount
  useEffect(() => {
    loadRecentAwards();
  }, []);

  const loadRecentAwards = async () => {
    setLoadingAwards(true);
    try {
      console.log('🔄 Loading recent award transactions...');
      console.log('🔗 Getting Plug actor connection...');
      const actor = await getPlugActor();
      console.log('✅ Actor connected:', !!actor);
      
      console.log('📞 Calling getTransactionHistory()...');
      const transactions = await actor.getTransactionHistory() as BackendTransaction[];
      console.log('📊 Raw transactions received:', transactions);
      console.log('📊 Total transactions count:', transactions.length);
      
      // Check if transactions is an array
      if (!Array.isArray(transactions)) {
        console.warn('⚠️ Transactions is not an array:', transactions);
        setRecentAwards([]);
        return;
      }

      // Calcuate total REP awarded
      const totalRepAwarded = transactions.reduce((sum, tx) => {
        if (tx.transactionType && 'Award' in tx.transactionType) {
          return sum + Number(tx.amount);
        }
        return sum;
      }, 0);

      setTotalRepAwarded(totalRepAwarded);

      // Calculate total awards
      const totalAwards = transactions.filter(tx =>{
        return tx.transactionType && 'Award' in tx.transactionType;
      }).length;

      setTotalAwards(totalAwards);

      // Filter for award transactions and convert to frontend format
      const awardTransactions = transactions
        .filter(tx => {
          console.log('🔍 Checking transaction:', tx);
          return tx.transactionType && 'Award' in tx.transactionType;
        })
        .slice(-5) // Get last 5 awards
        .map(tx => {
          const timestamp = Number(tx.timestamp);
          const date = timestamp > 0 
            ? new Date(timestamp * 1000).toISOString().split('T')[0] // Convert from seconds to milliseconds
            : new Date().toISOString().split('T')[0];
            
          return {
            id: tx.id.toString(),
            recipient: tx.to.toString(),
            amount: Number(tx.amount),
            reason: (tx.reason && tx.reason.length > 0) ? tx.reason[0]! : 'No reason provided',
            date,
            status: 'completed'
          };
        })
        .reverse(); // Show newest first
      
      console.log('🎯 Filtered award transactions:', awardTransactions);
      console.log('🎯 Award transactions count:', awardTransactions.length);
      setRecentAwards(awardTransactions);
      
    } catch (error) {
      console.error('❌ Failed to load recent awards:', error);
      console.error('❌ Error details:', error);
      
      // Set empty array on error to prevent infinite loading
      setRecentAwards([]);
      
      setSnackbar({
        open: true,
        message: 'Failed to load recent awards from blockchain. The canister may be empty or connection failed.',
        severity: 'warning'
      });
    } finally {
      setLoadingAwards(false);
      console.log('🏁 loadRecentAwards completed');
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
        message: 'Invalid principal format. Please enter a valid ICP address.',
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
      console.log('🎯 Starting award submission...');
      console.log('🎯 Award details:', {
        recipient: recipientPrincipal.toString(),
        amount: amountBigInt.toString(),
        reason
      });

      console.log('🔗 Getting Plug actor for award...');
      const actor = await getPlugActor();
      console.log('✅ Actor connected for award:', !!actor);
      
      // Get current user principal for logging
      const currentPrincipal = await window.ic.plug.agent.getPrincipal();
      console.log('� Current user principal:', currentPrincipal.toString());
      
      console.log('�📞 Calling awardRep()...');
      const result = await actor.awardRep(recipientPrincipal, amountBigInt, [reason]);
      console.log('✅ Award result:', result);
      
      // Check if the result indicates an error
      if (typeof result === 'string' && result.startsWith('Error:')) {
        console.error('❌ Backend returned error:', result);
        setSnackbar({
          open: true,
          message: result,
          severity: 'error'
        });
        return;
      }
      
      console.log('✅ Award successful!');
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
      
      // Reload recent awards
      console.log('🔄 Reloading recent awards after successful award...');
      await loadRecentAwards();
      
    } catch (error: any) {
      console.error('❌ Award error:', error);
      console.error('❌ Error type:', typeof error);
      console.error('❌ Error message:', error.message);
      console.error('❌ Full error object:', error);
      
      let errorMessage = 'Failed to award reputation. Please try again.';
      
      // Handle specific error types
      if (error.message) {
        if (error.message.includes('Not a trusted awarder')) {
          errorMessage = 'You are not authorized to award reputation points. Only trusted awarders can perform this action.';
        } else if (error.message.includes('Daily mint cap exceeded')) {
          errorMessage = 'Daily minting limit exceeded. Please try again tomorrow.';
        } else if (error.message.includes('Cannot award rep to yourself')) {
          errorMessage = 'You cannot award reputation points to yourself.';
        } else {
          errorMessage = error.message;
        }
      }
      
      setSnackbar({
        open: true,
        message: errorMessage,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
      console.log('🏁 Award submission completed');
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
                    placeholder="Enter ICP address"
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
                    Total Awards
                  </Typography>
                  <Typography sx={{ 
                    color: 'hsl(var(--foreground))', 
                    fontWeight: 600 
                  }}>
                    {totalAwards}
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
                    Total REP Awarded
                  </Typography>
                  <Typography sx={{ 
                    color: 'hsl(var(--foreground))', 
                    fontWeight: 600 
                  }}>
                    {totalRepAwarded} REP
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
                  {loadingAwards ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                        <CircularProgress size={24} />
                        <Typography sx={{ mt: 1, color: 'hsl(var(--muted-foreground))' }}>
                          Loading recent awards...
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : recentAwards.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} sx={{ textAlign: 'center', py: 4 }}>
                        <Typography sx={{ color: 'hsl(var(--muted-foreground))' }}>
                          No recent awards found
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ) : (
                    recentAwards.map((award) => (
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
                    ))
                  )}
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
