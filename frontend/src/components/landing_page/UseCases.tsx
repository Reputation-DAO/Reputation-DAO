
import { Box, Container, Typography, Paper } from '@mui/material';
import { GridLegacy as Grid } from '@mui/material';
const useCases = [
  {
    image: '/assets/governance.png',
    title: 'DAOs & Governance',
    desc: 'Fair voting power based on earned reputation, not token wealth. Protect governance integrity.',
  },
  {
    image: '/assets/defi.png',
    title: 'DeFi & Protocols',
    desc: 'Establish trust layers on-chain for credit scoring, under-collateralized loans, and more.',
  },
  {
    image: '/assets/identity.png',
    title: 'Social & Identity',
    desc: 'Portable, proof-based identity for creators, contributors, and communities.',
  },
];

export default function UseCases() {
  return (
    <Box
      component="section"
      sx={{
        width: '100%',
        py: { xs: 5, md: 7 },
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
            mb: 8,
          }}
        >
          Where Reputation DAO Fits
        </Typography>

        <Grid container spacing={4} justifyContent="center">
          {useCases.map((item, idx) => (
            <Grid key={idx} item xs={12} md={4} sx={{ display: 'flex', justifyContent: 'center' }}>
              <Paper
                variant="outlined"
                sx={{
                  width: 260,
                  display: 'flex',
                  flexDirection: 'column',
                  borderRadius: 'calc(var(--radius) + 4px)',
                  borderColor: 'hsl(var(--border))',
                  backgroundColor: 'hsl(var(--background))',
                  overflow: 'hidden',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    boxShadow: '0px 8px 30px rgba(0,0,0,0.05)',
                    transform: 'translateY(-2px)',
                    borderColor: 'hsl(var(--foreground) / 0.1)',
                  },
                }}
              >
                <Box
                  sx={{
                    aspectRatio: '4/3',
                    width: '100%',
                    img: {
                      width: '100%',
                      height: '100%',
                      objectFit: 'cover',
                      display: 'block',
                    },
                  }}
                >
                  <img src={item.image} alt={item.title} />
                </Box>

                <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1, flexGrow: 1 }}>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      color: 'hsl(var(--foreground))',
                      fontSize: 16,
                      lineHeight: 1.3,
                    }}
                  >
                    {item.title}
                  </Typography>
                  <Typography
                    sx={{
                      fontSize: 13,
                      color: 'hsl(var(--muted-foreground))',
                      lineHeight: 1.5,
                      flexGrow: 1,
                    }}
                  >
                    {item.desc}
                  </Typography>
                </Box>
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
