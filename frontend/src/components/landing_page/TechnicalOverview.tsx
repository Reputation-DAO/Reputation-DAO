import { Box, Container, Typography, Stack } from '@mui/material';

const techOverview = [
  {
    title: 'Powered by ICP',
    desc: 'Harnessing the next-generation Internet Computer Protocol for limitless scalability, near-instant execution, and censorship resistance — built for the future of decentralized reputation. The protocol ensures data permanence, blazing-fast interactions, and eliminates the need for centralized cloud providers, making the infrastructure truly sovereign.',
  },
  {
    title: 'Soulbound & Permanent',
    desc: 'Your reputation is non-transferable, cryptographically bound to your identity. Immutable, fraud-proof, and forever tied to your contributions — not your wallet. This ensures that reputation remains a true reflection of behavior over time, immune to gaming, trading, or artificial inflation.',
  },
  {
    title: 'Fully Open. Verifiable. On-Chain.',
    desc: 'Every action is transparently stored on-chain. Auditable by anyone, trustless by design. No hidden algorithms, no opaque scores — just pure, provable data. The system enables public access to reputation logs, creating a transparent meritocracy across decentralized communities and platforms.',
  },
  {
    title: 'Interoperable by Default',
    desc: 'Designed to integrate seamlessly across protocols, platforms, and ecosystems — enabling your reputation to travel with you anywhere on the decentralized web. From DAOs to marketplaces, your identity becomes a trusted passport, streamlining access and building bridges between siloed systems.',
  },
  {
    title: 'Programmable Reputation Logic',
    desc: 'Reputation becomes a building block for automation. Smart contracts can read, verify, and act on trust signals without relying on third-party intermediaries. This paves the way for fully autonomous governance, access control, and rewards systems that adapt in real time to provable trust data.',
  },
];


export default function TechnicalOverview() {
  return (
    <Box
      component="section"
      sx={{
        width: '100%',
        py: { xs: 6, md: 12 },
        bgcolor: 'hsl(var(--background))',
      }}
    >
      <Container maxWidth="lg">
        <Typography
          variant="h3"
          sx={{
            fontWeight: 800,
            fontSize: { xs: '2.5rem', md: '3rem' },
            textAlign: 'center',
            color: 'hsl(var(--foreground))',
            mb: { xs: 8, md: 12 },
            letterSpacing: '-0.75px',
            lineHeight: 1.2,
            position: 'relative',
            background: 'hsl(var(--foreground))',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          Technical Overview
        </Typography>

        <Stack spacing={6}>
          {techOverview.map((item, idx) => (
            <Box
              key={idx}
              sx={{
                position: 'relative',
                px: { xs: 4, md: 6 },
                py: { xs: 4, md: 5 },
                borderRadius: '1.25rem',
                backgroundColor: 'hsl(var(--background) / 0.9)', // increased opacity since blur is gone
                border: '1px solid hsl(var(--primary) / 0.3)',
                boxShadow: '0 6px 24px -4px hsl(var(--primary) / 0.08)',
                transition: 'all 0.35s ease',
                overflow: 'hidden',
                '&:before': {
                  content: '""',
                  position: 'absolute',
                  inset: 0,
                  borderRadius: 'inherit',
                  border: '1px solid hsl(var(--primary))',
                  pointerEvents: 'none',
                },
                '&:hover': {
                  boxShadow: '0 12px 32px -4px hsl(var(--primary) / 0.25)',
                  borderColor: 'hsl(var(--primary)/ 0.25)',
                },
              }}
            >


              <Typography
                variant="h6"
                sx={{
                  fontWeight: 700,
                  fontSize: '1.1rem',
                  color: 'hsl(var(--foreground))',
                  mb: 1,
                  letterSpacing: '0.3px',
                  textTransform: 'uppercase',
                }}
              >
                {String(idx + 1).padStart(2, '0')} &nbsp; | &nbsp; {item.title}
              </Typography>

              <Typography
                sx={{
                  fontSize: '0.95rem',
                  color: 'hsl(var(--muted-foreground))',
                  lineHeight: 1.7,
                  maxWidth: '85%',
                }}
              >
                {item.desc}
              </Typography>
            </Box>
          ))}
        </Stack>
      </Container>
    </Box>
  );
}
