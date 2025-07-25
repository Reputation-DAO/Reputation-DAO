import React, { useEffect, useState } from 'react';
import { Box, Chip, IconButton, Tooltip } from '@mui/material';
import { CheckCircle, Error, Refresh } from '@mui/icons-material';
import { isPlugConnected } from '../components/canister/reputationDao';

interface ConnectionStatusProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ onConnectionChange }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const connected = await isPlugConnected();
      setIsConnected(connected);
      onConnectionChange?.(connected);
    } catch (error) {
      console.error('Connection check failed:', error);
      setIsConnected(false);
      onConnectionChange?.(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    
    // Check connection status periodically
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, []);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Chip
        icon={isConnected ? <CheckCircle /> : <Error />}
        label={isConnected ? 'Connected' : 'Disconnected'}
        color={isConnected ? 'success' : 'error'}
        size="small"
        variant="outlined"
      />
      <Tooltip title="Check Connection">
        <IconButton
          size="small"
          onClick={checkConnection}
          disabled={isChecking}
          sx={{ color: 'hsl(var(--muted-foreground))' }}
        >
          <Refresh sx={{ transform: isChecking ? 'rotate(360deg)' : 'none', transition: 'transform 1s' }} />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ConnectionStatus;
