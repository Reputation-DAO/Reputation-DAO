import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Principal } from '@dfinity/principal';
import { internetIdentityService } from '../services/internetIdentity';
import { isPlugConnected, getCurrentPrincipal, getPlugActor } from '../components/canister/reputationDao';

export type AuthMethod = 'plug' | 'internet-identity' | null;

interface AuthContextType {
  // Authentication state
  isAuthenticated: boolean;
  authMethod: AuthMethod;
  principal: Principal | null;
  isLoading: boolean;
  
  // Authentication methods
  loginWithPlug: () => Promise<void>;
  loginWithInternetIdentity: () => Promise<void>;
  logout: () => Promise<void>;
  
  // Connection checking
  checkConnection: () => Promise<void>;
  
  // Actor access
  getActor: () => any; // Returns the appropriate actor based on auth method
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>(null);
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Check current authentication status
   */
  const checkConnection = async () => {
    setIsLoading(true);
    
    try {
      // Check Internet Identity first
      const isIIAuthenticated = await internetIdentityService.isAuthenticated();
      if (isIIAuthenticated) {
        const iiPrincipal = internetIdentityService.getPrincipal();
        setIsAuthenticated(true);
        setAuthMethod('internet-identity');
        setPrincipal(iiPrincipal);
        console.log('✅ Authenticated with Internet Identity:', iiPrincipal?.toString());
        setIsLoading(false);
        return;
      }

      // Check Plug wallet
      const isPlugAuth = await isPlugConnected();
      if (isPlugAuth) {
        const plugPrincipal = await getCurrentPrincipal();
        setIsAuthenticated(true);
        setAuthMethod('plug');
        setPrincipal(plugPrincipal);
        console.log('✅ Authenticated with Plug:', plugPrincipal?.toString());
        setIsLoading(false);
        return;
      }

      // No authentication found
      setIsAuthenticated(false);
      setAuthMethod(null);
      setPrincipal(null);
      console.log('ℹ️ No authentication found');
    } catch (error) {
      console.error('❌ Error checking authentication:', error);
      setIsAuthenticated(false);
      setAuthMethod(null);
      setPrincipal(null);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login with Plug wallet
   */
  const loginWithPlug = async () => {
    setIsLoading(true);
    
    try {
      // First logout from Internet Identity if connected
      if (authMethod === 'internet-identity') {
        await internetIdentityService.logout();
      }

      // Connect with Plug
      await getPlugActor();
      const plugPrincipal = await getCurrentPrincipal();
      
      setIsAuthenticated(true);
      setAuthMethod('plug');
      setPrincipal(plugPrincipal);
      
      console.log('✅ Plug login successful:', plugPrincipal?.toString());
    } catch (error) {
      console.error('❌ Plug login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Login with Internet Identity
   */
  const loginWithInternetIdentity = async () => {
    setIsLoading(true);
    
    try {
      // First disconnect Plug if connected
      if (authMethod === 'plug' && window.ic?.plug) {
        await window.ic.plug.disconnect();
      }

      // Login with Internet Identity
      const iiPrincipal = await internetIdentityService.login();
      
      setIsAuthenticated(true);
      setAuthMethod('internet-identity');
      setPrincipal(iiPrincipal);
      
      console.log('✅ Internet Identity login successful:', iiPrincipal.toString());
    } catch (error) {
      console.error('❌ Internet Identity login failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Logout from current authentication method
   */
  const logout = async () => {
    setIsLoading(true);
    
    try {
      if (authMethod === 'internet-identity') {
        await internetIdentityService.logout();
      } else if (authMethod === 'plug' && window.ic?.plug) {
        await window.ic.plug.disconnect();
      }

      setIsAuthenticated(false);
      setAuthMethod(null);
      setPrincipal(null);
      
      console.log('✅ Logout successful');
    } catch (error) {
      console.error('❌ Logout failed:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Get the appropriate actor based on authentication method
   */
  const getActor = () => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated. Please login first.');
    }

    if (authMethod === 'internet-identity') {
      return internetIdentityService.getActor();
    } else if (authMethod === 'plug') {
      // This will be handled by the existing getPlugActor function
      return getPlugActor();
    } else {
      throw new Error('Unknown authentication method');
    }
  };

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, []);

  const value: AuthContextType = {
    isAuthenticated,
    authMethod,
    principal,
    isLoading,
    loginWithPlug,
    loginWithInternetIdentity,
    logout,
    checkConnection,
    getActor,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
