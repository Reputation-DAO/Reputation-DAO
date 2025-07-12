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
<<<<<<< HEAD
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { Principal } from '@dfinity/principal';
import { getPlugActor } from '../components/canister/reputationDao';

const ViewBalances: React.FC = () => {
  const [principal, setPrincipal] = useState('');
  const [balance, setBalance] = useState<bigint | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setBalance(null);
    try {
      const actor = await getPlugActor();
      const result = await actor.getBalance(Principal.fromText(principal.trim()));
      setBalance(result);
    } catch (e: any) {
      console.error(e);
      setError('Failed to fetch balance.');
    } finally {
      setLoading(false);
=======
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

// TODO: Replace this with your actual canister call
async function fetchBalance(principal: string): Promise<number> {
  if (principal === 'aaaa-bbbb-cccc') return 120;
  if (principal === 'dddd-eeee-ffff') return 80;
  if (principal === 'alice.icp') return 1250;
  if (principal === 'bob.icp') return 980;
  return 0;
}

const ViewBalances: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedBalance, setSelectedBalance] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  // Mock user balances data
  const [userBalances] = useState<UserBalance[]>([
    {
      id: '1',
      address: 'alice.icp',
      name: 'Alice Johnson',
      reputation: 1250,
      rank: 1,
      change: '+15',
      lastActivity: '2024-01-15',
      status: 'active'
    },
    {
      id: '2',
      address: 'bob.icp',
      name: 'Bob Smith',
      reputation: 980,
      rank: 2,
      change: '+12',
      lastActivity: '2024-01-14',
      status: 'active'
    },
    {
      id: '3',
      address: 'carol.icp',
      name: 'Carol Davis',
      reputation: 850,
      rank: 3,
      change: '-5',
      lastActivity: '2024-01-12',
      status: 'active'
    },
    {
      id: '4',
      address: 'david.icp',
      name: 'David Wilson',
      reputation: 720,
      rank: 4,
      change: '+8',
      lastActivity: '2024-01-11',
      status: 'inactive'
    },
    {
      id: '5',
      address: 'eve.icp',
      name: 'Eve Brown',
      reputation: 650,
      rank: 5,
      change: '+3',
      lastActivity: '2024-01-10',
      status: 'active'
    }
  ]);

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
      const balance = await fetchBalance(searchTerm.trim());
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
    } catch (error) {
      setSnackbar({
        open: true,
        message: 'Failed to fetch balance',
        severity: 'error'
      });
    } finally {
      setIsLoading(false);
>>>>>>> advFrontend
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    // Simulate refresh API call
    setTimeout(() => {
      setRefreshing(false);
      setSnackbar({
        open: true,
        message: 'Balances refreshed successfully',
        severity: 'success'
      });
    }, 2000);
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
<<<<<<< HEAD
              },
            }}
            InputProps={{
              sx: {
                color: 'hsl(var(--foreground))',
                backgroundColor: 'hsl(var(--muted))',
                borderRadius: 2,
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
            }}
          />

          <Button
            type="button"
            onClick={handleFetch}
            disabled={loading || !principal.trim()}
            fullWidth
            sx={{
              mt: 1,
              py: 1.25,
              fontWeight: 600,
              borderRadius: 2,
              fontSize: '0.95rem',
              backgroundColor: 'hsl(var(--info))',
              color: 'hsl(var(--primary-foreground))',
              transition: 'all var(--transition-smooth)',
              '&:hover': {
                backgroundColor: 'hsl(var(--accent))',
                color: 'hsl(var(--accent-foreground))',
              },
              '&.Mui-disabled': {
                opacity: 0.6,
                backgroundColor: 'hsl(var(--muted))',
                color: 'hsl(var(--muted-foreground))',
              },
            }}
          >
            {loading ? 'Fetching...' : 'Get Balance'}
          </Button>

          {error && (
            <Typography color="error" variant="body2">
              {error}
=======
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}
            >
              <History sx={{ color: 'hsl(var(--primary))' }} />
              Top Users ({filteredBalances.length})
>>>>>>> advFrontend
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

<<<<<<< HEAD
          {balance !== null && !error && (
            <Typography variant="h6" sx={{ color: 'hsl(var(--foreground))' }}>
              Reputation: <b>{balance.toString()}</b>
            </Typography>
          )}
        </Stack>
      </Paper>
=======
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
>>>>>>> advFrontend
    </Box>
  );
};

export default ViewBalances;
