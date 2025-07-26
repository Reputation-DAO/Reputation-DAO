// @ts-nocheck
import {
  Box,
  Button,
  Container,
  Typography,
  Paper,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Grid,
} from '@mui/material';
import { useState } from 'react';
import {
  Code2,
  FileText,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';

export default function CommunityPage() {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = () => {
  const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  if (!isValidEmail) {
    alert("Please enter a valid email address.");
    return;
  }

  setSubmitted(true);
  setTimeout(() => {
    setOpen(false);
    setSubmitted(false);
    setEmail('');
  }, 1500);
};

const linkItems = [
  { icon: <FileText />, label: 'Docs', href: '/docs' },
  { icon: <Code2 />, label: 'GitHub', href: 'https://github.com/Reputation-DAO/Reputaion-DAO' },
  { icon: <FileText />, label: 'Blog', href: '/blog' },
  { icon: <HelpCircle />, label: 'FAQ', href: '/' },
  { icon: <ShieldCheck />, label: 'Core Idea', href: 'https://docs.google.com/document/d/1e03vreMKph3KPX-g8-jlbIAlD8D3PvA8VXPbZNIrT-0/edit?tab=t.0' },
];

  return (
    <Box sx={{ bgcolor: 'hsl(var(--background))', color: 'hsl(var(--foreground))', py: 12 }}>
      <Container maxWidth="lg">
        {/* Hero Section */}
        <Paper
          variant="outlined"
          sx={{
            borderRadius: 'var(--radius)',
            borderColor: 'hsl(var(--border))',
            overflow: 'hidden',
            mb: 12,
            bgcolor: 'hsl(var(--background))',
          }}
        >
          <Box
            sx={{
              bgcolor: 'hsl(var(--muted))',
              backgroundImage: 'url(/your-banner.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              textAlign: 'center',
              px: 4,
              height: '500px',
            }}
          >
            <Typography
              variant="h3"
              sx={{ fontWeight: 700, mb: 2, color: 'hsl(var(--foreground))' }}
            >
              Join the Reputation DAO Community
            </Typography>
            <Typography sx={{ color: 'hsl(var(--muted-foreground))', maxWidth: 500 }}>
              Contribute, collaborate, and shape the future of decentralized reputation.
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 4 }}>
              <Button variant="contained" sx={{ bgcolor: 'hsl(var(--primary))', color: 'white' }}>
                Join Telegram
              </Button>
              <Button
                variant="outlined"
                sx={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
              >
                Follow on X (Twitter)
              </Button>
            </Box>
          </Box>
        </Paper>

        {/* Call to Action */}
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 12 }}>
          <Button variant="contained" sx={{ bgcolor: 'hsl(var(--primary))', color: 'white' }}>
            Star on GitHub
          </Button>
          <Button
            variant="outlined"
            sx={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}
          >
            Explore the Ecosystem
          </Button>
        </Box>

        {/* Community Resources */}
        <Typography
          variant="h5"
          sx={{ mb: 4, fontWeight: 600, color: 'hsl(var(--foreground))' }}
        >
          Community Resources
        </Typography>

        <Grid container spacing={3} justifyContent="center" sx={{ mb: 14 }}>
        {linkItems.map((item, idx) => (
          <Grid item xs={6} md={2} key={idx}>
            <a
              href={item.href}
              target={item.href.startsWith('http') ? '_blank' : '_self'}
              rel="noopener noreferrer"
              style={{ textDecoration: 'none' }}
            >
              <Paper
                variant="outlined"
                sx={{
                  px: 3,
                  py: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: 1.5,
                  bgcolor: 'hsl(var(--muted))',
                  color: 'hsl(var(--foreground))',
                  borderColor: 'hsl(var(--border))',
                  borderRadius: 'var(--radius)',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: '0.2s ease',
                  '&:hover': {
                    bgcolor: 'hsl(var(--background))',
                    boxShadow: '0px 8px 20px rgba(0,0,0,0.05)',
                    transform: 'translateY(-2px)',
                  },
                }}
              >
                {item.icon}
                <Typography sx={{ fontSize: 14, fontWeight: 500 }}>
                  {item.label}
                </Typography>
              </Paper>
            </a>
          </Grid>
        ))}
      </Grid>

        {/* Contributions */}
        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Community Contributions
        </Typography>
        <Typography sx={{ color: 'hsl(var(--muted-foreground))', mb: 10 }}>
          There are many ways to contribute to Reputation DAO. You can submit pull requests,
          participate in discussions, share ideas, or provide feedback. We also have guidelines for
          becoming a trusted awarder or contributor within our community.
        </Typography>

        <Typography variant="h5" sx={{ fontWeight: 600, mb: 2 }}>
          Open Source Ethos
        </Typography>
        <Typography sx={{ color: 'hsl(var(--muted-foreground))', mb: 14 }}>
          Reputation DAO is built on the principles of decentralization, transparency, and open
          governance. Our mission is to empower individuals and communities through decentralized
          reputation systems. "The power of the Web3 community lies in its collaborative spirit and
          commitment to open source principles."
        </Typography>

        {/* Newsletter */}
        <Typography
          variant="h4"
          sx={{
            fontWeight: 700,
            textAlign: 'center',
            mb: 2,
            color: 'hsl(var(--foreground))',
          }}
        >
          Stay Updated
        </Typography>
        <Typography
          sx={{
            color: 'hsl(var(--muted-foreground))',
            textAlign: 'center',
            maxWidth: 500,
            mx: 'auto',
            mb: 4,
          }}
        >
          Sign up for our newsletter to receive updates on governance changes, new releases, and
          opportunities to contribute.
        </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'center', mb: 14 }}>
          <Button
            variant="contained"
            sx={{ bgcolor: 'hsl(var(--primary))', color: 'white', px: 4, py: 1.2 }}
            onClick={() => setOpen(true)}
          >
            Subscribe
          </Button>
        </Box>

        {/* Newsletter Popup */}
        <Dialog
          open={open}
          onClose={() => setOpen(false)}
          PaperProps={{
            sx: {
              backgroundColor: 'hsl(var(--background))',
              color: 'hsl(var(--foreground))',
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-lg)',
              p: 3,
              minWidth: 360,
              transition: 'var(--transition-smooth)',
              border: '1px solid hsl(var(--border))',
            },
          }}
        >
          <DialogTitle
            sx={{
              fontWeight: 700,
              fontSize: '1.25rem',
              pb: 0,
              color: 'hsl(var(--foreground))',
            }}
          >
            {submitted ? '✅ Subscribed Successfully' : 'Subscribe to our Newsletter'}
          </DialogTitle>

          <DialogContent sx={{ py: 2 }}>
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
                  mt: 1.5,
                  '& .MuiInputBase-root': {
                    backgroundColor: 'hsl(var(--input))',
                    borderRadius: 'var(--radius)',
                  },
                  '& .MuiInputLabel-root': {
                    color: 'hsl(var(--muted-foreground))',
                  },
                  '& .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'hsl(var(--border))',
                  },
                  '&:hover .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'hsl(var(--primary))',
                  },
                  '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                    borderColor: 'hsl(var(--primary))',
                  },
                }}
              />
            ) : (
              <Typography
                sx={{
                  color: 'hsl(var(--success))',
                  fontWeight: 500,
                  mt: 1.5,
                }}
              >
                🎉 Thank you! You’ll start receiving updates soon.
              </Typography>
            )}
          </DialogContent>

          <DialogActions
            sx={{
              pt: 1.5,
              borderTop: '1px solid hsl(var(--border))',
              justifyContent: submitted ? 'center' : 'flex-end',
            }}
          >
            {!submitted && (
              <>
                <Button
                  onClick={() => setOpen(false)}
                  sx={{
                    textTransform: 'none',
                    color: 'hsl(var(--muted-foreground))',
                    fontWeight: 500,
                    px: 2,
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
                    fontWeight: 600,
                    px: 3,
                    borderRadius: 'var(--radius)',
                    '&:hover': {
                      backgroundColor: 'hsl(var(--primary) / 0.9)',
                    },
                  }}
                >
                  Submit
                </Button>
              </>
            )}
          </DialogActions>
        </Dialog>




        {/* Footer */}
        <Box
          sx={{
            borderTop: '1px solid hsl(var(--border))',
            pt: 8,
            textAlign: 'center',
            color: 'hsl(var(--muted-foreground))',
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 3 }}>
            <Typography variant="body2">Community</Typography>
            <Typography variant="body2">Docs</Typography>
            <Typography variant="body2">GitHub</Typography>
            <Typography variant="body2">Blog</Typography>
            <Typography variant="body2">FAQ</Typography>
          </Box>
          <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
            <Typography variant="body2">🐦</Typography>
            <Typography variant="body2">💬</Typography>
            <Typography variant="body2">📢</Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
            © 2024 Reputation DAO. All rights reserved.
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
