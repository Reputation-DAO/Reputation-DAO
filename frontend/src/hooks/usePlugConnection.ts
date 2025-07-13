import { useState, useEffect } from 'react';
import { isPlugConnected, getCurrentPrincipal, getPlugActor } from '../components/canister/reputationDao';

export const usePlugConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [principal, setPrincipal] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const checkConnection = async () => {
    try {
      setIsLoading(true);
      const connected = await isPlugConnected();
      setIsConnected(connected);
      
      if (connected) {
        try {
          const currentPrincipal = await getCurrentPrincipal();
          setPrincipal(currentPrincipal.toString());
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

  useEffect(() => {
    checkConnection();
  }, []);

  const connect = async () => {
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
    checkConnection
  };
};
