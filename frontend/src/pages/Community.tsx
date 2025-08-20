// @ts-nocheck (remove once you add proper types to all sections)

import { Box, Container, keyframes } from '@mui/material';

import HeroSection from '../components/community_page/HeroSection';
import CommunityResources from '../components/community_page/CommunityResources';
import ContributionSection from '../components/community_page/ContributionSection';
import NewsletterSection from '../components/community_page/NewsSection';


import SpotlightContributors from '../components/community_page/SpotlightContributors';
import EventsSection from '../components/community_page/EventsSection';
import InteractivePoll from '../components/community_page/Interactivepoll';


// Heartbeat glow animation
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


export default function CommunityPage(): JSX.Element {
  return (
    <Box
      sx={{
        bgcolor: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        py: 0,

        minHeight: '100vh',
        position: 'relative', // needed for absolute glow positioning
        overflow: 'hidden', // prevent glow overflow
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
          animation: `${heartbeatGlow} 10s ease-in-out infinite`,
          zIndex: 0,
          pointerEvents: 'none',
          mixBlendMode: 'screen',
          borderRadius: '0 100px 100px 0',
        }}
      />

      {/* Right Glow */}
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
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <HeroSection />
        <Container maxWidth="lg" sx={{ bgcolor: 'transparent', py: 6 }}>
          <CommunityResources />
          <ContributionSection />
          <SpotlightContributors />
          <EventsSection />
          <InteractivePoll />
          <NewsletterSection />
        </Container>
      </Box>

    </Box>
  );
}
