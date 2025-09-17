// src/hooks/useWalletConnectionMonitor.ts
import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const useWalletConnectionMonitor = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const lastPrincipalRef = useRef<string | null>(null);
  const monitoringRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isAuthPageRef = useRef<boolean>(false);

  // Update auth page status whenever the URL changes
  useEffect(() => {
    isAuthPageRef.current = location.pathname === '/auth' || location.pathname === '/';
  }, [location.pathname]);

  const handleDisconnection = () => {
    console.log('🚨 Wallet disconnection detected, redirecting to auth...');
    localStorage.removeItem('selectedOrgId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');

    if (!isAuthPageRef.current) navigate('/auth', { replace: true });
  };

  const handlePrincipalChange = (newPrincipal: string) => {
    console.log('🔄 Principal change detected:', {
      old: lastPrincipalRef.current,
      new: newPrincipal,
    });

    localStorage.removeItem('selectedOrgId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');

    if (!isAuthPageRef.current) navigate('/auth', { replace: true });
  };

  const checkWalletConnection = async () => {
    try {
      if (isAuthPageRef.current) return;

      const plug = (window as any)?.ic?.plug;

      // If Plug isn't present at all → treat as disconnected
      if (!plug) {
        handleDisconnection();
        return;
      }

      // Determine connection state (prefer isConnected, fall back to presence of agent)
      let isConnected = false;
      try {
        isConnected = (await plug.isConnected?.()) ?? Boolean(plug.agent);
      } catch {
        isConnected = Boolean(plug.agent);
      }

      if (!isConnected) {
        handleDisconnection();
        return;
      }

      // Get current principal via Plug's agent (most reliable)
      let currentPrincipalString: string | null = null;
      try {
        const principal = await plug.agent?.getPrincipal?.();
        currentPrincipalString = principal?.toString?.() ?? null;
      } catch {
        currentPrincipalString = null;
      }

      // If we cannot read principal, treat as disconnected
      if (!currentPrincipalString) {
        handleDisconnection();
        return;
      }

      // First capture
      if (lastPrincipalRef.current === null) {
        lastPrincipalRef.current = currentPrincipalString;
        return;
      }

      // Detect principal switch
      if (lastPrincipalRef.current !== currentPrincipalString) {
        lastPrincipalRef.current = currentPrincipalString;
        handlePrincipalChange(currentPrincipalString);
      }
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      handleDisconnection();
    }
  };

  // Start/stop monitoring when the route changes (auth vs app)
  useEffect(() => {
    // Start monitoring if not on auth page
    if (!isAuthPageRef.current) {
      void checkWalletConnection(); // initial check
      monitoringRef.current = setInterval(checkWalletConnection, 2000);
      console.log('🔍 Started wallet connection monitoring');
    } else {
      // Stop monitoring on auth
      if (monitoringRef.current) {
        clearInterval(monitoringRef.current);
        monitoringRef.current = null;
        console.log('⏸️ Stopped wallet connection monitoring (on auth page)');
      }
      // reset lastPrincipal when landing on auth so a new login is treated as fresh
      lastPrincipalRef.current = null;
    }

    return () => {
      if (monitoringRef.current) {
        clearInterval(monitoringRef.current);
        monitoringRef.current = null;
        console.log('🛑 Cleaned up wallet connection monitoring');
      }
    };
  }, [location.pathname]); // react to route changes
};
