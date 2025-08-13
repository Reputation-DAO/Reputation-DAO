import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { getCurrentPrincipal, getPlugActor, isPlugConnected } from './components/canister/reputationDao';

const WalletConnectButton: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checkConnection = async () => {
    try {
      const connected = await isPlugConnected();
      setIsConnected(connected);
      
      if (connected) {
        const currentPrincipal = await getCurrentPrincipal();
        setPrincipal(currentPrincipal?.toString() || null);
      } else {
        setPrincipal(null);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setIsConnected(false);
      setPrincipal(null);
    }
  };

  useEffect(() => {
    checkConnection();
  }, []);

  const handleConnect = async () => {
    try {
      setLoading(true);
      await getPlugActor(); // This will trigger connection if needed
      await checkConnection();
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      if (window.ic?.plug) {
        await window.ic.plug.disconnect();
        setIsConnected(false);
        setPrincipal(null);
      }
    } catch (error) {
      console.error('Disconnect failed:', error);
    }
  };

  return isConnected && principal ? (
    <Button color="inherit" onClick={handleDisconnect} disabled={loading}>
      Disconnect ({principal.slice(0, 8)}...)
    </Button>
  ) : (
    <Button color="inherit" onClick={handleConnect} disabled={loading}>
      {loading ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
};

export default WalletConnectButton;
