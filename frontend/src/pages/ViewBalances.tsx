import React, { useState } from 'react';
import {
  Box,
  Paper,
  Stack,
  Typography,
  Avatar,
  TextField,
  Button,
} from '@mui/material';
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
    }
  };

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
          maxWidth: 500,
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
              bgcolor: 'hsl(var(--info))',
              color: 'hsl(var(--primary-foreground))',
              width: 64,
              height: 64,
            }}
          >
            <AccountBalanceWalletIcon fontSize="large" />
          </Avatar>

          <Typography
            variant="h5"
            fontWeight={600}
            sx={{ color: 'hsl(var(--foreground))' }}
          >
            View Balance
          </Typography>

          <TextField
            label="Enter Principal"
            value={principal}
            onChange={(e) => setPrincipal(e.target.value)}
            fullWidth
            autoFocus
            InputLabelProps={{
              sx: {
                color: 'hsl(var(--foreground))',
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
            </Typography>
          )}

          {balance !== null && !error && (
            <Typography variant="h6" sx={{ color: 'hsl(var(--foreground))' }}>
              Reputation: <b>{balance.toString()}</b>
            </Typography>
          )}
        </Stack>
      </Paper>
    </Box>
  );
};

export default ViewBalances;
