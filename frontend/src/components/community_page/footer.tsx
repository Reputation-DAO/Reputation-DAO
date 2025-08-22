import { Box, Typography } from '@mui/material';

export default function Footer() {
  return (
    <Box
      sx={{
        borderTop: '1px solid hsl(var(--border))',
        pt: 8,
        textAlign: 'center',
        color: 'hsl(var(--muted-foreground))',
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 4, mb: 3 }}>
        <Typography variant="body2">Community</Typography>
        <Typography variant="body2">Docs</Typography>
        <Typography variant="body2">GitHub</Typography>
        <Typography variant="body2">Blog</Typography>
        <Typography variant="body2">FAQ</Typography>
      </Box>
      <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 3 }}>
        <Typography variant="body2">🐦</Typography>
        <Typography variant="body2">💬</Typography>
        <Typography variant="body2">📢</Typography>
      </Box>
      <Typography variant="body2">© 2024 Reputation DAO. All rights reserved.</Typography>
    </Box>
  );
}
