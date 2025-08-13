import React, { useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Button,
  Tabs,
  Tab,
  IconButton,
  Alert,
  Chip,
  Switch,
  FormControlLabel,
  Paper,
  Stack,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  History as HistoryIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useRole } from '../contexts/RoleContext';

// Import all decay components
import DecayStatusCard from '../components/decay/DecayStatusCard';
import DecayConfigPanel from '../components/decay/DecayConfigPanel';
import DecayAnalytics from '../components/decay/DecayAnalytics';
import DecayHistoryChart from '../components/decay/DecayHistoryChart';
import DecayTransactionFilter from '../components/decay/DecayTransactionFilter';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`decay-tabpanel-${index}`}
      aria-labelledby={`decay-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const DecaySystemPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const [currentTab, setCurrentTab] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [testingMode, setTestingMode] = useState(false);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const handleRefresh = () => {
    setRefreshKey(prev => prev + 1);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const tabs = [
    {
      label: 'Overview',
      icon: <DashboardIcon />,
      value: 0,
    },
    {
      label: 'Analytics',
      icon: <AnalyticsIcon />,
      value: 1,
    },
    {
      label: 'History',
      icon: <HistoryIcon />,
      value: 2,
    },
    ...(isAdmin ? [{
      label: 'Configuration',
      icon: <SettingsIcon />,
      value: 3,
    }] : []),
  ];

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundColor: 'hsl(var(--background))',
        px: { xs: 3, md: 6, lg: 8 },
        py: { xs: 4, md: 6 },
      }}
    >
      {/* Header */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton
            onClick={handleBack}
            sx={{
              mr: 3,
              p: 2,
              color: 'hsl(var(--muted-foreground))',
              '&:hover': {
                color: 'hsl(var(--foreground))',
                backgroundColor: 'hsl(var(--muted))',
              },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography
            variant="h3"
            sx={{
              color: 'hsl(var(--foreground))',
              fontWeight: 700,
              fontSize: { xs: '1.875rem', md: '2.5rem' },
              flex: 1,
            }}
          >
            Reputation Decay System
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            {/* Testing Mode Toggle */}
            <FormControlLabel
              control={
                <Switch
                  checked={testingMode}
                  onChange={(e) => setTestingMode(e.target.checked)}
                  color="warning"
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" sx={{ color: 'hsl(var(--muted-foreground))' }}>
                    Testing Mode
                  </Typography>
                  {testingMode && (
                    <Chip
                      label="MINUTES"
                      size="small"
                      color="warning"
                      sx={{ fontSize: '0.6rem', height: 20 }}
                    />
                  )}
                </Box>
              }
            />
            <IconButton
              onClick={handleRefresh}
              sx={{
                p: 2,
                color: 'hsl(var(--primary))',
                backgroundColor: 'hsl(var(--muted))',
                '&:hover': {
                  backgroundColor: 'hsl(var(--primary))',
                  color: 'hsl(var(--primary-foreground))',
                },
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
        <Typography
          variant="h6"
          sx={{
            color: 'hsl(var(--muted-foreground))',
            fontSize: '1.125rem',
            fontWeight: 400,
            ml: 8,
          }}
        >
          Monitor and configure automatic reputation decay to maintain system balance
        </Typography>
      </Box>

            {/* Testing Mode Alert */}
      {testingMode && (
        <Alert 
          severity="warning" 
          sx={{ 
            mb: 6,
            borderRadius: 2,
            '& .MuiAlert-message': {
              fontSize: '1rem',
            },
          }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={() => setTestingMode(false)}
            >
              Disable
            </Button>
          }
        >
          <Typography variant="body1">
            <strong>Testing Mode Active:</strong> Decay intervals are set to minutes instead of days for real-time testing.
            This should only be used in development environments.
          </Typography>
        </Alert>
      )}

      {/* Tabs */}
      <Paper
        elevation={0}
        sx={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 3,
          mb: 6,
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 3,
            '& .MuiTab-root': {
              color: 'hsl(var(--muted-foreground))',
              fontSize: '1rem',
              fontWeight: 500,
              textTransform: 'none',
              minHeight: 72,
              py: 3,
              '&.Mui-selected': {
                color: 'hsl(var(--primary))',
                fontWeight: 600,
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'hsl(var(--primary))',
              height: 3,
            },
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  {tab.icon}
                  <Typography variant="inherit">{tab.label}</Typography>
                </Box>
              }
              value={tab.value}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tabs */}
      <Paper
        elevation={0}
        sx={{
          backgroundColor: 'hsl(var(--muted))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 3,
          mb: 4,
        }}
      >
        <Tabs
          value={currentTab}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 2,
            '& .MuiTab-root': {
              color: 'hsl(var(--muted-foreground))',
              fontSize: '0.875rem',
              textTransform: 'none',
              minHeight: 60,
              '&.Mui-selected': {
                color: 'hsl(var(--primary))',
              },
            },
            '& .MuiTabs-indicator': {
              backgroundColor: 'hsl(var(--primary))',
            },
          }}
        >
          {tabs.map((tab) => (
            <Tab
              key={tab.value}
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {tab.icon}
                  {tab.label}
                </Box>
              }
              value={tab.value}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Tab Content */}
      <Box>
        {/* Overview Tab */}
        <TabPanel value={currentTab} index={0}>
          <Stack spacing={4}>
            {/* Status Cards */}
            <DecayStatusCard key={`status-${refreshKey}`} />
            
            {/* Main Content Row */}
            <Box 
              sx={{ 
                display: 'flex',
                gap: 4,
                flexDirection: { xs: 'column', lg: 'row' },
              }}
            >
              {/* Recent Activity Chart */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Card
                  sx={{
                    backgroundColor: 'hsl(var(--muted))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 3,
                    height: '100%',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <CardContent sx={{ p: 4, height: '100%' }}>
                    <Typography variant="h6" sx={{ color: 'hsl(var(--foreground))', mb: 3 }}>
                      Recent Decay Activity
                    </Typography>
                    <Box sx={{ height: 300 }}>
                      <DecayHistoryChart key={`history-overview-${refreshKey}`} />
                    </Box>
                  </CardContent>
                </Card>
              </Box>

              {/* Quick Filters Sidebar */}
              <Box sx={{ width: { lg: 400 }, flexShrink: 0 }}>
                <Card
                  sx={{
                    backgroundColor: 'hsl(var(--muted))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 3,
                    height: '100%',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ color: 'hsl(var(--foreground))', mb: 3 }}>
                      Quick Filters
                    </Typography>
                    <DecayTransactionFilter key={`filter-overview-${refreshKey}`} />
                  </CardContent>
                </Card>
              </Box>
            </Box>
          </Stack>
        </TabPanel>

        {/* Analytics Tab */}
        <TabPanel value={currentTab} index={1}>
          <DecayAnalytics key={`analytics-${refreshKey}`} />
        </TabPanel>

        {/* History Tab */}
        <TabPanel value={currentTab} index={2}>
          <Stack spacing={4}>
            <Box 
              sx={{ 
                display: 'flex',
                gap: 4,
                flexDirection: { xs: 'column', lg: 'row' },
              }}
            >
              {/* History Chart */}
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Card
                  sx={{
                    backgroundColor: 'hsl(var(--muted))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: 3,
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <CardContent sx={{ p: 4 }}>
                    <Typography variant="h6" sx={{ color: 'hsl(var(--foreground))', mb: 3 }}>
                      Decay History Chart
                    </Typography>
                    <Box sx={{ height: 400 }}>
                      <DecayHistoryChart key={`history-${refreshKey}`} />
                    </Box>
                  </CardContent>
                </Card>
              </Box>
              
              {/* Transaction Filter */}
              <Box sx={{ width: { lg: 400 }, flexShrink: 0 }}>
                <DecayTransactionFilter key={`filter-${refreshKey}`} />
              </Box>
            </Box>
          </Stack>
        </TabPanel>

        {/* Configuration Tab - Admin Only */}
        {isAdmin && (
          <TabPanel value={currentTab} index={3}>
            <DecayConfigPanel 
              key={`config-${refreshKey}`}
              onConfigUpdate={() => {
                // Refresh all components when config is updated
                setRefreshKey(prev => prev + 1);
              }}
            />
          </TabPanel>
        )}
      </Box>
    </Box>
  );
};

export default DecaySystemPage;
