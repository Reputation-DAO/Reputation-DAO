
import { Box, Container, Typography, Button, Stack } from '@mui/material';

export default function Hero() {
  return (
    <Box
      component="section"
      sx={{
        width: '100%',
        py: { xs: 10, md: 14 },
        background: 'linear-gradient(to bottom right, hsl(var(--background)), hsl(var(--muted)))',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <Container maxWidth="md" sx={{ textAlign: 'center', px: 3 }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.75rem', md: '2.5rem' },
            color: 'hsl(var(--foreground))',
            lineHeight: 1.25,
            mb: 1.5,
          }}
        >
          Trust, On-Chain. <br /> Forever.
        </Typography>

        <Typography
          sx={{
            maxWidth: 460,
            mx: 'auto',
            color: 'hsl(var(--muted-foreground))',
            fontSize: 14,
            lineHeight: 1.6,
            mb: 3,
          }}
        >
          Soulbound, tamper-proof reputation built on ICP.
        </Typography>

        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          justifyContent="center"
        >
          <Button
            variant="contained"
            href='https://youtu.be/f5_kVgIzl_E?feature=shared'
            sx={{
              bgcolor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              textTransform: 'none',
              px: 4,
              py: 1.2,
              fontSize: 13,
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-lg)',
              '&:hover': {
                opacity: 0.9,
                bgcolor: 'hsl(var(--primary))',
              },
              transition: 'var(--transition-smooth)',
            }}
          >
            Watch Demo
          </Button>

          <Button
            variant="outlined"
            sx={{
              textTransform: 'none',
              px: 4,
              py: 1.2,
              fontSize: 13,
              borderRadius: 'var(--radius)',
              borderColor: 'hsl(var(--border))',
              color: 'hsl(var(--foreground))',
              '&:hover': {
                bgcolor: 'hsl(var(--muted))',
                borderColor: 'hsl(var(--border))',
              },
              transition: 'var(--transition-smooth)',
            }}
          >
            View GitHub
          </Button>
        </Stack>
      </Container>
      
    </Box>
  );
}
