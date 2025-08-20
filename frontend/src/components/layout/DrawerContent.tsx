// DrawerContent.tsx
import React from 'react';
import {
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Typography,
  IconButton,
  Chip,
} from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { getFilteredNavItems } from './navItems';
import { useRole } from '../../contexts/RoleContext';
import {
  Help as HelpIcon,
  QuestionAnswer as FAQIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';

const DrawerContent: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { userRole, userName, isAdmin, isAwarder } = useRole();
  const availableNavItems = getFilteredNavItems(userRole as any);

  const getRoleDisplayName = () => (isAdmin ? 'Admin' : isAwarder ? 'Trusted Awarder' : 'Member');
  const getUserInitials = () => (userName ? userName.slice(0, 2).toUpperCase() : 'U');

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        flex: 1,
        py: 1,
        overflowY: 'auto',
        scrollbarWidth: 'none',
        '&::-webkit-scrollbar': { display: 'none' },
      }}
    >
      {/* Profile Section */}
      <Box
        sx={{
          p: 3,
          mt: 6,
          borderBottom: '1px solid hsl(var(--border) / 0.3)',
          display: 'flex',
          alignItems: 'center',
          gap: 2,
        }}
      >
        <Avatar
          sx={{
            width: 40,
            height: 40,
            backgroundColor: isAdmin
              ? 'hsl(var(--warning))'
              : isAwarder
              ? 'hsl(var(--success))'
              : 'hsl(var(--primary))',
            color: 'white',
          }}
        >
          {getUserInitials()}
        </Avatar>

        <Box sx={{ flex: 1 }}>
          <Typography
            variant="body1"
            sx={{ fontWeight: 600, fontSize: '0.85rem', color: 'hsl(var(--foreground))' }}
          >
            {userName || 'Unknown User'}
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 0.5 }}>
            <Typography variant="body2" sx={{ fontSize: '0.72rem', color: 'hsl(var(--muted-foreground))' }}>
              {getRoleDisplayName()}
            </Typography>
            {(isAdmin || isAwarder) && (
              <Chip
                label={isAdmin ? 'Admin' : 'Awarder'}
                size="small"
                sx={{
                  height: 18,
                  fontSize: '0.65rem',
                  backgroundColor: isAdmin ? 'hsl(var(--warning))' : 'hsl(var(--success))',
                  color: 'white',
                  '& .MuiChip-label': { px: 0.75 },
                }}
              />
            )}
          </Box>
        </Box>

        <IconButton sx={{ color: 'hsl(var(--muted-foreground))', '&:hover': { color: 'hsl(var(--foreground))' }, p: 0.5 }}>
          <SettingsIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Navigation Section */}
      <Box sx={{ flex: 1, py: 2 }}>
        <List sx={{ p: 0 }}>
          {availableNavItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <ListItem key={item.path} disablePadding sx={{ px: 2, mb: 0.5 }}>
                <ListItemButton
                  onClick={() => navigate(item.path)}
                  sx={{
                    borderRadius: 0.5,
                    py: 1.5,
                    px: 2,
                    minHeight: 'unset',
                    transition: 'background-color var(--transition-smooth), border var(--transition-smooth)',
                    backgroundColor: isActive ? 'hsl(var(--primary) / 0.1)' : 'transparent',
                    border: isActive ? '1px solid hsl(var(--primary) / 0.3)' : '1px solid transparent',
                    '&:hover': {
                    background: "hsl(var(--background))",
                    boxShadow: "0 8px 24px hsl(var(--primary) / 0.2)",
                
                    border: "1px solid hsl(var(--primary))",
                    },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 36,
                      color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                      '& .MuiSvgIcon-root': { fontSize: 20 },
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      sx: {
                        fontSize: '0.85rem',
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? 'hsl(var(--foreground))' : 'hsl(var(--foreground) / 0.8)',
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      {/* Help & FAQ Section */}
      <Box sx={{ borderTop: '1px solid hsl(var(--border) / 0.3)', p: 2 }}>
        <Typography
          variant="overline"
          sx={{ fontSize: '0.7rem', fontWeight: 600, color: 'hsl(var(--muted-foreground))', px: 2, mb: 1 }}
        >
          SUPPORT
        </Typography>
        <List sx={{ p: 0 }}>
          {[{ icon: <HelpIcon />, label: 'Help Center' }, { icon: <FAQIcon />, label: 'FAQs' }].map(
            (item, idx) => (
              <ListItem key={idx} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton
                  sx={{
                    borderRadius: 1.5,
                    py: 1,
                    px: 2,
                    minHeight: 'unset',
                    transition: 'background-color var(--transition-smooth)',
                    '&:hover': { backgroundColor: 'hsl(var(--muted) / 0.4)' },
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 32,
                      color: 'hsl(var(--muted-foreground))',
                      '& .MuiSvgIcon-root': { fontSize: 18 },
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      sx: { fontSize: '0.8rem', color: 'hsl(var(--foreground) / 0.8)' },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            )
          )}
        </List>
      </Box>
    </Box>
  );
};

export default DrawerContent;
