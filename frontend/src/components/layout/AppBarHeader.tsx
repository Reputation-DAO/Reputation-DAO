import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  Box,
  Tooltip,
  useTheme,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import WalletConnectButton from '../../WalletConnectButton';

interface AppBarHeaderProps {
  onMenuClick: () => void;
}

const AppBarHeader: React.FC<AppBarHeaderProps> = ({ onMenuClick }) => {
  const theme = useTheme();
  const [mode, setMode] = useState<'light' | 'dark'>(
    typeof window !== 'undefined' && localStorage.getItem('theme') === 'light'
      ? 'light'
      : 'dark'
  );

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', mode === 'dark');
      localStorage.setItem('theme', mode);
    }
  }, [mode]);

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        height: '50px',
        backgroundImage: 'var(--gradient-header)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        boxShadow: 'inset -8px 0 8px -5px hsl(var(--primary))',
        borderBottom: 'var(--glass-border)',
        transition: 'var(--transition-smooth)',
        color: 'hsl(var(--foreground))',
        border: '1px solid hsl(var(--border))'
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          minHeight: '50px !important',
          px: { xs: 1, sm: 2 },
        }}
      >
        {/* Left: Menu + Title */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            edge="start"
            onClick={onMenuClick}
            sx={{
              display: { sm: 'none' },
              color: 'hsl(var(--foreground))',
              bgcolor: 'rgba(255,255,255,0.06)',
              borderRadius: 1.2,
              transition: 'var(--transition-fast)',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.18)',
                transform: 'scale(1.06)',
              },
              p: 0.5,
            }}
          >
            <MenuIcon fontSize="small" />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            onClick={() => (window.location.href = '/')}
            style={{ cursor: 'pointer' }}
            sx={{
              fontWeight: 600,
              fontSize: '1.1rem',
              letterSpacing: 0.3,
              color: 'hsl(var(--foreground))',
              textShadow: '0 1px 2px rgba(0,0,0,0.15)',
            }}
          >
            Reputation DAO
          </Typography>
        </Box>

        {/* Right: Wallet + Theme Toggle */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Toggle Theme" arrow>
            <IconButton
              onClick={() => setMode(mode === 'dark' ? 'light' : 'dark')}
              sx={{
                color: 'hsl(var(--foreground))',
                transition: 'var(--transition-fast)',
                '&:hover': { transform: 'rotate(15deg) scale(1.05)' },
                p: 0.5,
              }}
            >
              {mode === 'dark' ? <Brightness7Icon fontSize="small" /> : <Brightness4Icon fontSize="small" />}
            </IconButton>
          </Tooltip>

          <Box sx={{ minHeight: '32px', fontSize: '0.8rem' }}>
            <WalletConnectButton />
          </Box>

        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppBarHeader;
