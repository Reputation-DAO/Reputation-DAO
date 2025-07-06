import React from 'react';
import {
  Toolbar,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
} from '@mui/material';
import { navItems } from './navItems';
import { Link, useLocation } from 'react-router-dom';

const DrawerContent: React.FC = () => {
  const location = useLocation();

  return (
    <Box
      sx={{
        flexGrow: 1,
        py: 2,
        backgroundColor: 'hsl(var(--background))',
        color: 'hsl(var(--foreground))',
        backdropFilter: 'var(--glass-blur)',
        WebkitBackdropFilter: 'var(--glass-blur)',
        borderRight: 'var(--glass-border)',
        transition: 'var(--transition-smooth)',
        height: '100%',
      }}
    >
      <Toolbar />

      <List sx={{ px: 2 }}>
        {navItems.map((item) => {
          const isSelected = location.pathname === item.path;

          return (
            <ListItem key={item.label} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                selected={isSelected}
                sx={{
                  borderRadius: '12px',
                  px: 2,
                  py: 1,
                  mb: 0.75,
                  backgroundColor: isSelected
                    ? 'hsl(var(--primary))'
                    : 'transparent',
                  color: isSelected
                    ? 'hsl(var(--primary-background))'
                    : 'hsl(var(--foreground))',
                  fontWeight: isSelected ? 600 : 500,
                  transition: 'var(--transition-fast)',
                  position: 'relative',

                  '&:hover': {
                    backgroundColor: isSelected
                      ? undefined
                      : 'hsl(var(--accent) / 0.6)',
                    transform: 'scale(1.015)',
                  },

                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: 0,
                    height: '100%',
                    width: isSelected ? '4px' : '0px',
                    backgroundColor: 'hsl(var(--primary))',
                    borderRadius: '0 4px 4px 0',
                    transition: 'width 200ms ease',
                  },

                  '& .MuiListItemIcon-root': {
                    color: 'inherit',
                    minWidth: '36px',
                  },

                  '& .MuiListItemText-primary': {
                    color: 'inherit',
                  },
                }}
              >
                <ListItemIcon>{item.icon}</ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );
};

export default DrawerContent;
