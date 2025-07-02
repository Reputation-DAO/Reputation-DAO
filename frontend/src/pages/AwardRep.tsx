import React, { useState } from 'react';
import { Typography, Box, Button, Stack, TextField, Avatar, Paper } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';

const AwardRep: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [points, setPoints] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    setError('');
    // TODO: Integrate with backend/ICP canister call here
    setTimeout(() => {
      setLoading(false);
      if (userId && points && !isNaN(Number(points))) {
        setSuccess(true);
        setUserId('');
        setPoints('');
      } else {
        setError('Please enter a valid User ID and numeric points.');
      }
    }, 1200);
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
      <Paper elevation={4} sx={{ p: 4, minWidth: 350, maxWidth: 400 }}>
        <Stack spacing={3} alignItems="center">
          <Avatar sx={{ bgcolor: 'primary.main', width: 56, height: 56 }}>
            <AccountCircleIcon fontSize="large" />
          </Avatar>
          <Typography variant="h5" fontWeight={600} color="primary.main">
            Award Reputation
          </Typography>
          <form style={{ width: '100%' }} onSubmit={handleSubmit} autoComplete="off">
            <Stack spacing={2}>
              <TextField
                label="User Principal/ID"
                variant="outlined"
                fullWidth
                value={userId}
                onChange={e => setUserId(e.target.value)}
                required
              />
              <TextField
                label="Reputation Points"
                variant="outlined"
                fullWidth
                value={points}
                onChange={e => setPoints(e.target.value)}
                required
                type="number"
                inputProps={{ min: 1 }}
              />
              {error && <Typography color="error" variant="body2">{error}</Typography>}
              {success && <Typography color="success.main" variant="body2">Reputation awarded successfully!</Typography>}
              <Button
                type="submit"
                variant="contained"
                color="primary"
                disabled={loading}
                size="large"
                sx={{ mt: 1 }}
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
