// src/components/ConnectionStatus.tsx
import React, { useEffect, useState } from 'react';
import { Box, Chip, IconButton, Tooltip } from '@mui/material';
import { CheckCircle, Error as ErrorIcon, Refresh } from '@mui/icons-material';

interface ConnectionStatusProps {
  onConnectionChange?: (isConnected: boolean) => void;
}

const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ onConnectionChange }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [isChecking, setIsChecking] = useState(false);

  const checkConnection = async () => {
    setIsChecking(true);
    try {
      const plug = (window as any)?.ic?.plug;

      if (!plug) {
        setIsConnected(false);
        onConnectionChange?.(false);
        return;
      }

      // Prefer official API; fall back to presence of agent
      let connected = false;
      try {
        connected = (await plug.isConnected?.()) ?? Boolean(plug.agent);
      } catch {
        connected = Boolean(plug.agent);
      }

      setIsConnected(connected);
      onConnectionChange?.(connected);
    } catch (err) {
      console.error('Connection check failed:', err);
      setIsConnected(false);
      onConnectionChange?.(false);
    } finally {
      setIsChecking(false);
    }
  };

  useEffect(() => {
    checkConnection();
    const interval = setInterval(checkConnection, 30_000); // every 30s
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
      <Chip
        icon={isConnected ? <CheckCircle /> : <ErrorIcon />}
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
          <Refresh
            sx={{
              transform: isChecking ? 'rotate(360deg)' : 'none',
              transition: 'transform 1s',
            }}
          />
        </IconButton>
      </Tooltip>
    </Box>
  );
};

export default ConnectionStatus;
