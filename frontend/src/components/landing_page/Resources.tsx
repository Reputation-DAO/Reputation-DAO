

import { Box, Button, Container, Stack, Typography } from '@mui/material';

const resources = [
  { label: 'GitHub', href: '#' },
  { label: 'Slides', href: '#' },
  { label: 'Watch Demo', href: '#' },
  { label: 'Presentation', href: '#' },
  { label: 'Complete Flow chart', href: '#' },
];

export default function Resources() {
  return (
    <Box
      component="section"
      sx={{
        width: '100%',
        py: { xs: 2, md: 3 },
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
            textAlign: 'center',
            mb: 8,
          }}
        >
          Resources
        </Typography>

        <Stack
          direction="row"
          justifyContent="center"
          flexWrap="wrap"
          spacing={2}
          sx={{ gap: 2 }}
        >
          {resources.map((item, idx) => (
            <Button
              key={idx}
              variant="outlined"
              href={item.href}
              sx={{
                borderRadius: 2,
                backgroundColor: 'hsl(var(--muted))',
                color: 'hsl(var(--foreground))',
                borderColor: 'transparent',
                fontWeight: 500,
                textTransform: 'none',
                px: 3,
                py: 1.5,
                fontSize: 14,
                '&:hover': {
                  backgroundColor: 'hsl(var(--muted) / 0.9)',
                  boxShadow: 'none',
                },
              }}
            >
              {item.label}
            </Button>
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
