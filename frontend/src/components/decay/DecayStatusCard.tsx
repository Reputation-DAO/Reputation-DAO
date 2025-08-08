import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Box,
  Typography,
  Chip,
  LinearProgress,
  Tooltip,
  IconButton,
  Collapse,
} from '@mui/material';
import {
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  NewReleases as NewReleasesIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { useRole } from '../../contexts/RoleContext';
import {
  getBalanceWithDetails,
  getDecayConfig,
  calculateDaysUntilDecay,
  isInGracePeriod,
  getDecayStatus,
  type DecayConfig,
  type BalanceWithDetails,
} from '../canister/reputationDao';

interface DecayStatusCardProps {
  className?: string;
}

const DecayStatusCard: React.FC<DecayStatusCardProps> = ({ className }) => {
  const { currentPrincipal } = useRole();
  const [balanceDetails, setBalanceDetails] = useState<BalanceWithDetails | null>(null);
  const [decayConfig, setDecayConfig] = useState<DecayConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentPrincipal) {
      fetchDecayData();
    }
  }, [currentPrincipal]);

  const fetchDecayData = async () => {
    if (!currentPrincipal) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const [details, config] = await Promise.all([
        getBalanceWithDetails(currentPrincipal),
        getDecayConfig(),
      ]);
      
      setBalanceDetails(details);
      setDecayConfig(config);
    } catch (err) {
      console.error('Error fetching decay data:', err);
      setError('Failed to fetch decay information');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'safe': return 'success';
      case 'grace': return 'info';
      case 'at-risk': return 'warning';
      case 'decaying': return 'error';
      default: return 'default';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'safe': return <CheckCircleIcon />;
      case 'grace': return <NewReleasesIcon />;
      case 'at-risk': return <WarningIcon />;
      case 'decaying': return <ScheduleIcon />;
      default: return <InfoIcon />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'safe': return 'Safe from Decay';
      case 'grace': return 'Grace Period';
      case 'at-risk': return 'Decay Soon';
      case 'decaying': return 'Decay Pending';
      default: return 'Unknown';
    }
  };

  const formatTimeRemaining = (days: number) => {
    if (days <= 0) return 'Decay available now';
    if (days === 1) return '1 day remaining';
    return `${days} days remaining`;
  };

  const getDecayProgress = (daysUntilDecay: number, intervalDays: number) => {
    if (intervalDays === 0) return 0;
    return Math.max(0, Math.min(100, ((intervalDays - daysUntilDecay) / intervalDays) * 100));
  };

  if (loading) {
    return (
      <Card className={className}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ScheduleIcon color="disabled" />
            <Typography variant="h6" color="text.secondary">
              Loading decay status...
            </Typography>
          </Box>
          <LinearProgress sx={{ mt: 2 }} />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className={className}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <WarningIcon color="error" />
            <Typography variant="h6" color="error">
              {error}
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  if (!balanceDetails || !decayConfig) {
    return (
      <Card className={className}>
        <CardContent>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <InfoIcon color="disabled" />
            <Typography variant="h6" color="text.secondary">
              No decay information available
            </Typography>
          </Box>
        </CardContent>
      </Card>
    );
  }

  const status = getDecayStatus(balanceDetails.currentBalance, balanceDetails.decayInfo || null, decayConfig);
  const daysUntilDecay = balanceDetails.decayInfo ? 
    calculateDaysUntilDecay(balanceDetails.decayInfo, decayConfig) : 0;
  const intervalDays = Math.floor(decayConfig.decayInterval / 86400);
  const progress = getDecayProgress(daysUntilDecay, intervalDays);

  return (
    <Card className={className} sx={{ position: 'relative' }}>
      <CardContent>
        {/* Header */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {getStatusIcon(status)}
            <Typography variant="h6" component="div">
              Point Decay Status
            </Typography>
          </Box>
          <Chip
            label={getStatusLabel(status)}
            color={getStatusColor(status) as any}
            size="small"
            variant="outlined"
          />
        </Box>

        {/* Status Overview */}
        <Box sx={{ mb: 2 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Current Balance: <strong>{balanceDetails.currentBalance}</strong>
            {balanceDetails.pendingDecay > 0 && (
              <Tooltip title={`${balanceDetails.pendingDecay} points will decay`}>
                <Chip 
                  label={`-${balanceDetails.pendingDecay}`} 
                  size="small" 
                  color="warning" 
                  sx={{ ml: 1 }} 
                />
              </Tooltip>
            )}
          </Typography>

          {decayConfig.enabled && balanceDetails.decayInfo && (
            <Typography variant="body2" color="text.secondary">
              {formatTimeRemaining(daysUntilDecay)}
            </Typography>
          )}
        </Box>

        {/* Progress Bar */}
        {decayConfig.enabled && status !== 'safe' && status !== 'grace' && (
          <Box sx={{ mb: 2 }}>
            <LinearProgress
              variant="determinate"
              value={progress}
              color={status === 'at-risk' ? 'warning' : 'error'}
              sx={{ height: 8, borderRadius: 4 }}
            />
            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
              Progress to next decay
            </Typography>
          </Box>
        )}

        {/* Expand/Collapse Button */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 1 }}>
          <IconButton
            onClick={() => setExpanded(!expanded)}
            size="small"
            color="primary"
          >
            {expanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          </IconButton>
        </Box>

        {/* Expanded Details */}
        <Collapse in={expanded}>
          <Box sx={{ mt: 2, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
            <Typography variant="subtitle2" gutterBottom>
              Decay Details
            </Typography>
            
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2, fontSize: '0.875rem' }}>
              <Box>
                <Typography variant="caption" color="text.secondary">
                  Raw Balance
                </Typography>
                <Typography variant="body2">
                  {balanceDetails.rawBalance}
                </Typography>
              </Box>

              <Box>
                <Typography variant="caption" color="text.secondary">
                  Pending Decay
                </Typography>
                <Typography variant="body2" color={balanceDetails.pendingDecay > 0 ? 'warning.main' : 'text.primary'}>
                  {balanceDetails.pendingDecay}
                </Typography>
              </Box>

              {balanceDetails.decayInfo && (
                <>
                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Total Decayed
                    </Typography>
                    <Typography variant="body2">
                      {balanceDetails.decayInfo.totalDecayed}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Registration
                    </Typography>
                    <Typography variant="body2">
                      {new Date(balanceDetails.decayInfo.registrationTime * 1000).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Last Decay
                    </Typography>
                    <Typography variant="body2">
                      {new Date(balanceDetails.decayInfo.lastDecayTime * 1000).toLocaleDateString()}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography variant="caption" color="text.secondary">
                      Last Activity
                    </Typography>
                    <Typography variant="body2">
                      {new Date(balanceDetails.decayInfo.lastActivityTime * 1000).toLocaleDateString()}
                    </Typography>
                  </Box>
                </>
              )}
            </Box>

            {/* Configuration Info */}
            <Box sx={{ mt: 2, p: 1, bgcolor: 'grey.50', borderRadius: 1 }}>
              <Typography variant="caption" color="text.secondary">
                System Configuration
              </Typography>
              <Typography variant="body2" sx={{ fontSize: '0.75rem' }}>
                {decayConfig.decayRate / 100}% every {intervalDays} days, min {decayConfig.minThreshold} points
              </Typography>
              {isInGracePeriod(balanceDetails.decayInfo!, decayConfig) && (
                <Typography variant="body2" color="info.main" sx={{ fontSize: '0.75rem' }}>
                  You're in the grace period - no decay for new users!
                </Typography>
              )}
            </Box>
          </Box>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default DecayStatusCard;
