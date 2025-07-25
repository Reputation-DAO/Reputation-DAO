
import {
  AppBar,
  Box,
  Container,
  Link as MuiLink,
  IconButton,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useState, useEffect } from 'react';



export default function Header() {
  const [mode, setMode] = useState<'light' | 'dark'>(
    typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
  );

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', mode === 'dark');
      localStorage.setItem('theme', mode);
    }
  }, [mode]);

  const navItems = [
  { label: 'Docs', href: '/docs' },
  { label: 'Blog', href: '/blog' },
  { label: 'Community', href: '/community' },
];

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        borderBottom: '1px solid hsl(var(--border))',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        boxShadow: 'none',
        transition: 'var(--transition-smooth)',
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          py: 1,
          display: 'flex',
          alignItems: 'center',
          minHeight: '56px',
        }}
      >
        <MuiLink
          href="/"
          underline="none"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 0.75,
            fontWeight: 600,
            fontSize: '1rem',
            color: 'hsl(var(--foreground))',
            letterSpacing: '0.02em',
          }}
        >

          <Box
            sx={{
              width: 8,
              height: 8,
              bgcolor: 'hsl(var(--primary))',
              borderRadius: '2px',
            }}
          />
          Reputation DAO
        </MuiLink>

        <Box sx={{ flexGrow: 1 }} />

        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 3,
              fontSize: 13,
              color: 'hsl(var(--muted-foreground))',
            }}
          >
            {navItems.map(({ label, href }) => (
              <MuiLink
                key={label}
                href={href}
                underline="none"
                sx={{
                  transition: 'color hsl(var(--foreground))',
                  color:"hsl(var(--foreground))",
                  '&:hover': { color: 'hsl(var(--primary))' },
                }}
              >
                {label}
              </MuiLink>
            ))}
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
              size="small"
              sx={{
                color: 'hsl(var(--foreground))',
                transition: 'var(--transition-fast)',
                '&:hover': { transform: 'rotate(15deg) scale(1.05)' },
              }}
            >
              {mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
            </IconButton>

            <MuiLink
              href="auth"
              underline="none"
              sx={{
                display: 'inline-block',
                backgroundColor: 'hsl(var(--primary))',
                color: 'hsl(var(--primary-foreground))',
                textTransform: 'none',
                px: 2,
                py: 0.75,
                fontSize: 12,
                borderRadius: 'var(--radius)',
                boxShadow: 'var(--shadow-lg)',
                '&:hover': {
                  opacity: 0.9,
                  backgroundColor: 'hsl(var(--primary))',
                },
                transition: 'var(--transition-smooth)',
              }}
            >
              Get Started
            </MuiLink>
          </Box>
        </Box>
      </Container>
    </AppBar>
  );
}
