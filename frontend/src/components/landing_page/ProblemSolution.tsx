
import { Box, Container, Typography, Stack, Paper } from '@mui/material';
import { AlertTriangle, CheckCircle } from 'lucide-react';

export default function ProblemSolution() {
  return (
    <Box component="section" sx={{ width: '100%', py: { xs: 5, md: 7 }, bgcolor: 'hsl(var(--background))' }}>
      <Container maxWidth="lg" sx={{ textAlign: 'center', px: 3 }}>
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
          Problem vs. Solution
        </Typography>


        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={{ xs: 4, md: 6 }}
          justifyContent="center"
        >
          {[  
            {
              icon: <AlertTriangle size={20} style={{ color: 'hsl(var(--destructive))' }} />,
              title: 'The Problem',
              desc: 'Reputation today is controlled by centralized platforms. It is opaque, prone to bias, easily manipulated, and offers no verifiable transparency to its users. These systems are vulnerable to censorship, data loss, and manipulation from centralized authorities.',
            },
            {
              icon: <CheckCircle size={20} style={{ color: 'hsl(var(--primary))' }} />,
              title: 'Our Solution',
              desc: 'Reputation DAO offers a decentralized, transparent, and immutable reputation protocol built on ICP. Your reputation is tamper-proof, censorship-resistant, and entirely verifiable — putting ownership and trust where it belongs: with the user and the community.',
            },
          ].map((item, idx) => (
            <Paper
              key={idx}
              variant="outlined"
              sx={{
                flex: 1,
                px: { xs: 2, md: 3 },
                py: { xs: 1.5, md: 2 },
                borderRadius: 'var(--radius)',
                borderColor: 'hsl(var(--border))',
                backgroundColor: 'hsl(var(--background))',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'flex-start',
                gap: 2,
                transition: 'all 0.3s ease',
                '&:hover': {
                  boxShadow: '0px 8px 30px rgba(0,0,0,0.04)',
                  transform: 'translateY(-2px)',
                  borderColor: 'hsl(var(--foreground))',
                },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {item.icon}
                <Typography sx={{ fontWeight: 600, color: 'hsl(var(--foreground))', fontSize: 24,textAlign: 'left' }}>
                  {item.title}
                </Typography>
              </Box>
              <Typography sx={{ fontSize: 20, lineHeight: 1.7, color: 'hsl(var(--muted-foreground))' ,textAlign: 'left'}}>
                {item.desc}
              </Typography>
            </Paper>
          ))}
        </Stack>
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
