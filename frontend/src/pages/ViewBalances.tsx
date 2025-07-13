import React, { useState, useEffect } from 'react';
import { Principal } from '@dfinity/principal';
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
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Tooltip,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  AccountBalanceWallet,
  Search,
  Person,
  TrendingUp,
  History,
  Refresh,
  Download,
  FilterList
} from '@mui/icons-material';
import { getPlugActor } from '../components/canister/reputationDao';

interface UserBalance {
  id: string;
  address: string;
  name: string;
  reputation: number;
  rank: number;
  change: string;
  lastActivity: string;
  status: 'active' | 'inactive';
}

interface BackendTransaction {
  id: bigint;
  transactionType: { Award: null } | { Revoke: null };
  from: Principal;
  to: Principal;
  amount: bigint;
  timestamp: bigint;
  reason: [] | [string];
}

const ViewBalances: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBalance, setSelectedBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [userBalances, setUserBalances] = useState<UserBalance[]>([]);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  // Real function to fetch balance from blockchain
  const fetchBalance = async (principalString: string): Promise<number> => {
    try {
      // Validate Principal format
      const principal = Principal.fromText(principalString);

      // Use getPlugActor to get actor instance
      const plugActor = await getPlugActor();
      if (!plugActor) {
        throw new Error('Failed to connect to blockchain');
      }

      const balance = await plugActor.getBalance(principal);
      return Number(balance);
    } catch (error) {
      console.error('Error fetching balance:', error);
      if (error instanceof Error && error.message.includes('Invalid principal')) {
        throw new Error('Invalid Principal ID format');
      }
      throw new Error('Failed to fetch balance from blockchain');
    }
  };

  // Load all balances from transaction history
  const loadAllBalances = async () => {
    try {
      setRefreshing(true);

      const plugActor = await getPlugActor();
      if (!plugActor) {
        console.log('No actor available');
        return;
      }

      console.log('Loading transaction history to calculate balances...');
      const transactions = await plugActor.getTransactionHistory() as BackendTransaction[];
      console.log('Raw transactions for balance calculation:', transactions);

      // Calculate balances from transaction history
      const balanceMap = new Map<string, number>();
      const activityMap = new Map<string, number>();

      transactions.forEach(tx => {
        const fromStr = tx.from.toString();
        const toStr = tx.to.toString();
        const amount = Number(tx.amount);
        const timestamp = Number(tx.timestamp) / 1000000; // Convert to milliseconds

        // Track latest activity
        if (!activityMap.has(fromStr) || activityMap.get(fromStr)! < timestamp) {
          activityMap.set(fromStr, timestamp);
        }
        if (!activityMap.has(toStr) || activityMap.get(toStr)! < timestamp) {
          activityMap.set(toStr, timestamp);
        }

        // Calculate balances
        if ('Award' in tx.transactionType) {
          // Award: to user gets reputation
          const currentBalance = balanceMap.get(toStr) || 0;
          balanceMap.set(toStr, currentBalance + amount);
        } else {
          // Revoke: from user loses reputation
          const currentBalance = balanceMap.get(fromStr) || 0;
          balanceMap.set(fromStr, Math.max(0, currentBalance - amount));
        }
      });

      // Convert to UserBalance array
      const userBalancesList: UserBalance[] = Array.from(balanceMap.entries())
        .map(([address, reputation], index) => ({
          id: (index + 1).toString(),
          address,
          name: `User ${address.slice(0, 8)}`,
          reputation,
          rank: 0, // Will be set after sorting
          change: '+0', // Could calculate from recent transactions
          lastActivity: activityMap.has(address) 
            ? new Date(activityMap.get(address)!).toLocaleDateString()
            : 'Never',
          status: (activityMap.has(address) && 
                   Date.now() - activityMap.get(address)! < 7 * 24 * 60 * 60 * 1000) 
                   ? 'active' as const 
                   : 'inactive' as const
        }))
        .sort((a, b) => b.reputation - a.reputation) // Sort by reputation descending
        .map((user, index) => ({ ...user, rank: index + 1 })); // Set ranks

      console.log('Processed user balances:', userBalancesList);
      setUserBalances(userBalancesList);

    } catch (error) {
      console.error('Error loading balances:', error);
      setSnackbar({
        open: true,
        message: 'Failed to load balances: ' + (error as Error).message,
        severity: 'error'
      });
    } finally {
      setRefreshing(false);
    }
  };

  // Load balances on component mount
  useEffect(() => {
    loadAllBalances();
  }, []);

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter a Principal ID to search',
        severity: 'warning'
      });
      return;
    }

    setIsLoading(true);
    setSelectedBalance(null);

    try {
      const balance = await fetchBalance(searchTerm.trim());
      setSelectedBalance(balance);
      
      setSnackbar({
        open: true,
        message: balance > 0 
          ? `Found ${balance} reputation points`
          : 'No reputation found for this Principal ID',
        severity: balance > 0 ? 'success' : 'info'
      });
    } catch (error) {
      console.error('Search error:', error);
      setSnackbar({
        open: true,
        message: (error as Error).message,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = () => {
    loadAllBalances();
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const getStatusColor = (status: string) => {
    return status === 'active' ? 'success' : 'default';
  };

  const getChangeColor = (change: string) => {
    if (change.startsWith('+')) return 'hsl(var(--primary))';
    if (change.startsWith('-')) return 'hsl(var(--destructive))';
    return 'hsl(var(--muted-foreground))';
  };

  const filteredBalances = userBalances.filter(user =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.address.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalReputation = userBalances.reduce((sum, user) => sum + user.reputation, 0);
  const activeUsers = userBalances.filter(user => user.status === 'active').length;

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
        <AccountBalanceWallet sx={{ color: 'hsl(var(--primary))' }} />
        View Balances
      </Typography>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Search Section */}
        <Box sx={{ flex: 1 }}>
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
                <Search sx={{ color: 'hsl(var(--primary))' }} />
                Search User Balance
              </Typography>

              <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end' }}>
                <TextField
                  fullWidth
                  label="Enter Address or Username"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="e.g. rdmx6-jaaaa-aaaah-qcaiq-cai"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
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

                <Button
                  variant="contained"
                  disabled={isLoading}
                  onClick={handleSearch}
                  startIcon={isLoading ? <CircularProgress size={16} /> : <Search />}
                  sx={{
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'hsl(var(--primary-foreground))',
                    px: 3,
                    py: 1.5,
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 600,
                    minWidth: 120,
                    '&:hover': {
                      backgroundColor: 'hsl(var(--primary))/90',
                    },
                    '&:disabled': {
                      backgroundColor: 'hsl(var(--muted))',
                    },
                  }}
                >
                  {isLoading ? 'Searching...' : 'Search'}
                </Button>
              </Box>

              {selectedBalance !== null && (
                <Box sx={{ 
                  mt: 3,
                  p: 3,
                  backgroundColor: 'hsl(var(--muted))',
                  borderRadius: 2,
                  border: '1px solid hsl(var(--border))',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexDirection: 'column',
                  gap: 1
                }}>
                  <Typography variant="h3" sx={{ 
                    color: 'hsl(var(--primary))',
                    fontWeight: 700
                  }}>
                    {selectedBalance}
                  </Typography>
                  <Typography variant="body1" sx={{ 
                    color: 'hsl(var(--muted-foreground))'
                  }}>
                    Reputation Points
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: 'hsl(var(--muted-foreground))'
                  }}>
                    for {searchTerm}
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>

        {/* Statistics */}
        <Box sx={{ width: { xs: '100%', lg: '300px' } }}>
          <Card sx={{ 
            backgroundColor: 'hsl(var(--card))',
            border: '1px solid hsl(var(--border))',
            borderRadius: 2,
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
            mb: 3
          }}>
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 3 
              }}>
                <Typography 
                  variant="h6" 
                  sx={{ 
                    color: 'hsl(var(--foreground))',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <TrendingUp sx={{ color: 'hsl(var(--primary))' }} />
                  Overview
                </Typography>
                <IconButton 
                  size="small" 
                  onClick={handleRefresh}
                  disabled={refreshing}
                  sx={{ color: 'hsl(var(--muted-foreground))' }}
                >
                  {refreshing ? <CircularProgress size={16} /> : <Refresh />}
                </IconButton>
              </Box>

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
                    Total Users
                  </Typography>
                  <Typography sx={{ 
                    color: 'hsl(var(--foreground))', 
                    fontWeight: 600 
                  }}>
                    {userBalances.length}
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
                    Active Users
                  </Typography>
                  <Typography sx={{ 
                    color: 'hsl(var(--primary))', 
                    fontWeight: 600 
                  }}>
                    {activeUsers}
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
                    Total Reputation
                  </Typography>
                  <Typography sx={{ 
                    color: 'hsl(var(--foreground))', 
                    fontWeight: 600 
                  }}>
                    {totalReputation.toLocaleString()} REP
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* User Balances Table */}
      <Card sx={{ 
        backgroundColor: 'hsl(var(--card))',
        border: '1px solid hsl(var(--border))',
        borderRadius: 2,
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
      }}>
        <CardContent sx={{ p: 3 }}>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 3 
          }}>
            <Typography 
              variant="h6" 
              sx={{ 
                color: 'hsl(var(--foreground))',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <History sx={{ color: 'hsl(var(--primary))' }} />
              Top Users ({filteredBalances.length})
            </Typography>
            
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Tooltip title="Filter">
                <IconButton size="small" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                  <FilterList />
                </IconButton>
              </Tooltip>
              <Tooltip title="Export">
                <IconButton size="small" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                  <Download />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

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
                    Rank
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'hsl(var(--foreground))', 
                    fontWeight: 600,
                    borderBottom: '1px solid hsl(var(--border))'
                  }}>
                    User
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'hsl(var(--foreground))', 
                    fontWeight: 600,
                    borderBottom: '1px solid hsl(var(--border))'
                  }}>
                    Reputation
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'hsl(var(--foreground))', 
                    fontWeight: 600,
                    borderBottom: '1px solid hsl(var(--border))'
                  }}>
                    Change
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'hsl(var(--foreground))', 
                    fontWeight: 600,
                    borderBottom: '1px solid hsl(var(--border))'
                  }}>
                    Last Activity
                  </TableCell>
                  <TableCell sx={{ 
                    color: 'hsl(var(--foreground))', 
                    fontWeight: 600,
                    borderBottom: '1px solid hsl(var(--border))'
                  }}>
                    Status
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredBalances.map((user) => (
                  <TableRow 
                    key={user.id}
                    sx={{ 
                      '&:hover': { 
                        backgroundColor: 'hsl(var(--card))' 
                      } 
                    }}
                  >
                    <TableCell sx={{ 
                      color: 'hsl(var(--foreground))',
                      fontWeight: 600,
                      borderBottom: '1px solid hsl(var(--border))'
                    }}>
                      #{user.rank}
                    </TableCell>
                    <TableCell sx={{ 
                      borderBottom: '1px solid hsl(var(--border))'
                    }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                        <Avatar sx={{ 
                          backgroundColor: 'hsl(var(--primary))',
                          color: 'hsl(var(--primary-foreground))',
                          width: 32,
                          height: 32
                        }}>
                          {user.name.charAt(0)}
                        </Avatar>
                        <Box>
                          <Typography sx={{ 
                            color: 'hsl(var(--foreground))',
                            fontWeight: 600
                          }}>
                            {user.name}
                          </Typography>
                          <Typography sx={{ 
                            color: 'hsl(var(--muted-foreground))',
                            fontSize: '0.875rem'
                          }}>
                            {user.address}
                          </Typography>
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'hsl(var(--primary))', 
                      fontWeight: 600,
                      borderBottom: '1px solid hsl(var(--border))'
                    }}>
                      {user.reputation.toLocaleString()} REP
                    </TableCell>
                    <TableCell sx={{ 
                      borderBottom: '1px solid hsl(var(--border))'
                    }}>
                      <Typography sx={{ 
                        color: getChangeColor(user.change),
                        fontWeight: 600
                      }}>
                        {user.change}
                      </Typography>
                    </TableCell>
                    <TableCell sx={{ 
                      color: 'hsl(var(--muted-foreground))',
                      borderBottom: '1px solid hsl(var(--border))'
                    }}>
                      {user.lastActivity}
                    </TableCell>
                    <TableCell sx={{ borderBottom: '1px solid hsl(var(--border))' }}>
                      <Chip
                        label={user.status}
                        color={getStatusColor(user.status) as any}
                        size="small"
                        sx={{ textTransform: 'capitalize' }}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

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

export default ViewBalances;
