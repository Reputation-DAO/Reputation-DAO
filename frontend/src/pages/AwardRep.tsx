import React, { useState } from 'react';
import {
  Typography,
  Box,
  Button,
  Stack,
  TextField,
  Avatar,
  Paper,
} from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import { getPlugActor } from '../components/canister/reputationDao';
import { Principal } from '@dfinity/principal';

const AwardRep: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [points, setPoints] = useState('');
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');

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
    </Box>
  );
};

export default AwardRep;
