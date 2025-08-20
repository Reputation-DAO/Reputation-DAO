import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { isPlugConnected, getCurrentPrincipal } from '../components/canister/reputationDao';

export const useWalletConnectionMonitor = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const lastPrincipalRef = useRef<string | null>(null);
  const monitoringRef = useRef<NodeJS.Timeout | null>(null);
  const isAuthPageRef = useRef<boolean>(false);

  // Update auth page status
  useEffect(() => {
    isAuthPageRef.current = location.pathname === '/auth' || location.pathname === '/';
  }, [location.pathname]);

  const handleDisconnection = () => {
    console.log('🚨 Wallet disconnection detected, redirecting to auth...');
    
    // Clear any stored organization data
    localStorage.removeItem('selectedOrgId');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    
    // Only redirect if not already on auth page
    if (!isAuthPageRef.current) {
      navigate('/auth', { replace: true });
    }
  };

  const handlePrincipalChange = (newPrincipal: string) => {
    console.log('🔄 Principal change detected:', {
      old: lastPrincipalRef.current,
      new: newPrincipal
    });
    
    // Clear organization data when principal changes
    localStorage.removeItem('selectedOrgId');
    localStorage.removeItem('userRole'); 
    localStorage.removeItem('userName');
    
    // Redirect to auth to re-authenticate with new principal
    if (!isAuthPageRef.current) {
      navigate('/auth', { replace: true });
    }
  };

  const checkWalletConnection = async () => {
    try {
      // Skip monitoring if on auth page
      if (isAuthPageRef.current) {
        return;
      }

      // Check if wallet is still connected
      const isConnected = await isPlugConnected();
      
      if (!isConnected) {
        handleDisconnection();
        return;
      }

      // Check if principal has changed
      const currentPrincipal = await getCurrentPrincipal();
      const currentPrincipalString = currentPrincipal?.toString();
      
      if (lastPrincipalRef.current === null) {
        // First time setting the principal
        lastPrincipalRef.current = currentPrincipalString || null;
      } else if (lastPrincipalRef.current !== currentPrincipalString) {
        // Principal has changed - different wallet connected
        lastPrincipalRef.current = currentPrincipalString || null;
        handlePrincipalChange(currentPrincipalString || 'unknown');
      }

    } catch (error) {
      console.error('Error checking wallet connection:', error);
      // Treat errors as disconnection
      handleDisconnection();
    }
  };

  useEffect(() => {
    // Start monitoring when not on auth page
    if (!isAuthPageRef.current) {
      // Initial check
      checkWalletConnection();

      // Set up periodic monitoring every 2 seconds
      monitoringRef.current = setInterval(checkWalletConnection, 2000);
      
      console.log('🔍 Started wallet connection monitoring');
    } else {
      // Stop monitoring when on auth page
      if (monitoringRef.current) {
        clearInterval(monitoringRef.current);
        monitoringRef.current = null;
        console.log('⏸️ Stopped wallet connection monitoring (on auth page)');
      }
    }

    return () => {
      if (monitoringRef.current) {
        clearInterval(monitoringRef.current);
        monitoringRef.current = null;
        console.log('🛑 Cleaned up wallet connection monitoring');
      }
    };
  }, [isAuthPageRef.current]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (monitoringRef.current) {
        clearInterval(monitoringRef.current);
        monitoringRef.current = null;
      }
    };
  }, []);
};
