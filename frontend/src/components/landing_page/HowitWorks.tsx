
import { Box, Container, Typography, Stack } from '@mui/material';

const steps = [
  {
    title: 'Earn Reputation',
    description:
      'Participate in communities and contribute to projects. Your actions are transparently recorded on-chain.',
  },
  {
    title: 'Reputation is Soulbound',
    description:
      'Your reputation is permanently tied to your identity and cannot be sold or transferred, ensuring authenticity.',
  },
  {
    title: 'Use Your Reputation',
    description:
      'Access exclusive opportunities, gain recognition, and build trust across the ecosystem with your on-chain reputation.',
  },
];

export default function HowItWorks() {
  return (
    <Box
      component="section"
      sx={{
        width: '100%',
        py: { xs: 8, md: 12 },
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
          How It Works
        </Typography>

        <Box sx={{ position: 'relative', ml: 2, pl: 3, borderLeft: '2px dotted hsl(var(--border))' }}>
          <Stack spacing={5}>
            {steps.map((step, idx) => (
              <Box key={idx} sx={{ position: 'relative' }}>
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    backgroundColor: 'hsl(var(--primary))',
                    position: 'absolute',
                    left: -17,
                    top: 6,
                  }}
                />
                <Typography sx={{ fontWeight: 600, color: 'hsl(var(--foreground))', fontSize: 18, mb: 1 }}>
                  {step.title}
                </Typography>
                <Typography sx={{ color: 'hsl(var(--muted-foreground))', fontSize: 14, lineHeight: 1.7 }}>
                  {step.description}
                </Typography>
              </Box>
            ))}
          </Stack>
        </Box>
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
