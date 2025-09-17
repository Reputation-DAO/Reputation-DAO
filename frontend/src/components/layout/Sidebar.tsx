// Sidebar.tsx
import React from 'react';
import { Box, Drawer } from '@mui/material';
import DrawerContent from './DrawerContent';

interface SidebarProps {
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
  drawerWidth: number;
}

const Sidebar: React.FC<SidebarProps> = ({ mobileOpen, handleDrawerToggle, drawerWidth }) => {
  const drawerPaperStyles = {
    boxSizing: 'border-box',
    width: drawerWidth,
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
    borderRadius: '0 8px 8px 0', // subtle rounded corners on right side
    boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
    transition: 'background-color var(--transition-smooth), color var(--transition-smooth), box-shadow var(--transition-smooth)',
    overflowX: 'hidden',
  };

  return (
    <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
      {/* Mobile Drawer */}
      <Drawer
       aria-label="Main navigation"
        variant="temporary"
        open={mobileOpen}
        onClose={handleDrawerToggle}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: 'block', sm: 'none' },
          '& .MuiDrawer-paper': {
            ...drawerPaperStyles,
          },
        }}
      >
        <DrawerContent onNavigate={handleDrawerToggle} />
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', sm: 'block' },
          '& .MuiDrawer-paper': {
            ...drawerPaperStyles,
            '&:hover': {
              boxShadow: '4px 0 12px rgba(0,0,0,0.08)',
            },
          },
        }}
      >
        <DrawerContent />
      </Drawer>
    </Box>
  );
};

export default Sidebar;
