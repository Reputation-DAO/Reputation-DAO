import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Button,
  Chip,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Menu,
  MenuItem,
  Divider,
} from '@mui/material';
import {
  TrendingUp,
  People as Users,
  MoreVert,
  Visibility,
  Edit,
  Settings,
  NorthEast as ArrowUpRight,
} from '@mui/icons-material';

const Dashboard: React.FC = () => {
  const [menuAnchor, setMenuAnchor] = useState<null | HTMLElement>(null);

  // Mock data for recent notifications
  const recentNotifications = [
    {
      id: 1,
      user: 'Alice Johnson',
      avatar: '/api/placeholder/32/32',
      action: 'earned 50 reputation points',
      time: '2 minutes ago',
      recentActivity: 'Completed advanced Python course',
    },
    {
      id: 2,
      user: 'Bob Smith',
      avatar: '/api/placeholder/32/32',
      action: 'joined the community',
      time: '15 minutes ago',
      recentActivity: 'Updated their profile',
    },
    {
      id: 3,
      user: 'Carol Davis',
      avatar: '/api/placeholder/32/32',
      action: 'earned 30 reputation points',
      time: '1 hour ago',
      recentActivity: 'Submitted final project',
    },
  ];

  // Mock data for top members
  const topMembers = [
    {
      id: 1,
      name: 'Sarah Wilson',
      avatar: '/api/placeholder/40/40',
      reputation: 1250,
      level: 'Expert',
      change: '+15',
      recentActivity: 'Mentored 5 students this week',
    },
    {
      id: 2,
      name: 'Mike Chen',
      avatar: '/api/placeholder/40/40',
      reputation: 980,
      level: 'Advanced',
      change: '+12',
      recentActivity: 'Led study group session',
    },
    {
      id: 3,
      name: 'Emma Brown',
      avatar: '/api/placeholder/40/40',
      reputation: 850,
      level: 'Intermediate',
      change: '+8',
      recentActivity: 'Shared helpful resources',
    },
  ];

  // Mock data for community growth
  const communityData = [
    {
      id: 1,
      user: 'David Lee',
      avatar: '/api/placeholder/32/32',
      action: 'earned 25 reputation points',
      time: '30 minutes ago',
      recentActivity: 'Participated in code review',
    },
    {
      id: 2,
      user: 'Lisa Wang',
      avatar: '/api/placeholder/32/32',
      action: 'earned 40 reputation points',
      time: '45 minutes ago',
      recentActivity: 'Completed certification exam',
    },
    {
      id: 3,
      user: 'James Miller',
      avatar: '/api/placeholder/32/32',
      action: 'updated their profile',
      time: '1 hour ago',
      recentActivity: 'Added new skills to profile',
    },
  ];

  const handleMenuClick = (event: React.MouseEvent<HTMLElement>) => {
    setMenuAnchor(event.currentTarget);
  };

  const handleMenuClose = () => {
    setMenuAnchor(null);
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'hsl(var(--background))',
        px: { xs: 2, md: 3 },
        py: { xs: 2, md: 3 },
        transition: 'background-color var(--transition-smooth)',
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            color: 'hsl(var(--foreground))',
            fontWeight: 600,
            fontSize: { xs: '1.5rem', md: '2rem' },
            mb: 1,
          }}
        >
          Overview
        </Typography>
        <Typography
          variant="body1"
          sx={{
            color: 'hsl(var(--muted-foreground))',
            fontSize: '0.875rem',
          }}
        >
          Track your community's reputation and activity
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', gap: 3, flexDirection: { xs: 'column', lg: 'row' } }}>
        {/* Main Content */}
        <Box sx={{ flex: 1 }}>
          {/* Stats Cards */}
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' },
              gap: 2,
              mb: 4,
            }}
          >
            {/* Trust Score Card */}
            <Card
              sx={{
                backgroundColor: 'hsl(var(--muted))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'hsl(var(--foreground) / 0.8)', fontSize: '0.875rem', fontWeight: 500 }}>
                    Trust Score
                  </Typography>
                  <TrendingUp sx={{ color: 'hsl(var(--info))', fontSize: '20px' }} />
                </Box>
                <Typography variant="h4" sx={{ color: 'hsl(var(--foreground))', fontWeight: 600, mb: 1 }}>
                  85%
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ArrowUpRight sx={{ color: 'hsl(var(--info))', fontSize: '16px' }} />
                  <Typography variant="body2" sx={{ color: 'hsl(var(--info))', fontSize: '0.75rem' }}>
                    +5% from last month
                  </Typography>
                </Box>
              </CardContent>
            </Card>

            {/* Members Card */}
            <Card
              sx={{
                backgroundColor: 'hsl(var(--muted))',
                border: '1px solid hsl(var(--border))',
                borderRadius: 2,
              }}
            >
              <CardContent sx={{ p: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ color: 'hsl(var(--foreground) / 0.8)', fontSize: '0.875rem', fontWeight: 500 }}>
                    Members
                  </Typography>
                  <Users sx={{ color: 'hsl(var(--primary))', fontSize: '20px' }} />
                </Box>
                <Typography variant="h4" sx={{ color: 'hsl(var(--foreground))', fontWeight: 600, mb: 1 }}>
                  1,234
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ArrowUpRight sx={{ color: 'hsl(var(--info))', fontSize: '16px' }} />
                  <Typography variant="body2" sx={{ color: 'hsl(var(--info))', fontSize: '0.75rem' }}>
                    +12% from last month
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Box>

          {/* Welcome New Members */}
          <Card
            sx={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 2,
              mb: 4,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#f1f5f9', fontSize: '1rem', fontWeight: 600 }}>
                  Welcome New Members
                </Typography>
                <Button
                  variant="outlined"
                  size="small"
                  sx={{
                    color: '#3b82f6',
                    borderColor: '#334155',
                    fontSize: '0.75rem',
                    '&:hover': {
                      borderColor: '#3b82f6',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    },
                  }}
                >
                  View all
                </Button>
              </Box>
              <List sx={{ p: 0 }}>
                {recentNotifications.slice(0, 3).map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: '#334155',
                            color: '#e2e8f0',
                            fontSize: '0.875rem',
                          }}
                        >
                          {notification.user.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ color: '#f1f5f9', fontSize: '0.875rem' }}>
                            {notification.user}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                            {notification.action} • {notification.time}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < recentNotifications.slice(0, 3).length - 1 && (
                      <Divider sx={{ borderColor: '#334155' }} />
                    )}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Chart Placeholder */}
          <Card
            sx={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 2,
              mb: 4,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: '#f1f5f9', fontSize: '1rem', fontWeight: 600, mb: 3 }}>
                Activity Chart
              </Typography>
              <Box
                sx={{
                  height: 200,
                  backgroundColor: 'hsl(var(--muted))',
                  borderRadius: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid hsl(var(--border))',
                }}
              >
                <Typography variant="body2" sx={{ color: '#64748b' }}>
                  Chart visualization will be implemented here
                </Typography>
              </Box>
            </CardContent>
          </Card>

          {/* Community Growth */}
          <Card
            sx={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: '#f1f5f9', fontSize: '1rem', fontWeight: 600, mb: 3 }}>
                Community Growth
              </Typography>
              <List sx={{ p: 0 }}>
                {communityData.map((item, index) => (
                  <React.Fragment key={item.id}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: '#334155',
                            color: '#e2e8f0',
                            fontSize: '0.875rem',
                          }}
                        >
                          {item.user.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ color: '#f1f5f9', fontSize: '0.875rem' }}>
                            {item.user}
                          </Typography>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                            {item.action} • {item.time}
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < communityData.length - 1 && <Divider sx={{ borderColor: '#334155' }} />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>

        {/* Right Sidebar */}
        <Box sx={{ width: { lg: 300 }, flexShrink: 0 }}>
          {/* Recent Notifications */}
          <Card
            sx={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 2,
              mb: 3,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ color: '#f1f5f9', fontSize: '0.875rem', fontWeight: 600 }}>
                  Recent Notifications
                </Typography>
                <IconButton
                  onClick={handleMenuClick}
                  sx={{
                    color: '#94a3b8',
                    '&:hover': { color: '#f1f5f9' },
                    p: 0.5,
                  }}
                >
                  <MoreVert sx={{ fontSize: '18px' }} />
                </IconButton>
              </Box>
              <List sx={{ p: 0 }}>
                {recentNotifications.map((notification, index) => (
                  <React.Fragment key={notification.id}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            width: 28,
                            height: 28,
                            backgroundColor: '#334155',
                            color: '#e2e8f0',
                            fontSize: '0.75rem',
                          }}
                        >
                          {notification.user.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="body2" sx={{ color: '#f1f5f9', fontSize: '0.75rem', lineHeight: 1.4 }}>
                            {notification.user}
                          </Typography>
                        }
                        secondary={
                          <Box>
                            <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                              {notification.action}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.65rem' }}>
                              {notification.time}
                            </Typography>
                          </Box>
                        }
                      />
                    </ListItem>
                    {index < recentNotifications.length - 1 && <Divider sx={{ borderColor: '#334155' }} />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>

          {/* Top Members */}
          <Card
            sx={{
              backgroundColor: '#1e293b',
              border: '1px solid #334155',
              borderRadius: 2,
            }}
          >
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ color: '#f1f5f9', fontSize: '0.875rem', fontWeight: 600, mb: 3 }}>
                Top Members
              </Typography>
              <List sx={{ p: 0 }}>
                {topMembers.map((member, index) => (
                  <React.Fragment key={member.id}>
                    <ListItem sx={{ px: 0, py: 1.5 }}>
                      <ListItemAvatar>
                        <Avatar
                          sx={{
                            width: 32,
                            height: 32,
                            backgroundColor: '#334155',
                            color: '#e2e8f0',
                            fontSize: '0.75rem',
                          }}
                        >
                          {member.name.charAt(0)}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="body2" sx={{ color: '#f1f5f9', fontSize: '0.75rem' }}>
                              {member.name}
                            </Typography>
                            <Chip
                              label={member.change}
                              size="small"
                              sx={{
                                backgroundColor: '#10b981',
                                color: '#ffffff',
                                fontSize: '0.65rem',
                                height: 18,
                                '& .MuiChip-label': { px: 1 }
                              }}
                            />
                          </Box>
                        }
                        secondary={
                          <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.7rem' }}>
                            {member.reputation} pts
                          </Typography>
                        }
                      />
                    </ListItem>
                    {index < topMembers.length - 1 && <Divider sx={{ borderColor: '#334155' }} />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Box>
      </Box>

      {/* Menu */}
      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={handleMenuClose}
        PaperProps={{
          sx: { 
            backgroundColor: 'hsl(var(--muted))', 
            border: '1px solid hsl(var(--border))',
            color: 'hsl(var(--foreground))',
          }
        }}
      >
        <MenuItem onClick={handleMenuClose} sx={{ fontSize: '0.875rem', color: 'hsl(var(--foreground))' }}>
          <Visibility sx={{ mr: 1, fontSize: '16px' }} />
          View
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ fontSize: '0.875rem', color: 'hsl(var(--foreground))' }}>
          <Edit sx={{ mr: 1, fontSize: '16px' }} />
          Edit
        </MenuItem>
        <MenuItem onClick={handleMenuClose} sx={{ fontSize: '0.875rem', color: 'hsl(var(--foreground))' }}>
          <Settings sx={{ mr: 1, fontSize: '16px' }} />
          Settings
        </MenuItem>
      </Menu>
    </Box>
  );
};

export default Dashboard;
