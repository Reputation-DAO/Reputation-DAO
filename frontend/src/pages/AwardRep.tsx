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
<<<<<<< HEAD
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { getPlugActor } from '../components/canister/reputationDao';
import { Principal } from '@dfinity/principal';
=======
import {
  Star,
  Person,
  Send,
  History,
  TrendingUp,
  Info,
  EmojiEvents
} from '@mui/icons-material';

interface AwardTransaction {
  id: string;
  recipient: string;
  amount: number;
  reason: string;
  date: string;
  status: 'pending' | 'completed' | 'failed';
}
>>>>>>> advFrontend

const AwardRep: React.FC = () => {
  const [recipient, setRecipient] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [category, setCategory] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>({ open: false, message: '', severity: 'success' });

  // Mock recent awards data
  const [recentAwards] = useState<AwardTransaction[]>([
    {
      id: '1',
      recipient: 'alice.icp',
      amount: 100,
      reason: 'Excellent community contribution',
      date: '2024-01-15',
      status: 'completed'
    },
    {
      id: '2',
      recipient: 'bob.icp',
      amount: 75,
      reason: 'Bug fix and testing',
      date: '2024-01-14',
      status: 'completed'
    },
    {
      id: '3',
      recipient: 'charlie.icp',
      amount: 50,
      reason: 'Documentation improvements',
      date: '2024-01-13',
      status: 'pending'
    }
  ]);

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

<<<<<<< HEAD
    try {
      if (!userId || !points || isNaN(Number(points))) {
        throw new Error('Please enter a valid user ID and numeric points.');
      }

      const principal = Principal.fromText(userId.trim());
      const amount = BigInt(points.trim());

      const actor = await getPlugActor();
      const result = await actor.awardRep(
        principal,
        amount,
        reason.trim() === '' ? [] : [reason.trim()]
      );

      if (result.startsWith('Success')) {
        setSuccess(true);
        setUserId('');
        setPoints('');
        setReason('');
      } else {
        setError(result);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to award reputation.');
    } finally {
      setLoading(false);
=======
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
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
      setIsLoading(false);
    }, 2000);
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
>>>>>>> advFrontend
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
<<<<<<< HEAD
        <Stack spacing={3} alignItems="center">
          <Avatar
            sx={{
              bgcolor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              width: 64,
              height: 64,
            }}
          >
            <AccountCircleIcon fontSize="large" />
          </Avatar>

          <Typography
            variant="h5"
            fontWeight={600}
            sx={{ color: 'hsl(var(--foreground))' }}
          >
            Award Reputation
          </Typography>

          <form style={{ width: '100%' }} onSubmit={handleSubmit} autoComplete="off">
            <Stack spacing={2}>
              <TextField
                label="User Principal / ID"
                variant="outlined"
                fullWidth
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                InputLabelProps={{ sx: { color: 'hsl(var(--foreground))' } }}
                InputProps={{
                  sx: {
                    color: 'hsl(var(--foreground))',
                    backgroundColor: 'hsl(var(--muted))',
                    borderRadius: 2,
                    '& fieldset': { borderColor: 'hsl(var(--border))' },
                    '&:hover fieldset': { borderColor: 'hsl(var(--primary))' },
                    '&.Mui-focused fieldset': { borderColor: 'hsl(var(--primary))' },
                  },
                }}
              />

              <TextField
                label="Reputation Points"
                variant="outlined"
                fullWidth
                value={points}
                onChange={(e) => setPoints(e.target.value)}
                required
                type="number"
                inputProps={{ min: 1 }}
                InputLabelProps={{ sx: { color: 'hsl(var(--foreground))' } }}
                InputProps={{
                  sx: {
                    color: 'hsl(var(--foreground))',
                    backgroundColor: 'hsl(var(--muted))',
                    borderRadius: 2,
                    '& fieldset': { borderColor: 'hsl(var(--border))' },
                    '&:hover fieldset': { borderColor: 'hsl(var(--primary))' },
                    '&.Mui-focused fieldset': { borderColor: 'hsl(var(--primary))' },
                  },
                }}
              />

              <TextField
                label="Reason (Optional)"
                variant="outlined"
                fullWidth
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                multiline
                rows={3}
                placeholder="Why are you awarding these points?"
                InputLabelProps={{ sx: { color: 'hsl(var(--foreground))' } }}
                InputProps={{
                  sx: {
                    color: 'hsl(var(--foreground))',
                    backgroundColor: 'hsl(var(--muted))',
                    borderRadius: 2,
                    '& fieldset': { borderColor: 'hsl(var(--border))' },
                    '&:hover fieldset': { borderColor: 'hsl(var(--primary))' },
                    '&.Mui-focused fieldset': { borderColor: 'hsl(var(--primary))' },
                  },
                }}
              />

              {error && (
                <Typography color="error" variant="body2">
                  {error}
                </Typography>
              )}
              {success && (
                <Typography color="success.main" variant="body2">
                  Reputation awarded successfully!
                </Typography>
              )}

              <Button
                type="submit"
                variant="contained"
                size="large"
                disabled={loading}
                sx={{
                  mt: 1,
                  borderRadius: 2,
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                  '&:hover': {
                    backgroundColor: 'hsl(var(--accent))',
                    color: 'hsl(var(--accent-foreground))',
                  },
                }}
              >
                {loading ? 'Submitting...' : 'Submit'}
              </Button>
            </Stack>
          </form>
        </Stack>
      </Paper>
=======
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
>>>>>>> advFrontend
    </Box>
  );
};

export default AwardRep;
