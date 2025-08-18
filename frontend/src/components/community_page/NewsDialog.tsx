import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Typography,
} from '@mui/material';
import { useState } from 'react';

interface NewsletterDialogProps {
  open: boolean;
  onClose: () => void;
}

export default function NewsletterDialog({ open, onClose }: NewsletterDialogProps): JSX.Element {
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
          p: 4,
          minWidth: 380,
          border: '1.5px solid hsl(var(--border))',
          boxShadow: '0 10px 25px rgb(0 0 0 / 0.07)',
          transition: 'box-shadow 0.3s ease',
          '&:hover': {
            boxShadow: '0 14px 35px rgb(0 0 0 / 0.12)',
          },
        },
      }}
      aria-labelledby="newsletter-dialog-title"
    >
      <DialogTitle
        id="newsletter-dialog-title"
        sx={{
          fontWeight: 700,
          fontSize: '1.375rem',
          pb: 0,
          userSelect: 'none',
          textTransform: 'uppercase',
          letterSpacing: 1.5,
        }}
      >
        {submitted ? '✅ Subscribed Successfully' : 'Subscribe to our Newsletter'}
      </DialogTitle>

      <DialogContent sx={{ py: 3 }}>
        {!submitted ? (
          <TextField
            autoFocus
            fullWidth
            type="email"
            label="Email Address"
            variant="outlined"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            sx={{
              mt: 2,
              '& .MuiInputBase-root': {
                backgroundColor: 'hsl(var(--input))',
                borderRadius: 'var(--radius)',
                transition: 'box-shadow 0.25s ease',
                '&.Mui-focused': {
                  boxShadow: '0 0 8px 2px hsl(var(--primary) / 0.4)',
                },
              },
              '& .MuiInputLabel-root': {
                color: 'hsl(var(--muted-foreground))',
                fontWeight: 500,
              },
            }}
          />
        ) : (
          <Typography
            sx={{
              color: 'hsl(var(--success))',
              fontWeight: 600,
              mt: 3,
              textAlign: 'center',
              userSelect: 'none',
              animation: 'bounceIn 0.5s ease forwards',
            }}
          >
            🎉 Thank you! You’ll start receiving updates soon.
          </Typography>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          pt: 2,
          borderTop: '1px solid hsl(var(--border))',
          justifyContent: submitted ? 'center' : 'flex-end',
          gap: 1,
        }}
      >
        {!submitted && (
          <>
            <Button
              onClick={onClose}
              sx={{
                textTransform: 'none',
                color: 'hsl(var(--muted-foreground))',
                fontWeight: 600,
                px: 3,
                '&:hover': { backgroundColor: 'hsl(var(--muted) / 0.1)' },
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubscribe}
              variant="contained"
              sx={{
                textTransform: 'none',
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                fontWeight: 700,
                px: 4,
                py: 1.25,
                boxShadow: '0 4px 12px hsl(var(--primary) / 0.35)',
                transition: 'background-color 0.3s ease, box-shadow 0.3s ease',
                '&:hover': {
                  backgroundColor: 'hsl(var(--primary-hover))',
                  boxShadow: '0 6px 16px hsl(var(--primary) / 0.5)',
                },
                '&:active': {
                  transform: 'scale(0.97)',
                  boxShadow: '0 3px 8px hsl(var(--primary) / 0.4)',
                },
              }}
            >
              Submit
            </Button>
          </>
        )}
      </DialogActions>

      <style>{`
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: translateY(-10px);
          }
          100% {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </Dialog>
  );
}
