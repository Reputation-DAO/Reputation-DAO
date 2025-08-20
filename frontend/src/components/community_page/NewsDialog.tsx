import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,

  Box,

} from '@mui/material';
import { useState } from 'react';

interface NewsletterDialogProps {
  open: boolean;
  onClose: () => void;
}


export default function NewsletterDialog({ open, onClose }: NewsletterDialogProps) {

  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = () => {
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!isValidEmail) {
      alert('Please enter a valid email address.');
      return;
    }
    setSubmitted(true);
    setTimeout(() => {
      onClose();
      setSubmitted(false);
      setEmail('');
    }, 1500);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          backgroundColor: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          borderRadius: 'var(--radius)',
          p: 0,
          minWidth: 400,
          maxWidth: 500,
          border: '1.5px solid hsl(var(--border))',
          boxShadow: 'var(--shadow-lg)',
          overflow: 'hidden',

        },
      }}
      aria-labelledby="newsletter-dialog-title"
    >

      <Box
        sx={{
          background: 'hsl(var(--primary))',
          py: 3,
          px: 4,
        }}
      >
        <DialogTitle id="newsletter-dialog-title" sx={{ p: 0 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 700,
              color: 'hsl(var(--primary-foreground))',
            }}
          >
            Join Our Newsletter
          </Typography>
        </DialogTitle>
      </Box>

      <DialogContent
        sx={{
          py: 4,
          px: 4,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        <Typography sx={{ color: 'hsl(var(--foreground))', fontSize: '0.95rem' }}>
          Stay updated with the latest news, insights, and updates. Enter your email below:
        </Typography>
        <TextField
          autoFocus
          fullWidth
          label="Email Address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          variant="outlined"
          InputProps={{
            sx: {
              borderRadius: 'var(--radius)',
              backgroundColor: 'hsl(var(--input))',
              color: 'hsl(var(--foreground))',
            },
          }}
        />

      </DialogContent>

      <DialogActions
        sx={{

          px: 4,
          py: 3,
          display: 'flex',
          justifyContent: 'flex-end',
          gap: 2,
          borderTop: '1px solid hsl(var(--border))',
        }}
      >
        <Button
          onClick={onClose}
          disabled={submitted}
          sx={{
            textTransform: 'none',
            color: 'hsl(var(--foreground))',
          }}
        >
          Cancel
        </Button>
        <Button
          onClick={handleSubscribe}
          disabled={submitted}
          variant="contained"
          sx={{
            textTransform: 'none',
            backgroundColor: 'hsl(var(--primary))',
            color: 'hsl(var(--primary-foreground))',
            '&:hover': {
              backgroundColor: 'hsl(var(--primary))',
              filter: 'brightness(1.1)',
            },
            borderRadius: 'var(--radius)',
            px: 3,
          }}
        >
          {submitted ? 'Subscribed!' : 'Subscribe'}
        </Button>
      </DialogActions>

    </Dialog>
  );
}
