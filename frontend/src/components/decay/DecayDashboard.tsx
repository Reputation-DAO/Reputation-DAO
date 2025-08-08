import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Alert,
  Divider,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Analytics as AnalyticsIcon,
  Settings as SettingsIcon,
  History as HistoryIcon,
  Timeline as TimelineIcon,
} from '@mui/icons-material';
import {
  DecayStatusCard,
  DecayConfigPanel,
  DecayTransactionFilter,
  DecayAnalytics,
  DecayHistoryChart,
} from './index';

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
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `decay-tab-${index}`,
    'aria-controls': `decay-tabpanel-${index}`,
  };
}

interface DecayDashboardProps {
  className?: string;
}

const DecayDashboard: React.FC<DecayDashboardProps> = ({ className }) => {
  // @ts-ignore - Temporary until RoleContext is updated
  const isAdmin = true; // Temporary admin check
  const [activeTab, setActiveTab] = useState(0);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const userTabs = [
    { label: 'Decay Status', icon: <ScheduleIcon />, adminOnly: false },
    { label: 'Transaction History', icon: <HistoryIcon />, adminOnly: false },
  ];

  const adminTabs = [
    { label: 'Analytics', icon: <AnalyticsIcon />, adminOnly: true },
    { label: 'History Charts', icon: <TimelineIcon />, adminOnly: true },
    { label: 'Configuration', icon: <SettingsIcon />, adminOnly: true },
  ];

  const availableTabs = isAdmin ? [...userTabs, ...adminTabs] : userTabs;

  return (
    <Card className={className}>
      <CardContent>
        <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <ScheduleIcon />
          Reputation Decay System
        </Typography>
        
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Monitor and manage the automatic decay of reputation points to maintain system balance
        </Typography>

        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            aria-label="decay system tabs"
            variant="scrollable"
            scrollButtons="auto"
          >
            {availableTabs.map((tab, index) => (
              <Tab
                key={index}
                label={tab.label}
                icon={tab.icon}
                iconPosition="start"
                {...a11yProps(index)}
              />
            ))}
          </Tabs>
        </Box>

        {/* User Status Tab */}
        <TabPanel value={activeTab} index={0}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <Alert severity="info" sx={{ mb: 2 }}>
              <Typography variant="body2">
                Your reputation points automatically decay over time to encourage continued participation. 
                View your current status and projected changes below.
              </Typography>
            </Alert>
            <DecayStatusCard />
          </Box>
        </TabPanel>

        {/* Transaction History Tab */}
        <TabPanel value={activeTab} index={1}>
          <DecayTransactionFilter showOnlyDecay={false} />
        </TabPanel>

        {/* Admin Analytics Tab */}
        {isAdmin && (
          <TabPanel value={activeTab} index={2}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Alert severity="success">
                <Typography variant="body2">
                  <strong>Admin View:</strong> Comprehensive analytics and insights into the decay system's performance.
                </Typography>
              </Alert>
              <DecayAnalytics />
            </Box>
          </TabPanel>
        )}

        {/* Admin History Charts Tab */}
        {isAdmin && (
          <TabPanel value={activeTab} index={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Alert severity="info">
                <Typography variant="body2">
                  <strong>Admin View:</strong> Visualize decay trends and patterns over time.
                </Typography>
              </Alert>
              <DecayHistoryChart />
            </Box>
          </TabPanel>
        )}

        {/* Admin Configuration Tab */}
        {isAdmin && (
          <TabPanel value={activeTab} index={4}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <Alert severity="warning">
                <Typography variant="body2">
                  <strong>Admin Only:</strong> Changes to decay configuration will affect all users. 
                  Use caution when modifying these settings.
                </Typography>
              </Alert>
              <DecayConfigPanel />
            </Box>
          </TabPanel>
        )}

        {/* System Status Footer */}
        <Divider sx={{ my: 3 }} />
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Decay System v1.0 | Last updated: {new Date().toLocaleString()}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {isAdmin ? 'Administrator View' : 'User View'}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default DecayDashboard;
