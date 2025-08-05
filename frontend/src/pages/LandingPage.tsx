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
      }}
    >
      {/* Left Glow */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100px',
          height: '100%',
          background: 'hsl(var(--primary))',
          animation: `${heartbeatGlow} 20s ease-in-out infinite`,
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
          animation: `${heartbeatGlow} 20s ease-in-out infinite`,
          zIndex: 0,
          pointerEvents: 'none',
          mixBlendMode: 'screen',
          borderRadius: '100px 0 0 100px',
        }}
      />

      {/* Main Content */}
      <Box component="main" sx={{ flex: 1, position: 'relative', zIndex: 1 }}>
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
