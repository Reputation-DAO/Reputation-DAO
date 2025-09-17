// frontend/src/pages/DecaySystemPage.tsx
// @ts-nocheck
import React, { useState, useEffect } from 'react';
import ProtectedPage from '../components/layout/ProtectedPage';
import { useNavigate, useParams } from 'react-router-dom';
import { useRole } from '../contexts/RoleContext';
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
  CircularProgress,
} from '@mui/material';
import {
  ArrowBack as ArrowBackIcon,
  Refresh as RefreshIcon,
  Settings as SettingsIcon,
  Analytics as AnalyticsIcon,
  History as HistoryIcon,
  Dashboard as DashboardIcon,
} from '@mui/icons-material';
import { makeChildWithPlug } from '../components/canister/child';

// Decay UI blocks (now will receive { child, cid } props)
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
function TabPanel({ children, value, index, ...other }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index} id={`decay-tabpanel-${index}`} aria-labelledby={`decay-tab-${index}`} {...other}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const NeumorphicCard: React.FC<{ children: React.ReactNode; height?: string }> = ({ children, height = '100%' }) => (
  <Card
    sx={{
      backgroundColor: 'hsl(var(--background))',
      border: '1px solid hsl(var(--border))',
      borderRadius: 'var(--radius)',
      boxShadow: `4px 4px 10px hsl(var(--muted) / 0.4), -4px -4px 10px hsl(var(--muted) / 0.1)`,
      transition: 'var(--transition-smooth)',
      '&:hover': {
        boxShadow: `6px 6px 14px hsl(var(--primary) / 0.4), -6px -6px 14px hsl(var(--primary) / 0.15)`,
      },
      height,
    }}
  >
    {children}
  </Card>
);

const DecaySystemPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAdmin } = useRole();
  const { cid } = useParams<{ cid: string }>();

  const [currentTab, setCurrentTab] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [testingMode, setTestingMode] = useState(false);

  const [child, setChild] = useState<any>(null);
  const [connecting, setConnecting] = useState(true);
  const [connectError, setConnectError] = useState<string | null>(null);

  // Build child actor from :cid
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        if (!cid) {
          setConnectError('No organization selected.');
          return;
        }
        // Back-compat for any legacy code still reading org from localStorage:
        localStorage.setItem('selectedOrgId', cid);

        const actor = await makeChildWithPlug({ canisterId: cid, host: 'https://icp-api.io' });
        if (mounted) setChild(actor);
      } catch (e: any) {
        if (mounted) setConnectError(e?.message || 'Failed to connect to org canister');
      } finally {
        if (mounted) setConnecting(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [cid]);

  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => setCurrentTab(newValue);
  const handleRefresh = () => setRefreshKey((prev) => prev + 1);
  const handleBack = () => navigate(`/dashboard/home/${cid ?? ''}`);

  const tabs = [
    { label: 'Overview', icon: <DashboardIcon />, value: 0 },
    { label: 'Analytics', icon: <AnalyticsIcon />, value: 1 },
    { label: 'History', icon: <HistoryIcon />, value: 2 },
    ...(isAdmin ? [{ label: 'Configuration', icon: <SettingsIcon />, value: 3 }] : []),
  ];

  // Connect state
  if (connecting) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'hsl(var(--background))' }}>
        <CircularProgress sx={{ color: 'hsl(var(--primary))' }} />
      </Box>
    );
  }
  if (!cid || connectError) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">{connectError || 'No organization selected.'}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: 'hsl(var(--background))', px: { xs: 3, md: 6, lg: 8 }, py: { xs: 4, md: 6 } }}>
      {/* Header */}
      <Box sx={{ mb: 6 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <IconButton
            onClick={handleBack}
            sx={{
              mr: 3,
              p: 2,
              color: 'hsl(var(--muted-foreground))',
              '&:hover': { color: 'hsl(var(--foreground))', backgroundColor: 'hsl(var(--muted))' },
            }}
          >
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h3" sx={{ color: 'hsl(var(--foreground))', fontWeight: 700, fontSize: { xs: '1.875rem', md: '2.5rem' }, flex: 1 }}>
            Reputation Decay System
          </Typography>
          <Chip label={`Org: ${cid}`} size="small" sx={{ mr: 2, bgcolor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' }} />
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={testingMode}
                  onChange={(e) => setTestingMode(e.target.checked)}
                  sx={{
                    '& .MuiSwitch-switchBase.Mui-checked': { color: 'hsl(var(--warning))' },
                    '& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track': { backgroundColor: 'hsl(var(--warning))' },
                  }}
                />
              }
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography sx={{ color: 'hsl(var(--muted-foreground))' }}>Testing Mode</Typography>
                  {testingMode && (
                    <Chip
                      label="MINUTES"
                      size="small"
                      sx={{ fontSize: '0.6rem', height: 20, backgroundColor: 'hsl(var(--warning))', color: 'hsl(var(--warning-foreground))' }}
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
                '&:hover': { backgroundColor: 'hsl(var(--primary))', color: 'hsl(var(--primary-foreground))' },
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Box>
        </Box>
        <Typography sx={{ color: 'hsl(var(--muted-foreground))', fontSize: '1.125rem', fontWeight: 400, ml: 8 }}>
          Monitor and configure automatic reputation decay to maintain system balance
        </Typography>
      </Box>

      {/* Testing Mode Alert */}
      {testingMode && (
        <Alert
          severity="warning"
          sx={{
            mb: 6,
            borderRadius: 'var(--radius)',
            '& .MuiAlert-message': { fontSize: '1rem', color: 'hsl(var(--foreground))' },
            backgroundColor: 'hsl(var(--muted))',
          }}
          action={
            <Button color="inherit" size="small" onClick={() => setTestingMode(false)} sx={{ color: 'hsl(var(--foreground))' }}>
              Disable
            </Button>
          }
        >
          <Typography>
            <strong>Testing Mode Active:</strong> Consider using minute-scale intervals in configuration for real-time testing.
          </Typography>
        </Alert>
      )}

      {/* Tabs */}
      <Paper
        elevation={0}
        sx={{
          backgroundColor: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          borderRadius: 'var(--radius)',
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
              '&.Mui-selected': { color: 'hsl(var(--primary))', fontWeight: 600 },
            },
            '& .MuiTabs-indicator': { backgroundColor: 'hsl(var(--primary))', height: 3 },
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

      {/* Tab Content */}
      <Box>
        <TabPanel value={currentTab} index={0}>
          <Stack spacing={4}>
            {/* Overview status pulls getDecayConfig/getDecayStatistics from child */}
            <DecayStatusCard key={`status-${refreshKey}`} child={child} cid={cid} />

            <Box sx={{ display: 'block', gap: 4 }}>
              <Box sx={{ flex: 1 }}>
                <NeumorphicCard height="100%">
                  <CardContent sx={{ p: 4, height: '100%' }}>
                    <Typography sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600, mb: 3 }}>
                      Recent Decay Activity
                    </Typography>
                    <DecayHistoryChart key={`history-overview-${refreshKey}`} child={child} cid={cid} />
                  </CardContent>
                </NeumorphicCard>
              </Box>

              <br />

              <Box sx={{ flex: 1 }}>
                <NeumorphicCard height="100%">
                  <CardContent sx={{ p: 4 }}>
                    <Typography sx={{ color: 'hsl(var(--muted-foreground))', fontWeight: 600, mb: 3 }}>
                      Quick Filters
                    </Typography>
                    <DecayTransactionFilter key={`filter-overview-${refreshKey}`} child={child} cid={cid} />
                  </CardContent>
                </NeumorphicCard>
              </Box>
            </Box>
          </Stack>
        </TabPanel>

        <TabPanel value={currentTab} index={1}>
          <NeumorphicCard>
            <CardContent sx={{ p: 4 }}>
              <DecayAnalytics key={`analytics-${refreshKey}`} child={child} cid={cid} />
            </CardContent>
          </NeumorphicCard>
        </TabPanel>

        <TabPanel value={currentTab} index={2}>
          <NeumorphicCard>
            <CardContent sx={{ p: 4 }}>
              <DecayHistoryChart key={`history-tab-${refreshKey}`} child={child} cid={cid} />
            </CardContent>
          </NeumorphicCard>
        </TabPanel>

        {isAdmin && (
          <TabPanel value={currentTab} index={3}>
            <NeumorphicCard>
              <CardContent sx={{ p: 4 }}>
                {/* Config panel will call child.configureDecay(...) / processBatchDecay() */}
                <DecayConfigPanel
                  key={`config-${refreshKey}`}
                  child={child}
                  cid={cid}
                  testingMode={testingMode}
                  onConfigUpdate={() => setRefreshKey((prev) => prev + 1)}
                />
              </CardContent>
            </NeumorphicCard>
          </TabPanel>
        )}
      </Box>
    </Box>
  );
};

const DecaySystemPageWithProtection: React.FC = () => (
  <ProtectedPage>
    <DecaySystemPage />
  </ProtectedPage>
);

export default DecaySystemPageWithProtection;
