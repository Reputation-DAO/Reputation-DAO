import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { Link as MuiLink } from '@mui/material';

export default function Hero() {
  return (
   <Box
  component="section"
  sx={{
    position: 'relative',
    width: '100%',
    py: { xs: 10, md: 14 },
    height: '500px',
    overflow: 'visible', // allow glow outside
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    '&::after': {
  content: '""',
  position: 'absolute',
  bottom: '-1px',
  left: '50%',
  transform: 'translateX(-50%)',
  width: '100%',
  height: '10px',
  background: 'linear-gradient(to top, hsl(var(--primary)), transparent)',
  filter: 'blur(10px)',
  zIndex: 0,
  pointerEvents: 'none',
},


  }}
>
      {/* Background Video */}
      <Box
        component="video"
        autoPlay
        muted
        loop
        playsInline
        src="/banner/banner1.mp4" // Replace with your actual path
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: 0,
        }}
      />

      {/* Overlay to darken/fade video if needed */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'linear-gradient(to bottom right, rgba(0,0,0,0.4), rgba(0,0,0,0.4))',
          zIndex: 1,
        }}
      />

      {/* Content on top of video */}
      <Container maxWidth="md" sx={{ textAlign: 'center', px: 3, zIndex: 2 }}>
        <Typography
          variant="h2"
          sx={{
            fontWeight: 700,
            fontSize: { xs: '1.75rem', md: '2.5rem' },
            color: 'white',
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
            color: '#f0f0f0',
            fontSize: 14,
            lineHeight: 1.6,
            mb: 3,
          }}
        >
          Soulbound, tamper-proof reputation built on ICP.
        </Typography>

        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} justifyContent="center">
          <MuiLink href="https://www.youtube.com/watch?v=IXAITmG1rrE" target="_blank" underline="none">
            <Button variant="contained" sx={{
              bgcolor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              px: 4, py: 1.2, fontSize: 13,
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-lg)',
              textTransform: 'none',
              '&:hover': { opacity: 0.9 },
              transition: 'var(--transition-smooth)',
            }}>
              Watch Demo
            </Button>
          </MuiLink>

          <MuiLink href="https://github.com/Reputation-DAO/Reputaion-DAO" target="_blank" underline="none">
            <Button variant="outlined" sx={{
              textTransform: 'none',
              px: 4, py: 1.2, fontSize: 13,
              borderRadius: 'var(--radius)',
              borderColor: 'hsl(var(--border))',
              color: 'white',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.1)',
                borderColor: 'hsl(var(--border))',
              },
              transition: 'var(--transition-smooth)',
            }}>
              View GitHub
            </Button>
          </MuiLink>
        </Stack>
      </Container>
    </Box>
  );
}
