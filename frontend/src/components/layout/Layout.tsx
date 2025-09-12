import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import AppBarHeader from './AppBarHeader';
import ModernSidebar from './ModernSidebar';
import { RoleProvider } from '../../contexts/RoleContext';

const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileOpen, setMobileOpen] = React.useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <RoleProvider>
      <Box sx={{ display: 'flex' }}>
        <CssBaseline />
        <AppBarHeader onMenuClick={handleDrawerToggle} />

        {/* Modern Sidebar Navigation */}
        <ModernSidebar
          mobileOpen={mobileOpen}
          handleDrawerToggle={handleDrawerToggle}
          drawerWidth={280}
        />

        {/* Main Content */}
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            backgroundColor: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            minHeight: '100vh',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            pt: '64px', // Add padding-top for AppBar height
            pl: { xs: 0, sm: 0 }, // Remove padding since ModernSidebar handles spacing
          }}
        >
          {children}
        </Box>
      </Box>
    </RoleProvider>
  );
};

export default Layout;
