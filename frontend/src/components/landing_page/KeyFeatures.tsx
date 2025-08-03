import React from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  Grid as MuiGrid,
} from '@mui/material';
import {
  ShieldCheck,
  Users,
  Layers,
  Lock,
  TrendingUp,
  Zap,
} from 'lucide-react';

const features = [
  {
    icon: <ShieldCheck style={{ color: 'hsl(var(--primary))' }} />,
    title: 'Immutable',
    desc: 'Built on blockchain, your reputation cannot be tampered with or erased. Every action you take remains secure and transparent.',
  },
  {
    icon: <Users style={{ color: 'hsl(var(--primary))' }} />,
    title: 'Decentralized',
    desc: 'No single entity controls your reputation. Ownership stays with the user, aligned with web3 principles of freedom and transparency.',
  },
  {
    icon: <Layers style={{ color: 'hsl(var(--primary))' }} />,
    title: 'Interoperable',
    desc: 'Your reputation seamlessly integrates across platforms, enhancing trust and consistency wherever you participate.',
  },
  {
    icon: <Lock style={{ color: 'hsl(var(--primary))' }} />,
    title: 'Permanent',
    desc: 'Once earned, your reputation is permanently recorded on-chain, providing a lasting record of your contributions.',
  },
  {
    icon: <TrendingUp style={{ color: 'hsl(var(--primary))' }} />,
    title: 'Earnable',
    desc: 'Reputation isn’t given — it’s earned. Every action, contribution, or endorsement boosts your on-chain identity.',
  },
  {
    icon: <Zap style={{ color: 'hsl(var(--primary))' }} />,
    title: 'Synergistic',
    desc: 'Works alongside DAOs, platforms, and ecosystems to supercharge governance, rewards, and trust without extra friction.',
  },
];

export default function KeyFeatures() {
  return (
    <Box
      component="section"
      sx={{
        width: '100%',
        py: { xs: 6, md: 8 },
        bgcolor: 'hsl(var(--background))',
      }}
    >
      <Container maxWidth="lg" sx={{ px: { xs: 2, md: 3 } }}>
        <Typography
  variant="h3"
  sx={{
    fontWeight: 800,
    fontSize: { xs: '2.5rem', md: '3rem' },
    textAlign: 'center',
    color: 'hsl(var(--foreground))',
    mb: { xs: 8, md: 12 },
    letterSpacing: '-0.75px',
    lineHeight: 1.2,
    position: 'relative',
  }}
>
          Why Reputation DAO?
        </Typography>

        <MuiGrid container spacing={6} justifyContent="center">
          {features.map((item, index) => (
            <MuiGrid
              item
              xs={12}
              sm={6}
              md={4}
              key={index}
              sx={{ display: 'flex', justifyContent: 'center' }}
            >
              <Paper
                variant="outlined"
                sx={{
                  width: 300,
                  height: 260,
                  p: 3,
                  borderRadius: 'var(--radius)',
                  borderColor: 'hsl(var(--border))',
                  backgroundColor: 'hsl(var(--background))',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'center',
                  alignItems: 'center',
                  textAlign: 'center',
                  gap: 2,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0px 8px 30px rgba(0,0,0,0.06)',
                    transform: 'translateY(-3px)',
                    borderColor: 'hsl(var(--foreground))',
                  },
                }}
              >
                <Box>{React.cloneElement(item.icon, { size: 40 })}</Box>
                <Typography
                  sx={{
                    fontWeight: 600,
                    color: 'hsl(var(--foreground))',
                    fontSize: 18,
                  }}
                >
                  {item.title}
                </Typography>
                <Typography
                  sx={{
                    fontSize: 14,
                    px: 1,
                    color: 'hsl(var(--muted-foreground))',
                    lineHeight: 1.6,
                  }}
                >
                  {item.desc}
                </Typography>
              </Paper>
            </MuiGrid>
          ))}
        </MuiGrid>

        <Box
          sx={{
            width: '100%',
            height: '1px',
            my: 6,
            background:
              'linear-gradient(to right, transparent, hsl(var(--border)), transparent)',
          }}
        />
      </Container>
    </Box>
  );
}
