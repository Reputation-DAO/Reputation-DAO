import { Box, Container, keyframes } from '@mui/material';
import Hero from '../components/landing_page/Hero';
import ProblemSolution from '../components/landing_page/ProblemSolution';
import HowItWorks from '../components/landing_page/HowitWorks';
import KeyFeatures from '../components/landing_page/KeyFeatures';
import UseCases from '../components/landing_page/UseCases';
import TechnicalOverview from '../components/landing_page/TechnicalOverview';
import Resources from '../components/landing_page/Resources';
import FAQ from '../components/landing_page/FAQ';

// Polar bear sleeping heartbeat
const heartbeatGlow = keyframes`
  0% {
    opacity: 0.06;
    filter: blur(25px);
  }
  20% {
    opacity: 0.14;
    filter: blur(40px);
  }
  50% {
    opacity: 0.36;
    filter: blur(50px);
  }
  80% {
    opacity: 0.14;
    filter: blur(40px);
  }
  100% {
    opacity: 0.06;
    filter: blur(25px);
  }
`;

export default function LandingPage() {
  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
        bgcolor: 'hsl(var(--background))',
        position: 'relative',
        overflow: 'hidden',
        // Add floating animations
        '@keyframes float': {
          '0%, 100%': {
            transform: 'translateY(0px) rotate(0deg)',
          },
          '50%': {
            transform: 'translateY(-20px) rotate(5deg)',
          }
        },
        '@keyframes pulse': {
          '0%, 100%': {
            opacity: 0.4,
            transform: 'scale(1)',
          },
          '50%': {
            opacity: 0.8,
            transform: 'scale(1.05)',
          }
        }
      }}
    >
      {/* Floating blur orbs for beautiful visual effect */}
      <Box 
        sx={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          pointerEvents: 'none',
          zIndex: 0
        }}
      >
        <Box 
          sx={{
            position: 'absolute',
            top: '20%',
            left: '20%',
            width: '300px',
            height: '300px',
            background: 'rgba(59, 130, 246, 0.06)',
            borderRadius: '50%',
            filter: 'blur(60px)',
            animation: 'pulse 4s ease-in-out infinite',
            '.dark &': {
              background: 'rgba(99, 102, 241, 0.12)'
            }
          }}
        />
        <Box 
          sx={{
            position: 'absolute',
            bottom: '20%',
            right: '20%',
            width: '350px',
            height: '350px',
            background: 'rgba(147, 51, 234, 0.05)',
            borderRadius: '50%',
            filter: 'blur(70px)',
            animation: 'pulse 5s ease-in-out infinite',
            animationDelay: '1s',
            '.dark &': {
              background: 'rgba(147, 51, 234, 0.1)'
            }
          }}
        />
        <Box 
          sx={{
            position: 'absolute',
            top: '5%',
            right: '15%',
            width: '200px',
            height: '200px',
            background: 'rgba(59, 130, 246, 0.04)',
            borderRadius: '50%',
            filter: 'blur(40px)',
            animation: 'float 6s ease-in-out infinite',
            animationDelay: '2s',
            '.dark &': {
              background: 'rgba(59, 130, 246, 0.08)'
            }
          }}
        />
        <Box 
          sx={{
            position: 'absolute',
            bottom: '5%',
            left: '10%',
            width: '180px',
            height: '180px',
            background: 'rgba(236, 72, 153, 0.04)',
            borderRadius: '50%',
            filter: 'blur(35px)',
            animation: 'float 7s ease-in-out infinite',
            animationDelay: '3s',
            '.dark &': {
              background: 'rgba(236, 72, 153, 0.08)'
            }
          }}
        />
      </Box>

      {/* Left Glow */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100px',
          height: '100%',
          background: 'hsl(var(--primary))',
          animation: `${heartbeatGlow} 10s ease-in-out infinite`,
          zIndex: 0,
          pointerEvents: 'none',
          mixBlendMode: 'screen',
          borderRadius: '0 100px 100px 0',
        }}
      />


      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '100px',
          height: '100%',
          background: 'hsl(var(--primary))',
          animation: `${heartbeatGlow} 10s ease-in-out infinite`,
          zIndex: 0,
          pointerEvents: 'none',
          mixBlendMode: 'screen',
          borderRadius: '100px 0 0 100px',
        }}
      />

      {/* Main Content */}
      <Box component="main" sx={{ flex: 1, position: 'relative', zIndex: 2 }}>
        <Hero />
        <Container maxWidth="lg">
          <ProblemSolution />
          <HowItWorks />
          <KeyFeatures />
          <UseCases />
          <TechnicalOverview />
          <Resources />
          <FAQ />
        </Container>
      </Box>
    </Box>
  );
}
