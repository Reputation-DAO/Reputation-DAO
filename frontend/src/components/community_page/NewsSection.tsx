import { useState } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import NewsletterDialog from './NewsDialog';

export default function NewsletterSection(): JSX.Element {
  const [open, setOpen] = useState(false);

  return (
    <Paper
      elevation={0}
      sx={{
        textAlign: 'center',
        p: { xs: 4, sm: 6 },
        borderRadius: 'var(--radius)',
        background: 'linear-gradient(145deg, hsl(var(--muted) / 0.2), hsl(var(--muted) / 0.05))',
        backdropFilter: 'var(--glass-blur)',
        border: 'var(--glass-border)',
        maxWidth: 900,
        mx: 'auto',
        mb: 14,
        '&:hover':{
        boxShadow: '0 8px 30px hsl(var(--primary) / 0.15)',
        border: '1px solid hsl(var(--primary))',
      }
      }}
    >
      <Typography
        variant="h3"
        sx={{
          fontWeight: 800,
          mb: 2,
          fontSize: { xs: '2rem', md: '2.5rem' },
          background: 'hsl(var(--foreground))',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
        }}
      >
        Stay Updated
      </Typography>

      <Typography
        sx={{
          color: 'hsl(var(--muted-foreground))',
          maxWidth: 600,
          mx: 'auto',
          mb: 4,
          fontSize: { xs: '1rem', md: '1.1rem' },
        }}
      >
        Join our newsletter for exclusive insights, governance updates, release announcements,
        and opportunities to make an impact in the Reputation DAO community.
      </Typography>

      <Button
        variant="contained"
        size="large"
        sx={{
          bgcolor: 'hsl(var(--primary))',
          color: 'white',
          px: 5,
          py: 1.4,
          fontSize: '1rem',
          fontWeight: 600,
          borderRadius: '999px',
          transition: 'all 0.3s ease',
          '&:hover': {
            bgcolor: 'black',
            transform: 'translateY(-2px)',
            boxShadow: '0 6px 20px hsl(var(--primary) / 0.3)',
            border: '1px solid hsl(var(--primary))',
          },
        }}
        onClick={() => setOpen(true)}
      >
        Subscribe Now
      </Button>

      <NewsletterDialog open={open} onClose={() => setOpen(false)} />
    </Paper>
  );
}
