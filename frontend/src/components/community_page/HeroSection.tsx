
import { Box, Paper, Typography, Button, Link as MuiLink } from '@mui/material';

export default function HeroSection() {
  return (
    <Paper
      sx={{
        borderRadius: '0',
        border: 'none',
        borderBottom: '1px solid hsl(var(--border))',
        overflow: 'hidden',
        mb: 0,
        bgcolor: 'hsl(var(--background))',
      }}
    >

      <Box
        sx={{
          position: 'relative',
          height: '500px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
          px: 0,
          backgroundImage: `
            linear-gradient(
              rgba(0, 0, 0, 0.5),
              rgba(0, 0, 0, 0.5)
            ),
            url(/banner/community.png)
          `,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
        }}
      >
        <Box>
          <Typography variant="h3" sx={{ fontWeight: 700, mb: 2 }}>
            Join the Reputation DAO Community
          </Typography>
          <Typography
            sx={{
              color: 'rgba(255,255,255,0.85)',
              maxWidth: 500,
              mx: 'auto',
            }}
          >
            Contribute, collaborate, and shape the future of decentralized reputation.
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, mt: 4, justifyContent: 'center' }}>

            <Button
              component={MuiLink}
              href="https://t.me/reputationdao"
              target="_blank"
              rel="noopener noreferrer"
              variant="contained"
              sx={{
                bgcolor: 'hsl(var(--primary))',
                color: 'white',
                textDecoration: 'none'
              }}
            >
              Join Telegram
            </Button>
            <Button
              component={MuiLink}
              href="https://x.com/repDao28"
              target="_blank"
              rel="noopener noreferrer"
              variant="outlined"
              sx={{
                textTransform: 'none',
                px: 4, py: 1.2, fontSize: 13,
                borderRadius: 'var(--radius)',
                borderColor: 'hsl(var(--border))',
                color: 'white',
                textDecoration: 'none',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.1)',
                  borderColor: 'hsl(var(--border))',
                },
                transition: 'var(--transition-smooth)',

              }}
            >
              Follow on X (Twitter)
            </Button>
          </Box>
        </Box>
      </Box>
    </Paper>
  );
}
