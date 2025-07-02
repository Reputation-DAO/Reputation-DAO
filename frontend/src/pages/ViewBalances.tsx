import React, { useState } from 'react';
import { Box, Paper, Stack, Typography, Avatar, TextField, Button } from '@mui/material';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

// TODO: Replace this with your actual canister call
async function fetchBalance(principal: string): Promise<number> {
  // Simulate API call
  // Replace with: await reputationDaoActor.getBalance(principal)
  if (principal === 'aaaa-bbbb-cccc') return 120;
  if (principal === 'dddd-eeee-ffff') return 80;
  return 0;
}

const ViewBalances: React.FC = () => {
  const [principal, setPrincipal] = useState('');
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetch = async () => {
    setLoading(true);
    setError(null);
    setBalance(null);
    try {
      const result = await fetchBalance(principal.trim());
      setBalance(result);
    } catch (e) {
      setError('Failed to fetch balance.');
    }
    setLoading(false);
  };

  return (
    <Box
      sx={{
        width: '100%',
        minHeight: 'calc(100vh - 64px)',
        marginLeft: '410px',
        marginTop: '85px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'flex-start',
        background: 'transparent',
        pt: 6,
      }}
    >
      <Paper elevation={4} sx={{ p: 4, minWidth: 350, maxWidth: 600 }}>
        <Stack spacing={3} alignItems="center">
          <Avatar sx={{ bgcolor: 'info.main', width: 56, height: 56 }}>
            <AccountBalanceWalletIcon fontSize="large" />
          </Avatar>
          <Typography variant="h5" fontWeight={600} color="info.main">
            View Balance
          </Typography>
          <TextField
            label="Enter Principal"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            fullWidth
            autoFocus
          />
          <Button
            variant="contained"
            color="info"
            onClick={handleFetch}
            disabled={loading || !principal.trim()}
            fullWidth
          >
            {loading ? 'Fetching...' : 'Get Balance'}
          </Button>
          {error && (
            <Typography color="error">{error}</Typography>
          )}
          {balance !== null && !error && (
            <Typography variant="h6" color="text.primary">
              Reputation: <b>{balance}</b>
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default ViewBalances;
