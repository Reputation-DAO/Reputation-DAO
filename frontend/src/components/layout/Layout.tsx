import React from 'react';
import { Box, CssBaseline } from '@mui/material';
import AppBarHeader from './AppBarHeader';

import { RoleProvider } from '../../contexts/RoleContext';

import Sidebar from './Sidebar';


const drawerWidth = 220;

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

        {/* Sidebar Navigation */}
        

        <Sidebar
          mobileOpen={mobileOpen}
          handleDrawerToggle={handleDrawerToggle}
          drawerWidth={drawerWidth}
        />


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
            pt: '50px', // <-- Add padding-top equal to AppBar height
          }}
        >
          {children}
        </Box>
      </Box>
    </RoleProvider>
  );
};

export default Layout;
