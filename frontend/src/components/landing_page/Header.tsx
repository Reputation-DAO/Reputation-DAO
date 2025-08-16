import {
  AppBar,
  Box,
  Container,
  Link as MuiLink,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import { useState, useEffect } from 'react';

export default function Header() {
  const [mode, setMode] = useState<'light' | 'dark'>(
    typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
  );
  const [mobileOpen, setMobileOpen] = useState(false);

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

  const toggleDrawer = () => setMobileOpen(!mobileOpen);

  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        background: 'linear-gradient(to right, hsl(var(--primary)), hsl(var(--background)))',
        color: 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--border))',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        transition: 'var(--transition-smooth)',
        boxShadow: 'inset -8px 0 8px -5px hsl(var(--primary))',
      }}
    >
      <Container
        maxWidth="lg"
        sx={{
          py: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '56px',
        }}
      >
        {/* Logo + Brand */}
        <MuiLink
          href="/"
          underline="none"
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            fontWeight: 600,
            fontSize: '1rem',
            color: 'black',
            letterSpacing: '0.02em',
          }}
        >
          <img
            src="/assets/dark_logo.png"
            alt="Logo"
            style={{ height: '40px', width: '50px' }}
          />
          Reputation DAO
        </MuiLink>

        {/* Nav + Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          {/* Desktop nav */}
          <Box
            sx={{
              display: { xs: 'none', md: 'flex' },
              alignItems: 'center',
              gap: 2.5,
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
                  color: 'hsl(var(--foreground))',
                  fontWeight: 600,
                  transition: 'color 0.2s ease',
                  '&:hover': {
                    color: 'hsl(var(--primary))',
                    textShadow: '0 0 8px hsl(var(--primary))',
                  },
                }}
              >
                {label}
              </MuiLink>
            ))}
          </Box>

          {/* Theme toggle */}
          <IconButton
            aria-label="Toggle theme"
            onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
            size="small"
            sx={{
              color: 'hsl(var(--foreground))',
              transition: 'transform 0.2s ease',
              '&:hover': { transform: 'rotate(15deg) scale(1.05)' },
            }}
          >
            {mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
          </IconButton>

          {/* Mobile hamburger */}
          <IconButton
            edge="end"
            color="inherit"
            aria-label="menu"
            onClick={toggleDrawer}
            sx={{ display: { xs: 'flex', md: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          {/* CTA button */}
          <MuiLink
            href="/auth"
            underline="none"
            sx={{
              display: { xs: 'none', md: 'inline-block' },
              backgroundColor: 'hsl(var(--primary))',
              color: 'hsl(var(--primary-foreground))',
              textTransform: 'none',
              px: 2.25,
              py: 0.75,
              fontSize: 12,
              borderRadius: 'var(--radius)',
              boxShadow: 'var(--shadow-lg)',
              transition: 'opacity 0.25s ease, background-color 0.25s ease',
              '&:hover': {
                opacity: 0.9,
                backgroundColor: 'hsl(var(--primary))',
              },
            }}
          >
            Get Started
          </MuiLink>
        </Box>
      </Container>

      {/* Mobile drawer */}
      <Drawer anchor="right" open={mobileOpen} onClose={toggleDrawer}>
        <Box sx={{ width: 200, p: 2 }}>
          <List>
            {navItems.map(({ label, href }) => (
              <ListItem key={label} disablePadding>
                <ListItemButton component="a" href={href} onClick={toggleDrawer}>
                  <ListItemText primary={label} />
                </ListItemButton>
              </ListItem>
            ))}
            <ListItem disablePadding>
              <ListItemButton component="a" href="/auth" onClick={toggleDrawer}>
                <ListItemText primary="Get Started" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </AppBar>
  );
}
