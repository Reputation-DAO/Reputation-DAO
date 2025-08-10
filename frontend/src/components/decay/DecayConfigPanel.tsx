import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  Box,
  Typography,
  TextField,
  Button,
  Switch,
  FormControlLabel,
  Alert,
  Divider,
  Tooltip,
  IconButton,
  Snackbar,
  CircularProgress,
} from '@mui/material';
import {
  Settings as SettingsIcon,
  Save as SaveIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useRole } from '../../contexts/RoleContext';
import {
  getDecayConfig,
  configureDecay,
  type DecayConfig,
} from '../canister/reputationDao';

interface DecayConfigPanelProps {
  className?: string;
  onConfigUpdate?: (config: DecayConfig) => void;
}

const DecayConfigPanel: React.FC<DecayConfigPanelProps> = ({ className, onConfigUpdate }) => {
  const { isAdmin } = useRole();
  const [config, setConfig] = useState<DecayConfig>({
    decayRate: 500, // 5%
    decayInterval: 300, // 5 minutes for testing
    minThreshold: 10,
    gracePeriod: 300, // 5 minutes for testing
    enabled: true,
  });
  const [originalConfig, setOriginalConfig] = useState<DecayConfig | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [testingMode, setTestingMode] = useState(true); // Enable testing mode by default
  // Track if there are changes pending save
  const isChanged = originalConfig && (
    originalConfig.decayRate !== config.decayRate ||
    originalConfig.decayInterval !== config.decayInterval ||
    originalConfig.minThreshold !== config.minThreshold ||
    originalConfig.gracePeriod !== config.gracePeriod ||
    originalConfig.enabled !== config.enabled
  );

  useEffect(() => {
    if (isAdmin) {
      fetchConfig();
    }
  }, [isAdmin]);

  const fetchConfig = async () => {
    setLoading(true);
    setError(null);

    try {
      const currentConfig = await getDecayConfig();
      if (currentConfig) {
        setConfig(currentConfig);
        setOriginalConfig(currentConfig);
      }
    } catch (err) {
      console.error('Error fetching decay config:', err);
      setError('Failed to fetch current configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!config) {
      setError('No configuration to save');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      console.log('Saving decay config:', config);
      const result = await configureDecay(
        config.decayRate,
        config.decayInterval,
        config.minThreshold,
        config.gracePeriod,
        config.enabled
      );

      console.log('Save result:', result);
      
      if (result && (result.includes('Success') || result.includes('configured'))) {
        setSuccessMessage('Decay configuration updated successfully!');
        setOriginalConfig({ ...config });
        onConfigUpdate?.(config);
        // Refresh the config to ensure we have the latest state
        await fetchConfig();
      } else {
        setError(result || 'Unknown error occurred while saving');
      }
    } catch (err: any) {
      console.error('Error saving decay config:', err);
      setError(err.message || 'Failed to save configuration');
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (originalConfig) {
      setConfig(originalConfig);
    }
  };

  // Helper functions for formatting
  const formatDays = (seconds: number) => Math.floor(seconds / 86400);
  const formatMinutes = (seconds: number) => Math.floor(seconds / 60);
  const formatPercentage = (basisPoints: number) => (basisPoints / 100).toFixed(2);

  if (!isAdmin) {
    return (
      <Card className={className}>
        <CardContent>
          <Alert severity="warning">
            Only administrators can access decay configuration settings.
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className={className}>
        <CardHeader
          title={
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <SettingsIcon />
              <Typography variant="h6">Decay Configuration</Typography>
              {config.enabled ? (
                <Tooltip title="Decay is currently enabled">
                  <IconButton size="small" color="success">
                    <InfoIcon />
                  </IconButton>
                </Tooltip>
              ) : (
                <Tooltip title="Decay is currently disabled">
                  <IconButton size="small" color="warning">
                    <WarningIcon />
                  </IconButton>
                </Tooltip>
              )}
            </Box>
          }
          action={
            <Button
              startIcon={<RefreshIcon />}
              onClick={fetchConfig}
              disabled={loading}
              size="small"
            >
              Refresh
            </Button>
          }
        />
        <CardContent>
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {/* Enable/Disable Decay */}
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={config.enabled}
                      onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                      color="primary"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">
                        Enable Point Decay
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Turn decay system on or off globally
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Testing Mode Toggle */}
              <Box sx={{ mb: 3 }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={testingMode}
                      onChange={(e) => setTestingMode(e.target.checked)}
                      color="warning"
                    />
                  }
                  label={
                    <Box>
                      <Typography variant="body1">
                        Testing Mode (Minutes Instead of Days)
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Use minutes instead of days for real-time testing
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Configuration Fields */}
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3, mt: 2 }}>
                {/* Decay Rate */}
                <TextField
                  fullWidth
                  label="Decay Rate (%)"
                  type="number"
                  value={formatPercentage(config.decayRate)}
                  onChange={(e) => setConfig({ ...config, decayRate: Math.round(parseFloat(e.target.value) * 100) })}
                  disabled={!config.enabled}
                  helperText="Percentage of points to decay per interval"
                  inputProps={{ min: 0, max: 100, step: 0.1 }}
                />

                {/* Decay Interval */}
                <TextField
                  fullWidth
                  label={testingMode ? "Decay Interval (Minutes)" : "Decay Interval (Days)"}
                  type="number"
                  value={testingMode ? formatMinutes(config.decayInterval) : formatDays(config.decayInterval)}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    const seconds = testingMode ? value * 60 : value * 86400;
                    setConfig({ ...config, decayInterval: seconds });
                  }}
                  disabled={!config.enabled}
                  helperText={testingMode ? "How often decay occurs (in minutes)" : "How often decay occurs (in days)"}
                  inputProps={{ min: 1, max: testingMode ? 1440 : 365 }}
                />

                {/* Minimum Threshold */}
                <TextField
                  fullWidth
                  label="Minimum Threshold"
                  type="number"
                  value={config.minThreshold}
                  onChange={(e) => setConfig({ ...config, minThreshold: parseInt(e.target.value) })}
                  disabled={!config.enabled}
                  helperText="Points below this amount won't decay"
                  inputProps={{ min: 0, max: 1000 }}
                />

                {/* Grace Period */}
                <TextField
                  fullWidth
                  label={testingMode ? "Grace Period (Minutes)" : "Grace Period (Days)"}
                  type="number"
                  value={testingMode ? formatMinutes(config.gracePeriod) : formatDays(config.gracePeriod)}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    const seconds = testingMode ? value * 60 : value * 86400;
                    setConfig({ ...config, gracePeriod: seconds });
                  }}
                  disabled={!config.enabled}
                  helperText={testingMode ? "New users protected from decay (in minutes)" : "New users protected from decay (in days)"}
                  inputProps={{ min: 0, max: testingMode ? 1440 : 365 }}
                />
              </Box>

              {/* Configuration Preview */}
              {config.enabled && (
                <Box sx={{ mt: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}>
                  <Typography variant="subtitle2" gutterBottom>
                    Configuration Summary
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Users will lose <strong>{formatPercentage(config.decayRate)}%</strong> of their points 
                    every <strong>{testingMode ? formatMinutes(config.decayInterval) : formatDays(config.decayInterval)} {testingMode ? 'minutes' : 'days'}</strong>.
                    Points below <strong>{config.minThreshold}</strong> are protected.
                    New users get <strong>{testingMode ? formatMinutes(config.gracePeriod) : formatDays(config.gracePeriod)} {testingMode ? 'minutes' : 'days'}</strong> protection.
                  </Typography>
                  {testingMode && (
                    <Typography variant="body2" color="warning.main" sx={{ mt: 1, fontWeight: 'bold' }}>
                      ⚠️ Testing Mode: Using minutes instead of days for real-time testing
                    </Typography>
                  )}
                </Box>
              )}

              {/* Action Buttons */}
              <Box sx={{ display: 'flex', gap: 2, mt: 3 }}>
                <Button
                  variant="contained"
                  startIcon={saving ? <CircularProgress size={16} /> : <SaveIcon />}
                  onClick={handleSave}
                  disabled={saving || !isChanged}
                  color="primary"
                >
                  {saving ? 'Saving...' : (isChanged ? 'Save Configuration' : 'No Changes')}
                </Button>

                <Button
                  variant="outlined"
                  onClick={handleReset}
                  disabled={!originalConfig}
                >
                  Reset to Default
                </Button>
              </Box>

              {config.enabled && (
                <Alert severity={isChanged ? 'warning' : 'info'} sx={{ mt: 2 }}>
                  {isChanged ? 'Unsaved changes detected. Save to apply new decay behavior.' : 'Configuration is up to date. Changes apply immediately when saved.'}
                </Alert>
              )}
            </Box>
          )}
        </CardContent>
      </Card>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={4000}
        onClose={() => setSuccessMessage(null)}
      >
        <Alert severity="success" onClose={() => setSuccessMessage(null)}>
          {successMessage}
        </Alert>
      </Snackbar>
    </>
  );
};

export default DecayConfigPanel;
