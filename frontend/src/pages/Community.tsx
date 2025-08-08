// @ts-nocheck (remove once you add proper types to all sections)
import { Box, Container } from '@mui/material';
import HeroSection from '../components/community_page/HeroSection';
import CommunityResources from '../components/community_page/CommunityResources';
import ContributionSection from '../components/community_page/ContributionSection';
import NewsletterSection from '../components/community_page/NewsSection';
import Footer from '../components/community_page/footer';

import SpotlightContributors from '../components/community_page/SpotlightContributors';
import EventsSection from '../components/community_page/EventsSection';
import InteractivePoll from '../components/community_page/Interactivepoll';
export default function CommunityPage(): JSX.Element {
  return (
    <Box
      sx={{
        bgcolor: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        py: 0,
        minHeight: '100vh', // ensures background covers full page height
      }}
    >
      <HeroSection />

      <Container
        maxWidth="lg"
        sx={{
          bgcolor: 'transparent', // no change in background
          py: 6, // consistent padding
        }}
      >
        <CommunityResources />
        <ContributionSection />
        <SpotlightContributors />
        <EventsSection />
        <InteractivePoll />
        <NewsletterSection />
      </Container>

     
    </Box>
  );
}
