import React from 'react';
import { Box, CssBaseline, Drawer } from '@mui/material';
import AppBarHeader from './AppBarHeader';
import DrawerContent from './DrawerContent';
import { Connect2ICProvider, client } from '../../connect2ic';
import { RoleProvider } from '../../RoleContext';
const drawerWidth = 220;

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const drawerPaperStyles = {
    boxSizing: 'border-box',
    width: drawerWidth,
    backgroundColor: 'hsl(var(--background))',
    color: 'hsl(var(--foreground))',
    transition: 'background-color var(--transition-smooth), color var(--transition-smooth)',
  };

  return (
    <Connect2ICProvider client={client}>
    <RoleProvider>
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <AppBarHeader onMenuClick={handleDrawerToggle} />

      {/* Sidebar Navigation */}
      <Box component="nav" sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}>
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': drawerPaperStyles,
          }}
        >
          <DrawerContent />
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          open
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': drawerPaperStyles,
          }}
        >
          <DrawerContent />
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          backgroundColor: 'hsl(var(--background))',
          color: 'hsl(var(--foreground))',
          minHeight: '100vh',
          transition: 'background-color var(--transition-smooth), color var(--transition-smooth)',
        }}
      >
        {children}
      </Box>

    </Box>
      </RoleProvider>
    </Connect2ICProvider>
  );
};

export default Layout;
