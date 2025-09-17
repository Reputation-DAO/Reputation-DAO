// src/hooks/usePlugConnection.ts
import { useState, useEffect } from 'react';

type ConnectOpts = {
  host?: string;                // default icp-api.io
  whitelist?: string[];         // optional canister whitelist
  canisterId?: string;          // convenience to build a single-item whitelist
};

export const usePlugConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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
      setIsLoading(true);
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

      if (connected) {
        setPrincipal(await readPrincipal());
      } else {
        setPrincipal(null);
      }
    } catch (error) {
      console.error('Error checking connection:', error);
      setIsConnected(false);
      setPrincipal(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkConnection();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const connect = async (opts?: ConnectOpts) => {
    const plug = (window as any)?.ic?.plug;
    if (!plug) {
      throw new Error('Plug extension not found. Please install/enable Plug.');
    }

    const host = opts?.host ?? 'https://icp-api.io';
    const whitelist =
      opts?.whitelist ??
      (opts?.canisterId ? [opts.canisterId] : undefined);

    try {
      setIsLoading(true);

      // Ensure connected
      const connected = await plug.isConnected?.();
      if (!connected) {
        const ok = await plug.requestConnect?.({ host, whitelist });
        if (!ok) throw new Error('User rejected Plug connection.');
      }

      // Ensure agent exists
      if (!plug.agent) {
        await plug.createAgent?.({ host, whitelist });
      }

      // Update state
      await checkConnection();
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    try {
      setIsLoading(true);
      const plug = (window as any)?.ic?.plug;

      // Some Plug builds expose disconnect(); call it if present (typed as any to avoid TS errors)
      if (plug && typeof plug.disconnect === 'function') {
        await plug.disconnect();
      }

      // Reset local state regardless
      setIsConnected(false);
      setPrincipal(null);
    } catch (error) {
      console.error('Disconnect failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    isConnected,
    principal,
    isLoading,
    connect,
    disconnect,
    checkConnection,
  };
};
