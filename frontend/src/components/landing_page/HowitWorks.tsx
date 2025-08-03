import { Box, Container, Typography, Stack } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import { motion } from 'framer-motion';

const steps = [
  {
    title: 'Earn Reputation',
    description:
      'Contribute to communities and real-world projects. Every meaningful action — whether it’s sharing knowledge, building tools, or helping others — is permanently and transparently recorded on-chain as proof of your contribution.',
  },
  {
    title: 'Soulbound Identity',
    description:
      'Your reputation is soulbound — uniquely tied to your identity. It cannot be transferred, bought, or sold, ensuring it reflects only your verifiable efforts and interactions across trusted networks.',
  },
  {
    title: 'Unlock Opportunities',
    description:
      'Leverage your on-chain reputation to unlock high-trust environments: gain access to exclusive DAOs, governance roles, gated communities, and projects that require credible contributors.',
  },
];

export default function HowItWorks() {
  return (
    <Box
      component="section"
      sx={{
        width: '100%',
        height:'100%',
        py: { xs: 1, md: 2 },
        bgcolor: 'hsl(var(--background))',
      }}
    >
      <Container maxWidth="lg" sx={{ px: 3 }}>
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
  }}
>
  How It Works
</Typography>


        <Box
          sx={{
            display: 'flex',
            flexDirection: { xs: 'column', md: 'row' },
            justifyContent: 'space-between',
            alignItems: 'stretch',
            gap: { xs: 5, md: 4 },
            position: 'relative',
          }}
        >
          {steps.map((step, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale:  1}}
              transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              style={{ flex: 1 }}
            >
              <Box
                sx={{
                  p: 3,
                  borderRadius: 1,
                  border: '1px solid hsl(var(--border))',
                  boxShadow: '0 2px 8px hsl(var(--border) / 0.15)',
                  height: '100%',
                  textAlign: 'center',
                  position: 'relative',
                  backgroundColor: 'hsl(var(--card))',
                  transition: 'all 0.3s ease-in-out',
                }}
              >
                <Box
                  sx={{
                    width: 50,
                    height: 50,
                    borderRadius: '50%',
                    backgroundColor: 'hsl(var(--primary))',
                    color: 'white',
                    fontWeight: 600,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 20,
                    mb: 2,
                    mx: 'auto',
                    boxShadow: '0 0 0 4px hsl(var(--primary) )',
                  }}
                >
                  {idx + 1}
                </Box>

                <Typography
                  sx={{
                    fontWeight: 600,
                    fontSize: 18,
                    mb: 1,
                    color: 'hsl(var(--foreground))',
                  }}
                >
                  {step.title}
                </Typography>

                <Typography
                  sx={{
                    fontSize: 14,
                    lineHeight: 1.8,
                    color: 'hsl(var(--muted-foreground))',
                    px: { md: 1, lg: 2 },
                  }}
                >
                  {step.description}
                </Typography>

                {/* Animated Arrow */}
                {idx < steps.length - 1 && (
                  <motion.div
                    animate={{ x: [0, 5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    style={{
                      position: 'absolute',
                      right: '-20px',
                      top: 'calc(50% - 14px)',
                      display: 'none',
                      color: 'hsl(var(--muted-foreground))',
                    }}
                    className="md:block"
                  >
                    <ArrowForwardIcon sx={{ fontSize: 28 }} />
                  </motion.div>
                )}
              </Box>
            </motion.div>
          ))}
        </Box>

        <Box
          sx={{
            width: '100%',
            height: '1px',
            my: 10,
            background: 'linear-gradient(to right, transparent, hsl(var(--border)), transparent)',
          }}
        />
      </Container>
    </Box>
  );
}
