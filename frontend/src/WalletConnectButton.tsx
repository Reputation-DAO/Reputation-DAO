// src/WalletConnectButton.tsx
import React, { useState, useEffect } from 'react';
import { Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';

const HOST = 'https://icp-api.io';
// If you want a whitelist, set env vars and they'll be used automatically.
const WL = [
  import.meta.env.VITE_FACTORIA_CANISTER_ID as string | undefined,
  import.meta.env.VITE_REPUTATION_DAO_CANISTER_ID as string | undefined,
].filter(Boolean) as string[];

const WalletConnectButton: React.FC = () => {
  const navigate = useNavigate();
  const [isConnected, setIsConnected] = useState(false);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const readPrincipal = async (): Promise<string | null> => {
    const plug = (window as any)?.ic?.plug;
    try {
      const p = await plug?.agent?.getPrincipal?.();
      return p?.toString?.() ?? null;
    } catch {
      return null;
    }
  };

  const checkConnection = async () => {
    try {
      const plug = (window as any)?.ic?.plug;
      if (!plug) {
        setIsConnected(false);
        setPrincipal(null);
        return;
      }

      let connected = false;
      try {
        connected = (await plug.isConnected?.()) ?? Boolean(plug.agent);
      } catch {
        connected = Boolean(plug.agent);
      }

      setIsConnected(connected);
      setPrincipal(connected ? await readPrincipal() : null);
    } catch (err) {
      console.error('Error checking connection:', err);
      setIsConnected(false);
      setPrincipal(null);
    }
  };

  useEffect(() => {
    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleConnect = async () => {
    const plug = (window as any)?.ic?.plug;
    if (!plug) {
      console.error('Plug extension not found.');
      return;
    }

    try {
      setLoading(true);

      // ensure connected
      const connected = await plug.isConnected?.();
      if (!connected) {
        const ok = await plug.requestConnect?.({
          host: HOST,
          whitelist: WL.length ? WL : undefined,
        });
        if (!ok) throw new Error('User rejected Plug connection.');
      }

      // ensure agent
      if (!plug.agent) {
        await plug.createAgent?.({
          host: HOST,
          whitelist: WL.length ? WL : undefined,
        });
      }

      await checkConnection();
    } catch (error) {
      console.error('Connection failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = async () => {
    try {
      setLoading(true);
      const plug = (window as any)?.ic?.plug;

      // Call only if Plug exposes it; some builds don't type it.
      if (plug && typeof plug.disconnect === 'function') {
        await plug.disconnect();
      }

      setIsConnected(false);
      setPrincipal(null);

      // Clear app-scoped data
      localStorage.removeItem('selectedOrgId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');

      navigate('/auth', { replace: true });
    } catch (error) {
      console.error('Disconnect failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return isConnected && principal ? (
    <Button color="inherit" onClick={handleDisconnect} disabled={loading}>
      Disconnect ({principal.slice(0, 8)}…)
    </Button>
  ) : (
    <Button color="inherit" onClick={handleConnect} disabled={loading}>
      {loading ? 'Connecting…' : 'Connect Wallet'}
    </Button>
  );
};

export default WalletConnectButton;
