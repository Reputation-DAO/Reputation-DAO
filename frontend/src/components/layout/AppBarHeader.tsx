import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  IconButton,
  useTheme,
  Box,
  Tooltip,
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
    typeof window !== 'undefined' && localStorage.getItem('theme') === 'dark' ? 'dark' : 'light'
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
        backgroundImage: 'var(--gradient-header)',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        boxShadow: 'var(--shadow-lg)',
        borderBottom: 'var(--glass-border)',
        transition: 'var(--transition-smooth)',
        color: 'hsl(var(--foreground))',
      }}
    >
      <Toolbar
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '60px !important',
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
              backgroundColor: 'rgba(255,255,255,0.07)',
              borderRadius: '10px',
              transition: 'var(--transition-fast)',
              '&:hover': {
                backgroundColor: 'rgba(255,255,255,0.2)',
                transform: 'scale(1.08)',
              },
            }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            noWrap
            sx={{
              fontWeight: 700,
              fontSize: '1.3rem',
              letterSpacing: '0.05rem',
              color: 'hsl(var(--foreground))',
              textShadow: '0 1px 3px rgba(0,0,0,0.25)',
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
                '&:hover': {
                  transform: 'rotate(20deg) scale(1.1)',
                },
              }}
            >
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
          </Tooltip>

          <WalletConnectButton />
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default AppBarHeader;
