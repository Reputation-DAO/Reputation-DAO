import { useState, useCallback } from 'react';
import { Box, Typography, Paper, Button, LinearProgress } from '@mui/material';

export default function InteractivePoll() {
  const [votes, setVotes] = useState({ icpOnly: 2, multiCrypto: 0 });
  const [userVote, setUserVote] = useState<'icpOnly' | 'multiCrypto' | null>(null);

  const totalVotes = votes.icpOnly + votes.multiCrypto;
  const percentIcpOnly = totalVotes ? Math.round((votes.icpOnly / totalVotes) * 100) : 0;
  const percentMultiCrypto = totalVotes ? Math.round((votes.multiCrypto / totalVotes) * 100) : 0;

  const handleVote = useCallback(
    (option: 'icpOnly' | 'multiCrypto') => {
      if (userVote === option) return;

      setVotes((prev) => {
        const newVotes = { ...prev };
        if (userVote) newVotes[userVote] = Math.max(0, newVotes[userVote] - 1);
        newVotes[option] = (newVotes[option] || 0) + 1;
        return newVotes;
      });

      setUserVote(option);
    },
    [userVote]
  );

  const borderRadius = 5;

  return (
    <Box sx={{ mb: 14, textAlign: 'center', px: 1, maxWidth: 900, mx: 'auto' }}>
      <Typography
        variant="h4"
        sx={{
          fontWeight: 700,
          mb: 3,
          color: 'hsl(var(--foreground))',
          userSelect: 'none',
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        Community Poll
      </Typography>

      <Typography
        sx={{
          color: 'hsl(var(--muted-foreground))',
          mb: 6,
          fontSize: 16,
          userSelect: 'none',
          maxWidth: 480,
          mx: 'auto',
          lineHeight: 1.6,
          fontWeight: 500,
        }}
      >
        Should we accept ICP only as payment, or allow other cryptocurrencies too?
      </Typography>

      <Paper
        elevation={3}
        sx={{
          p: 10,
          display: 'flex',
          gap: 3,
          borderRadius: '10px',
          background: 'hsl(var(--background))',
          border: `1.5px solid hsl(var(--border))`,
          flexWrap: 'wrap',
          justifyContent: 'center',
          boxShadow:
            '0 8px 16px rgb(0 0 0 / 0.04), 0 1px 3px rgb(0 0 0 / 0.08)',
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow:
              '0 12px 24px rgb(0 0 0 / 0.1), 0 3px 8px rgb(0 0 0 / 0.12)',
          },
        }}
      >
        {/* ICP only option */}
        <Box sx={{ flex: '1 1 220px', minWidth: 220 }}>
          <Button
            fullWidth
            variant={userVote === 'icpOnly' ? 'contained' : 'outlined'}
            onClick={() => handleVote('icpOnly')}
            aria-pressed={userVote === 'icpOnly'}
            aria-label={`Vote for accepting ICP only as payment, currently at ${percentIcpOnly}%`}
            sx={{
              bgcolor: userVote === 'icpOnly' ? 'hsl(var(--primary))' : 'transparent',
              color: userVote === 'icpOnly' ? 'white' : 'hsl(var(--primary))',
              mb: 1,
              fontWeight: 700,
              fontSize: 16,
              py: 1.75,
              cursor: 'pointer',
              textTransform: 'none',
              borderRadius,
              borderWidth: 2,
              borderColor: 'hsl(var(--primary))',
              boxShadow: userVote === 'icpOnly' ? '0 2px 6px hsl(var(--primary) / 0.25)' : 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: userVote === 'icpOnly' ? 'hsl(var(--primary-hover))' : 'hsl(var(--primary) / 0.12)',
                boxShadow: userVote === 'icpOnly' ? '0 3px 8px hsl(var(--primary) / 0.35)' : '0 2px 6px hsl(var(--primary) / 0.12)',
              },
              '&:active': {
                transform: 'scale(0.97)',
              },
            }}
          >
            Accept ICP only ({percentIcpOnly}%)
          </Button>
          <LinearProgress
            variant="determinate"
            value={percentIcpOnly}
            sx={{
              height: 10,
              borderRadius,
              bgcolor: 'hsl(var(--muted-foreground))',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'hsl(var(--primary))',
                transition: 'width 0.5s ease-in-out',
                borderRadius,
              },
            }}
          />
        </Box>

        {/* Multiple cryptos option */}
        <Box sx={{ flex: '1 1 220px', minWidth: 220 }}>
          <Button
            fullWidth
            variant={userVote === 'multiCrypto' ? 'contained' : 'outlined'}
            onClick={() => handleVote('multiCrypto')}
            aria-pressed={userVote === 'multiCrypto'}
            aria-label={`Vote for allowing multiple cryptocurrencies as payment, currently at ${percentMultiCrypto}%`}
            sx={{
              bgcolor: userVote === 'multiCrypto' ? 'hsl(var(--accent))' : 'transparent',
              color: userVote === 'multiCrypto' ? 'white' : 'hsl(var(--accent))',
              mb: 1,
              fontWeight: 700,
              fontSize: 16,
              py: 1.75,
              cursor: 'pointer',
              textTransform: 'none',
              borderRadius,
              borderWidth: 2,
              borderColor: 'hsl(var(--accent))',
              boxShadow: userVote === 'multiCrypto' ? '0 2px 6px hsl(var(--accent) / 0.25)' : 'none',
              transition: 'all 0.3s ease',
              '&:hover': {
                bgcolor: userVote === 'multiCrypto' ? 'hsl(var(--accent-hover))' : 'hsl(var(--accent) / 0.12)',
                boxShadow: userVote === 'multiCrypto' ? '0 3px 8px hsl(var(--accent) / 0.35)' : '0 2px 6px hsl(var(--accent) / 0.12)',
              },
              '&:active': {
                transform: 'scale(0.97)',
              },
            }}
          >
            Allow other cryptos ({percentMultiCrypto}%)
          </Button>
          <LinearProgress
            variant="determinate"
            value={percentMultiCrypto}
            sx={{
              height: 10,
              borderRadius,
              bgcolor: 'hsl(var(--muted-foreground))',
              '& .MuiLinearProgress-bar': {
                backgroundColor: 'hsl(var(--accent))',
                transition: 'width 0.5s ease-in-out',
                borderRadius,
              },
            }}
          />
        </Box>
      </Paper>

      {userVote && (
        <Typography
          sx={{
            mt: 4,
            color: 'hsl(var(--primary))',
            fontWeight: 700,
            fontSize: 16,
            userSelect: 'none',
          }}
          role="alert"
        >
          Thanks for voting! 🎉 You voted for{' '}
          {userVote === 'icpOnly' ? 'Accept ICP only' : 'Allow other cryptos'}.
        </Typography>
      )}
      <Box
        sx={{
          width: '100%',
          height: '1px',
          my: 8,
          background: 'linear-gradient(to right, transparent, hsl(var(--border)), transparent)',
        }}
      />
    </Box>
  );
}
