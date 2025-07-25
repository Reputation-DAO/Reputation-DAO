
import {
  Box,
  Button,
  Container,
  Typography,

  Paper,
  TextField,
} from '@mui/material';
import { Code2, FileText, HelpCircle, ShieldCheck } from 'lucide-react';
import { GridLegacy as Grid } from '@mui/material';

export default function CommunityPage() {
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
              height: 300,
              textAlign: 'center',
              px: 4,
              height:"500px"
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
                Join Discord / Telegram
              </Button>
              <Button variant="outlined" sx={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
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
          <Button variant="outlined" sx={{ borderColor: 'hsl(var(--border))', color: 'hsl(var(--foreground))' }}>
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
          {[
            { icon: <FileText />, label: 'Docs' },
            { icon: <Code2 />, label: 'GitHub' },
            { icon: <FileText />, label: 'Tutorials / Blog' },
            { icon: <HelpCircle />, label: 'FAQ' },
            { icon: <ShieldCheck />, label: 'Governance Guidelines' },
          ].map((item, idx) => (
            <Grid item xs={6} md={2} key={idx}>
              <Paper
                variant="outlined"
                sx={{
                  p: 3,
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
          <TextField
            placeholder="Your@email"
            sx={{
              bgcolor: 'hsl(var(--background))',
              border: '1px solid hsl(var(--border))',
              borderRadius: 'var(--radius)',
              color: 'hsl(var(--foreground))',
              '& input': { p: 1.5, color: 'hsl(var(--foreground))' },
              mr: 2,
            }}
          />
          <Button variant="contained" sx={{ bgcolor: 'hsl(var(--primary))', color: 'white' }}>
            Subscribe
          </Button>
        </Box>

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
