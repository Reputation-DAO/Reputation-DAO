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
import { Principal } from '@dfinity/principal';
import { reputationService } from '../components/canister/reputationDao';

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

// Real backend function to fetch balance
async function fetchBalance(principal: string): Promise<number> {
  try {
    console.log('Fetching balance for principal:', principal);
    const principalObj = Principal.fromText(principal);
    const balance = await reputationService.getBalance(principalObj);
    console.log('Raw balance from backend:', balance);
    return Number(balance);
  } catch (error: any) {
    console.error('Error fetching balance:', error);
    throw new Error(`Failed to fetch balance: ${error.message || 'Invalid principal or network error'}`);
  }
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

  // Load transaction data to build user list
  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    setRefreshing(true);
    try {
      console.log('Testing canister connection...');
      
      // First test the connection
      try {
        await reputationService.testConnection();
        console.log('Connection test passed');
      } catch (connectionError: any) {
        console.error('Connection failed:', connectionError);
        setSnackbar({
          open: true,
          message: `Connection failed: ${connectionError.message}`,
          severity: 'error'
        });
        setUserBalances([]);
        return;
      }

      console.log('Loading user data from blockchain...');
      const transactions = await reputationService.getTransactionHistory();
      console.log('Received transactions:', transactions);
      
      if (!transactions || transactions.length === 0) {
        console.log('No transactions found');
        setSnackbar({
          open: true,
          message: 'No transactions found on the blockchain',
          severity: 'info'
        });
        setUserBalances([]);
        return;
      }

      // Build user list from transaction history
      const userMap = new Map<string, UserBalance>();
      
      transactions.forEach((tx, index) => {
        const principalStr = tx.to.toString();
        const existing = userMap.get(principalStr);
        
        if (existing) {
          // Update existing user
          if ('Award' in tx.transactionType) {
            existing.reputation += Number(tx.amount);
          } else if ('Revoke' in tx.transactionType) {
            existing.reputation -= Number(tx.amount);
          }
          existing.lastActivity = new Date(Number(tx.timestamp) / 1000000).toISOString().split('T')[0];
        } else {
          // Create new user entry
          const reputation = 'Award' in tx.transactionType ? Number(tx.amount) : 
                           'Revoke' in tx.transactionType ? -Number(tx.amount) : 0;
          userMap.set(principalStr, {
            id: (index + 1).toString(),
            address: principalStr,
            name: `User ${principalStr.slice(0, 8)}...`,
            reputation: reputation,
            rank: 0, // Will be set after sorting
            change: '+0',
            lastActivity: new Date(Number(tx.timestamp) / 1000000).toISOString().split('T')[0],
            status: 'active' as const
          });
        }
      });

      // Convert to array and sort by reputation
      const users = Array.from(userMap.values())
        .sort((a, b) => b.reputation - a.reputation)
        .map((user, index) => ({
          ...user,
          rank: index + 1
        }));

      console.log('Processed users:', users);
      setUserBalances(users);
      
      if (users.length > 0) {
        setSnackbar({
          open: true,
          message: `Loaded ${users.length} users with ${transactions.length} transactions`,
          severity: 'success'
        });
      }
    } catch (error: any) {
      console.error('Failed to load user data:', error);
      setSnackbar({
        open: true,
        message: `Failed to load data from blockchain: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
      setUserBalances([]);
    } finally {
      setRefreshing(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      setSnackbar({
        open: true,
        message: 'Please enter an address to search',
        severity: 'warning'
      });
      return;
    }

    setIsLoading(true);
    setSelectedBalance(null);

    try {
      console.log('Searching for balance of:', searchTerm.trim());
      const balance = await fetchBalance(searchTerm.trim());
      console.log('Found balance:', balance);
      
      setSelectedBalance(balance);
      
      if (balance === 0) {
        setSnackbar({
          open: true,
          message: 'No reputation found for this address',
          severity: 'info'
        });
      } else {
        setSnackbar({
          open: true,
          message: `Found ${balance} reputation points`,
          severity: 'success'
        });
      }
    } catch (error: any) {
      console.error('Search error:', error);
      setSnackbar({
        open: true,
        message: `Failed to fetch balance: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      console.log('Refreshing data...');
      await loadUserData();
      // Note: loadUserData now shows its own success/error messages
    } catch (error: any) {
      console.error('Refresh error:', error);
      setSnackbar({
        open: true,
        message: `Failed to refresh balances: ${error.message || 'Unknown error'}`,
        severity: 'error'
      });
    } finally {
      setRefreshing(false);
    }
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
                  placeholder="e.g. alice.icp or aaaa-bbbb-cccc"
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
