import React, { useState, useEffect, useRef } from 'react';
import { Box, Avatar, Typography, IconButton, Tooltip } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Settings, HelpCircle, MessageCircle } from 'lucide-react';

import { getFilteredNavItems } from './navItems';
import { useRole } from '../../contexts/RoleContext';

interface ModernSidebarProps {
  mobileOpen: boolean;
  handleDrawerToggle: () => void;
  drawerWidth?: number;
}

const ModernSidebar: React.FC<ModernSidebarProps> = ({ 
  mobileOpen, 
  handleDrawerToggle, 
  drawerWidth = 280 
}) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, userName } = useRole();
  const indicatorRef = useRef<HTMLDivElement>(null);

  const collapsedWidth = 80;
  const currentWidth = isCollapsed ? collapsedWidth : drawerWidth;

  const availableNavItems = userRole !== 'Loading' 
    ? getFilteredNavItems(userRole) 
    : [];

    // Update active navigation index based on current route
  useEffect(() => {
    const currentIndex = availableNavItems.findIndex(item => item.path === location.pathname);
    if (currentIndex !== -1) {
      setActiveIndex(currentIndex);
    }
  }, [location.pathname, availableNavItems]);

  const toggleCollapse = () => setIsCollapsed(!isCollapsed);

  const sidebarVariants = {
    expanded: { width: drawerWidth },
    collapsed: { width: collapsedWidth }
  };

  const contentVariants = {
    expanded: { opacity: 1, display: 'block' },
    collapsed: { opacity: 0, display: 'none' }
  };

  const NavItem = ({ item, isActive }: { item: any; isActive: boolean }) => {
    const handleClick = () => {
      navigate(item.path);
    };

    return (
      <Tooltip title={isCollapsed ? item.label : ''} placement="right" arrow>
        <motion.div
          whileHover={{ x: isCollapsed ? 0 : 3 }}
          whileTap={{ scale: 0.98 }}
          style={{ marginBottom: 4 }}
          layout // This helps maintain position during animations
        >
          <Box
            onClick={handleClick}
            sx={{
              display: 'flex',
              alignItems: 'center',
              px: isCollapsed ? 1.5 : 2,
              py: 1.5,
              mx: 1,
              borderRadius: isCollapsed ? '50%' : 1.5,
              cursor: 'pointer',
              transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
              backgroundColor: isActive 
                ? 'hsl(var(--primary) / 0.1)' 
                : 'transparent',
              border: isActive 
                ? '1px solid hsl(var(--primary) / 0.2)' 
                : '1px solid transparent',
              position: 'relative',
              overflow: 'hidden',
              minHeight: 48,
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              '&:hover': {
                backgroundColor: isActive 
                  ? 'hsl(var(--primary) / 0.15)' 
                  : 'hsl(var(--accent) / 0.8)',
                transform: isCollapsed ? 'scale(1.1)' : 'translateX(2px)',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              },
            }}
          >
            <Box
              sx={{
                color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minWidth: 24,
                mr: isCollapsed ? 0 : 2,
                transition: 'color 0.2s ease',
              }}
            >
              {item.icon}
            </Box>
            
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  key={`${item.path}-text`}
                  variants={contentVariants}
                  initial="collapsed"
                  animate="expanded"
                  exit="collapsed"
                  transition={{ duration: 0.2 }}
                  style={{ flex: 1 }}
                >
                  <Typography
                    variant="body2"
                    sx={{
                      fontSize: '0.875rem',
                      fontWeight: isActive ? 600 : 500,
                      color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--foreground) / 0.8)',
                      whiteSpace: 'nowrap',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {item.label}
                  </Typography>
                </motion.div>
              )}
            </AnimatePresence>
          </Box>
        </motion.div>
      </Tooltip>
    );
  };

  const SidebarContent = () => (
    <motion.div
      style={{ 
        height: '100%', 
        display: 'flex', 
        flexDirection: 'column',
        width: '100%',
      }}
      animate={{ width: currentWidth }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    >
      {/* Header with Collapse Button */}
      <Box sx={{ 
        p: 6, 
        borderBottom: '1px solid', 
        borderColor: 'divider',
        display: 'flex',
        alignItems: 'center',
        justifyContent: isCollapsed ? 'center' : 'space-between',
      }}>
        {!isCollapsed && (
          <Typography variant="h6" sx={{ 
            fontWeight: 600,
            color: 'text.primary',
          }}>
            Menu
          </Typography>
        )}
        <IconButton
          onClick={toggleCollapse}
          size="small"
          sx={{
            color: 'text.secondary',
            '&:hover': {
              backgroundColor: 'action.hover',
              color: 'primary.main',
            },
          }}
        >
          {isCollapsed ? <ChevronRight size={20} /> : <ChevronLeft size={20} />}
        </IconButton>
      </Box>

      {/* Profile Section */}
      <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: isCollapsed ? 0 : 2,
          justifyContent: isCollapsed ? 'center' : 'flex-start',
        }}>
          <Avatar sx={{ 
            width: 40, 
            height: 40, 
            bgcolor: 'primary.main',
            fontSize: '1rem',
          }}>
            {userName?.charAt(0).toUpperCase() || 'U'}
          </Avatar>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2, delay: isCollapsed ? 0 : 0.1 }}
                style={{ overflow: 'hidden' }}
              >
                <Box>
                  <Typography variant="subtitle2" sx={{ 
                    fontWeight: 600,
                    color: 'text.primary',
                    lineHeight: 1.2,
                  }}>
                    {userName || 'User'}
                  </Typography>
                  <Typography variant="caption" sx={{ 
                    color: 'text.secondary',
                    fontSize: '0.75rem',
                  }}>
                    {userRole || 'Member'}
                  </Typography>
                </Box>
              </motion.div>
            )}
          </AnimatePresence>
        </Box>
      </Box>

      {/* Navigation Section */}
      <Box sx={{ flex: 1, py: 2, overflowY: 'auto', overflowX: 'hidden', position: 'relative' }}>
        {/* Animated indicator line */}
        {availableNavItems.length > 0 && activeIndex >= 0 && activeIndex < availableNavItems.length && (
          <motion.div
            ref={indicatorRef}
            style={{
              position: 'absolute',
              left: 0,
              width: 3,
              height: 48,
              backgroundColor: 'hsl(var(--primary))',
              borderRadius: '0 2px 2px 0',
              zIndex: 1,
            }}
            animate={{ 
              y: activeIndex * 52 + 8,
              opacity: 1,
            }}
            transition={{
              type: 'spring',
              stiffness: 200,
              damping: 25,
              mass: 0.5,
              duration: 0.6,
            }}
          />
        )}
        
        {availableNavItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <NavItem 
              key={item.path} 
              item={item} 
              isActive={isActive}
            />
          );
        })}
      </Box>

      {/* Support Section */}
      <Box sx={{ p: 2, borderTop: '1px solid', borderColor: 'divider' }}>
        <Typography variant="caption" sx={{ 
          color: 'text.secondary',
          display: isCollapsed ? 'none' : 'block',
          textAlign: 'center',
          mb: 1,
        }}>
          Need help?
        </Typography>
        <Box sx={{ 
          display: 'flex', 
          gap: 1, 
          justifyContent: isCollapsed ? 'center' : 'space-around',
        }}>
          <Tooltip title="Settings" placement="right">
            <IconButton size="small" sx={{ color: 'text.secondary' }}>
              <Settings size={16} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Help" placement="right">
            <IconButton size="small" sx={{ color: 'text.secondary' }}>
              <HelpCircle size={16} />
            </IconButton>
          </Tooltip>
          {!isCollapsed && (
            <Tooltip title="Contact" placement="right">
              <IconButton size="small" sx={{ color: 'text.secondary' }}>
                <MessageCircle size={16} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </Box>
    </motion.div>
  );

  return (
    <React.Fragment key="modern-sidebar">
      {/* Mobile Drawer */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          zIndex: 1200,
          display: { xs: mobileOpen ? 'block' : 'none', sm: 'none' },
        }}
        onClick={handleDrawerToggle}
      />
      
      <motion.div
        key="mobile-sidebar"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          height: '100vh',
          zIndex: 1300,
          display: mobileOpen ? 'block' : 'none',
        }}
        initial={{ x: -drawerWidth }}
        animate={{ x: mobileOpen ? 0 : -drawerWidth }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <Box sx={{ width: drawerWidth }}>
          <SidebarContent />
        </Box>
      </motion.div>

      {/* Desktop Sidebar */}
      <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
        <motion.div
          key="desktop-sidebar"
          variants={sidebarVariants}
          initial="expanded"
          animate={isCollapsed ? "collapsed" : "expanded"}
          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            height: '100vh',
            zIndex: 1100,
          }}
        >
          <SidebarContent />
        </motion.div>
      </Box>

      {/* Main Content Spacer */}
      <Box
        sx={{
          width: { xs: 0, sm: currentWidth },
          flexShrink: 0,
          transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      />
    </React.Fragment>
  );
};

export default ModernSidebar;
