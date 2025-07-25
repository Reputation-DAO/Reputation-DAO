
import React from 'react';

import { Box, Container, Typography, Paper } from '@mui/material';
import { ShieldCheck, Users, Layers ,Lock } from 'lucide-react';
import { GridLegacy as Grid } from '@mui/material';



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
    icon:<Lock style={{ color: 'hsl(var(--primary))' }} />,
    title: 'Permanent',
    desc: 'Once earned, your reputation is permanently recorded on-chain, providing a lasting record of your contributions.',
  }
];

export default function KeyFeatures() {
  return (
    <Box
      component="section"
      sx={{
        width: '100%',
        py: { xs: 2.5, md: 3.5 },
        bgcolor: 'hsl(var(--background))',
      }}
    >
      <Container maxWidth="lg" sx={{ px: 3 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 600,
            fontSize: { xs: '1.8rem', md: '2rem' },
            color: 'hsl(var(--foreground))',
            textAlign: 'left',
            mb: 6,
          }}
        >
          Why Reputation DAO?
        </Typography>

        <Grid container spacing={4} justifyContent="center">
          {features.map((item, idx) => (
            <Grid key={idx} item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Paper
                variant="outlined"
                sx={{
                  width: 260,
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
                    boxShadow: '0px 8px 30px rgba(0,0,0,0.05)',
                    transform: 'translateY(-3px)',
                    borderColor: 'hsl(var(--foreground) / 0.15)',
                  },
                }}
              >
                <Box sx={{ mb: 1 }}>
                  {React.cloneElement(item.icon, { size: 40 })}
                </Box>
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
                    mt: 0.5,
                    fontSize: 14,
                    px: 1,
                    color: 'hsl(var(--muted-foreground))',
                    lineHeight: 1.6,
                  }}
                >
                  {item.desc}
                </Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Container>
      <Box
      sx={{
        width: '100%',
        height: '1px',
        my: 4,
        background: 'linear-gradient(to right, transparent, hsl(var(--border)), transparent)',
      }}
    />
    </Box>
  );
}
