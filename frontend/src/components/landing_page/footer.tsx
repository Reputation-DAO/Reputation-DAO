
import { Box, Link as MuiLink, Typography, Stack, TextField, Button } from '@mui/material';
import { GridLegacy as Grid } from '@mui/material';
export default function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        width: '100%',
        borderTop: '1px solid hsl(var(--border))',
        backgroundColor: 'hsl(var(--background))',
        px: { xs: 3, md: 6 },
        pt: 4,
        pb: 2,
        fontSize: 13,
        color: 'hsl(var(--muted-foreground))',
      }}
    >
      <Grid
        container
        spacing={{ xs: 3, md: 6 }}
        sx={{ mb: 4 }}
      >
        <Grid item xs={12} md={2.5}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 600,
              fontSize: '1rem',
              color: 'hsl(var(--foreground))',
              mb: 1,
            }}
          >
            Reputation DAO
          </Typography>

          <Typography sx={{ fontSize: 12.5, maxWidth: 260, lineHeight: 1.6 }}>
            Decentralized, tamper-proof, soulbound reputation systems for the future of trust.
          </Typography>
        </Grid>

        <Grid item xs={6} md={2}>
           <Typography sx={{ fontWeight: 800, color: 'hsl(var(--primary))', mb: 1 }}>
            Product
          </Typography>
          <Stack spacing={0.5}>
            {['Features', 'Pricing', 'Integrations', 'Roadmap'].map((item) => (
              <MuiLink
                key={item}
                href="#"
                underline="none"
                sx={{
                  display: 'block',
                  color:"hsl(var(--foreground))",
                '&:hover': { color: 'hsl(var(--pr))' },
                }}
              >
                {item}
              </MuiLink>
            ))}
          </Stack>
        </Grid>

        <Grid item xs={6} md={2}>
          <Typography sx={{ fontWeight: 800, color: 'hsl(var(--primary))', mb: 1 }}>
            Company
          </Typography>
          <Stack spacing={0.5}>
            {['About', 'Careers', 'Blog', 'Press'].map((item) => (
              <MuiLink
                key={item}
                href="#"
                underline="none"
                sx={{
                  display: 'block',
                  color:"hsl(var(--foreground))",
                '&:hover': { color: 'hsl(var(--pr))' },
                }}
              >
                {item}
              </MuiLink>
            ))}
          </Stack>
        </Grid>

        <Grid item xs={6} md={2}>
          <Typography sx={{ fontWeight: 800, color: 'hsl(var(--primary))', mb: 1 }}>
            Resources
          </Typography>
          <Stack spacing={0.5}>
            {['Docs', 'Community', 'Support', 'Security'].map((item) => (
              <MuiLink
                key={item}
                href="#"
                underline="none"
                sx={{
                  display: 'block',
                  color:"hsl(var(--foreground))",
                '&:hover': { color: 'hsl(var(--pr))' },
                }}
              >
                {item}
              </MuiLink>
            ))}
          </Stack>
        </Grid>

        <Grid item xs={12} md={3.5}>
          <Typography sx={{ fontWeight: 500, color: 'hsl(var(--foreground))', mb: 1 }}>
            Stay Updated
          </Typography>
          <Typography sx={{ fontSize: 12.5, mb: 1.5 }}>
            Join our newsletter for updates on governance, reputation systems, and new launches.
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <TextField
              placeholder="Your email"
              size="small"
              variant="outlined"
              sx={{
                flexGrow: 1,
                input: {
                  backgroundColor: 'hsl(var(--background))',
                  color: 'hsl(var(--foreground))',
                  borderRadius: 'var(--radius)',
                  fontSize: 13,
                  border: '1px solid hsl(var(--border))',
                  padding: '0.5rem 0.75rem',
                },
              }}
            />
            <Button
              variant="contained"
              sx={{
                textTransform: 'none',
                px: 2.5,
                fontSize: 13,
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                borderRadius: 'var(--radius)',
                '&:hover': {
                  opacity: 0.9,
                  backgroundColor: 'hsl(var(--primary))',
                },
              }}
            >
              Subscribe
            </Button>
          </Box>
        </Grid>
      </Grid>

      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          alignItems: 'center',
          justifyContent: 'space-between',
          borderTop: '1px solid hsl(var(--border))',
          pt: 1.5,
          pb: 1,
          gap: 2,
          fontSize: 12,
        }}
      >
        <Typography>© {new Date().getFullYear()} Reputation DAO. All rights reserved.</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          {['Privacy', 'Terms', 'Contact'].map((item) => (
            <MuiLink
              key={item}
              href="#"
              underline="none"
              sx={{
                color:"hsl(var(--foreground))",
                '&:hover': { color: 'hsl(var(--pr))' },
              }}
            >
              {item}
            </MuiLink>
          ))}
        </Box>
      </Box>
    </Box>
  );
}
