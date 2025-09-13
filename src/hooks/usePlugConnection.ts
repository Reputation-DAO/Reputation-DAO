import { useState, useEffect } from 'react';
import { isPlugConnected, getCurrentPrincipal, getPlugActor } from '../components/canister/reputationDao';
import { useRoute } from '../contexts/RouteContext';

interface UsePlugConnectionOptions {
  autoCheck?: boolean; // Whether to automatically check connection on mount
}

export const usePlugConnection = (options: UsePlugConnectionOptions = {}) => {
  const { autoCheck = false } = options;
  const { isPlugAllowed, currentRoute } = useRoute();
  const [isConnected, setIsConnected] = useState(false);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(autoCheck && isPlugAllowed); // Only true initially if autoCheck is enabled AND route allows Plug

  const checkConnection = async () => {
    // Block Plug access on restricted routes
    if (!isPlugAllowed) {
      console.log(`🚫 Plug access blocked on route: ${currentRoute}`);
      setIsConnected(false);
      setPrincipal(null);
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const connected = await isPlugConnected();
      setIsConnected(connected);
      
      if (connected) {
        try {
          const currentPrincipal = await getCurrentPrincipal();
          setPrincipal(currentPrincipal?.toString() || null);
        } catch (error) {
          console.error('Error getting principal:', error);
          setPrincipal(null);
        }
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

  // REMOVED: useEffect that automatically checks connection on mount
  // This was causing Plug to initialize on every page
  
  // Only auto-check if explicitly requested (for authenticated pages) AND route allows Plug
  useEffect(() => {
    if (autoCheck && isPlugAllowed) {
      checkConnection();
    } else if (!isPlugAllowed) {
      // Reset state when route doesn't allow Plug
      setIsConnected(false);
      setPrincipal(null);
      setIsLoading(false);
    }
  }, [autoCheck, isPlugAllowed, currentRoute]);

  const connect = async () => {
    // Block Plug connection on restricted routes
    if (!isPlugAllowed) {
      console.log(`🚫 Plug connection blocked on route: ${currentRoute}`);
      throw new Error('Plug connection not allowed on this route');
    }

    try {
      setIsLoading(true);
      await getPlugActor(); // This will handle connection if needed
      await checkConnection();
    } catch (error) {
      console.error('Connection failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const disconnect = async () => {
    // Allow disconnect on any route
    try {
      setIsLoading(true);
      if (window.ic?.plug) {
        await window.ic.plug.disconnect();
      }
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
    checkConnection // Export checkConnection so components can manually check when needed
  };
};
