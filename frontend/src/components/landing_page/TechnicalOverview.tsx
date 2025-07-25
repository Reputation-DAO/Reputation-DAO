
import { Box, Container, Typography, Stack } from '@mui/material';

const techOverview = [
  {
    title: '1 > Powered by ICP',
    desc: 'Harnessing the next-generation Internet Computer Protocol for limitless scalability, near-instant execution, and censorship resistance — built for the future of decentralized reputation.',
  },
  {
    title: '2 > Soulbound & Permanent',
    desc: 'Your reputation is non-transferable, cryptographically bound to your identity. Immutable, fraud-proof, and forever tied to your contributions — not your wallet.',
  },
  {
    title: '3 > Fully Open. Verifiable. On-Chain.',
    desc: 'Every action is transparently stored on-chain. Auditable by anyone, trustless by design. No hidden algorithms, no opaque scores — just pure, provable data.',
  },
  {
    title: '4 > Interoperable by Default',
    desc: 'Designed to integrate seamlessly across protocols, platforms, and ecosystems — enabling your reputation to travel with you anywhere on the decentralized web.',
  },
  {
    title: '5 > Programmable Reputation Logic',
    desc: 'Reputation becomes a building block for automation. Smart contracts can read, verify, and act on trust signals without relying on third-party intermediaries.',
  },
];


export default function TechnicalOverview() {
  return (
    <Box
      component="section"
      sx={{
        width: '100%',
        py: { xs: 2, md: 3 },
        bgcolor: 'hsl(var(--background))',
      }}
    >
      <Container maxWidth="lg" sx={{ px: 0 }}>
        <Typography
          variant="h3"
          sx={{
            fontWeight: 600,
            fontSize: { xs: '1.8rem', md: '2rem' },
            color: 'hsl(var(--foreground))',
            textAlign: 'left',
            mb: 8,
            px: { xs: 2.5, md: 3.5 }
          }}
        >
          Technical Overview
        </Typography>

        <Stack spacing={4}>
          {techOverview.map((item, idx) => (
            <Box key={idx}>
              <Typography
                sx={{
                  fontWeight: 600,
                  color: 'hsl(var(--foreground))',
                  fontSize: 18,
                  mb: 1,
                  px: { xs: 5, md: 7 }
                }}
              >
                {item.title}
              </Typography>
              <Typography
                sx={{
                  fontSize: 15,
                  color: 'hsl(var(--muted-foreground))',
                  lineHeight: 1.7,
                  maxWidth: { md: '70%' },
                  px: { xs: 8, md: 12 }
                }}
              >
                {item.desc}
              </Typography>
            </Box>
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
