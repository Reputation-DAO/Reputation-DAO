import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Zap } from 'lucide-react';
import {
  Box,
  Container,
  IconButton,
} from '@mui/material';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';

export default function Header() {
  const [mode, setMode] = useState<'light' | 'dark'>(
    typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
  );
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', mode === 'dark');
      localStorage.setItem('theme', mode);
    }
  }, [mode]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { label: 'Docs', href: '/docs' },
    { label: 'Blog', href: '/blog' },
    { label: 'Community', href: '/community' },
  ];

  const toggleDrawer = () => setMobileOpen(!mobileOpen);

  return (
    <nav 
      style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 50,
        transition: 'all 0.3s ease',
        background: scrolled 
          ? 'rgba(255, 255, 255, 0.8)' 
          : 'transparent',
        backdropFilter: scrolled ? 'blur(20px)' : 'none',
        borderBottom: scrolled ? '1px solid rgba(0, 0, 0, 0.1)' : 'none',
        boxShadow: scrolled 
          ? '0 4px 30px -10px rgba(0, 0, 0, 0.1)' 
          : 'none',
      }}
    >
      <Container maxWidth="xl">
        <Box 
          sx={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            height: '64px',
            px: { xs: 2, sm: 3, lg: 4 }
          }}
        >
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: '8px', textDecoration: 'none' }}>
            <Box
              sx={{
                width: 32,
                height: 32,
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'scale(1.05)',
                  boxShadow: '0 0 20px rgba(59, 130, 246, 0.4)',
                },
              }}
            >
              <Zap size={20} color="white" />
            </Box>
            <Box
              sx={{
                fontSize: '20px',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
              }}
            >
              Reputation DAO
            </Box>
          </Link>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 4 }}>
            {navItems.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                style={{
                  fontSize: '14px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  color: '#6b7280',
                  transition: 'all 0.3s ease',
                  position: 'relative',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = '#3b82f6';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = '#6b7280';
                }}
              >
                {item.label}
              </Link>
            ))}
            
            {/* Theme toggle */}
            <IconButton
              onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
              size="small"
              sx={{
                color: '#6b7280',
                transition: 'all 0.2s ease',
                '&:hover': { 
                  transform: 'rotate(15deg) scale(1.05)',
                  color: '#3b82f6',
                },
              }}
            >
              {mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
            </IconButton>

            <Box
              component={Link}
              to="/auth"
              sx={{
                px: 3,
                py: 1.5,
                background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                color: 'white',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.3s ease',
                display: 'inline-block',
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: '0 10px 25px rgba(59, 130, 246, 0.3)',
                },
              }}
            >
              Get Started
            </Box>
          </Box>

          {/* Mobile menu button */}
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <IconButton
              onClick={toggleDrawer}
              sx={{
                color: '#6b7280',
                '&:hover': { color: '#3b82f6' },
              }}
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </IconButton>
          </Box>
        </Box>

        {/* Mobile Navigation */}
        {mobileOpen && (
          <Box 
            sx={{ 
              display: { xs: 'block', md: 'none' },
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              mt: 1,
              p: 2,
              borderRadius: '12px',
              border: '1px solid rgba(0, 0, 0, 0.1)',
            }}
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {navItems.map((item) => (
                <Link
                  key={item.label}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  style={{
                    fontSize: '14px',
                    fontWeight: 500,
                    color: '#6b7280',
                    textDecoration: 'none',
                    transition: 'color 0.3s ease',
                  }}
                >
                  {item.label}
                </Link>
              ))}
              <Box
                component={Link}
                to="/auth"
                sx={{
                  mt: 1,
                  px: 3,
                  py: 1.5,
                  background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)',
                  color: 'white',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: 600,
                  textAlign: 'center',
                  textDecoration: 'none',
                  display: 'block',
                }}
              >
                Get Started
              </Box>
            </Box>
          </Box>
        )}
      </Container>
    </nav>
  );
}
