import { Box, Container, Typography, Button, Stack } from '@mui/material';
import { Link as MuiLink } from '@mui/material';
import { Play, ArrowRight, Zap, Shield, Network } from 'lucide-react';

export default function Hero() {
  return (
    <Box
      component="section"
      sx={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
        background: `
          linear-gradient(135deg, hsl(var(--background)) 0%, hsl(var(--secondary)) 100%),
          radial-gradient(circle at 20% 80%, hsl(var(--primary) / 0.1) 0%, transparent 50%),
          radial-gradient(circle at 80% 20%, hsl(var(--primary-glow) / 0.15) 0%, transparent 50%)
        `,
      }}
    >
      {/* Animated Background Elements */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          zIndex: 1,
          '& > div': {
            position: 'absolute',
            borderRadius: '50%',
            background: 'hsl(var(--primary) / 0.1)',
            animation: 'float 6s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-10px)' },
            },
          }
        }}
      >
        <Box sx={{ top: '20px', left: '10px', width: '80px', height: '80px', animationDelay: '0s' }} />
        <Box sx={{ top: '160px', right: '80px', width: '64px', height: '64px', animationDelay: '1s' }} />
        <Box sx={{ bottom: '160px', left: '80px', width: '48px', height: '48px', animationDelay: '4s' }} />
        <Box sx={{ top: '50%', right: '33%', width: '32px', height: '32px', animationDelay: '1s' }} />
      </Box>

      {/* Main Content */}
      <Container
        maxWidth="lg"
        sx={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          px: { xs: 2, sm: 3, lg: 4 },
        }}
      >
        <Box 
          sx={{ 
            animation: 'fadeInUp 0.8s ease-out',
            '@keyframes fadeInUp': {
              '0%': { transform: 'translateY(30px)', opacity: 0 },
              '100%': { transform: 'translateY(0)', opacity: 1 },
            },
          }}
        >
          {/* Floating Icons */}
          <Stack
            direction="row"
            spacing={4}
            justifyContent="center"
            sx={{ mb: 4 }}
          >
            <Box
              sx={{
                p: 2,
                borderRadius: '16px',
                background: 'hsl(var(--glass))',
                backdropFilter: 'blur(20px)',
                border: '1px solid hsl(var(--glass-border))',
                animation: 'float 6s ease-in-out infinite',
              }}
            >
              <Shield size={32} style={{ color: 'hsl(var(--primary))' }} />
            </Box>
            <Box
              sx={{
                p: 2,
                borderRadius: '16px',
                background: 'hsl(var(--glass))',
                backdropFilter: 'blur(20px)',
                border: '1px solid hsl(var(--glass-border))',
                animation: 'float 6s ease-in-out infinite',
                animationDelay: '1s',
              }}
            >
              <Zap size={32} style={{ color: 'hsl(var(--primary-glow))' }} />
            </Box>
            <Box
              sx={{
                p: 2,
                borderRadius: '16px',
                background: 'hsl(var(--glass))',
                backdropFilter: 'blur(20px)',
                border: '1px solid hsl(var(--glass-border))',
                animation: 'float 6s ease-in-out infinite',
                animationDelay: '2s',
              }}
            >
              <Network size={32} style={{ color: 'hsl(var(--primary))' }} />
            </Box>
          </Stack>

          <Typography
            variant="h1"
            sx={{
              fontSize: { xs: '2.5rem', sm: '3.75rem', lg: '4.5rem' },
              fontWeight: 'bold',
              mb: 3,
              lineHeight: 1.1,
            }}
          >
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(to right, hsl(var(--foreground)), hsl(var(--primary)), hsl(var(--primary-glow)))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Trust, On-Chain.
            </Box>
            <br />
            <Box
              component="span"
              sx={{
                background: 'linear-gradient(to right, hsl(var(--primary-glow)), hsl(var(--primary)))',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              Forever.
            </Box>
          </Typography>
          
          <Typography
            variant="h5"
            sx={{
              fontSize: { xs: '1.25rem', sm: '1.5rem' },
              color: 'hsl(var(--muted-foreground))',
              mb: 4,
              maxWidth: '768px',
              mx: 'auto',
              lineHeight: 1.6,
            }}
          >
            Soulbound, tamper-proof reputation built on ICP.
          </Typography>
          
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            justifyContent="center"
            alignItems="center"
            sx={{ mb: 8 }}
          >
            <Button
              component={MuiLink}
              href="https://www.youtube.com/watch?v=f5_kVgIzl_E"
              target="_blank"
              variant="contained"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.125rem',
                background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--primary-glow)))',
                borderRadius: '12px',
                textTransform: 'none',
                boxShadow: '0 10px 30px hsl(var(--primary) / 0.3)',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 15px 40px hsl(var(--primary) / 0.4)',
                },
                transition: 'all 0.3s ease',
              }}
              startIcon={<Play size={20} />}
            >
              Watch Demo
            </Button>
            <Button
              component={MuiLink}
              href="https://github.com/Reputation-DAO/Reputation-DAO"
              target="_blank"
              variant="outlined"
              size="large"
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.125rem',
                border: '2px solid hsl(var(--primary) / 0.2)',
                color: 'hsl(var(--primary))',
                borderRadius: '12px',
                textTransform: 'none',
                '&:hover': {
                  background: 'hsl(var(--primary) / 0.05)',
                  borderColor: 'hsl(var(--primary) / 0.3)',
                },
                transition: 'all 0.3s ease',
              }}
              endIcon={<ArrowRight size={20} />}
            >
              View GitHub
            </Button>
          </Stack>

          {/* Stats */}
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={4}
            justifyContent="center"
            sx={{ maxWidth: '512px', mx: 'auto' }}
          >
            <Box
              sx={{
                p: 3,
                textAlign: 'center',
                background: 'hsl(var(--glass))',
                backdropFilter: 'blur(20px)',
                border: '1px solid hsl(var(--glass-border))',
                borderRadius: '16px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 20px 40px hsl(var(--primary) / 0.2)',
                },
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'hsl(var(--primary))', mb: 1 }}>
                100%
              </Typography>
              <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                Immutable
              </Typography>
            </Box>
            
            <Box
              sx={{
                p: 3,
                textAlign: 'center',
                background: 'hsl(var(--glass))',
                backdropFilter: 'blur(20px)',
                border: '1px solid hsl(var(--glass-border))',
                borderRadius: '16px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 20px 40px hsl(var(--primary) / 0.2)',
                },
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'hsl(var(--primary))', mb: 1 }}>
                0%
              </Typography>
              <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                Transferable
              </Typography>
            </Box>
            
            <Box
              sx={{
                p: 3,
                textAlign: 'center',
                background: 'hsl(var(--glass))',
                backdropFilter: 'blur(20px)',
                border: '1px solid hsl(var(--glass-border))',
                borderRadius: '16px',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 20px 40px hsl(var(--primary) / 0.2)',
                },
              }}
            >
              <Typography variant="h4" sx={{ fontWeight: 'bold', color: 'hsl(var(--primary))', mb: 1 }}>
                ∞
              </Typography>
              <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                Permanent
              </Typography>
            </Box>
          </Stack>
        </Box>
      </Container>
    </Box>
  );
}
