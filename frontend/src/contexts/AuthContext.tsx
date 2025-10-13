import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Principal } from '@dfinity/principal';
import { 
  loginWithII, 
  logout as logoutII, 
  isAuthenticated as checkIIAuth, 
  getPrincipal, 
  II_HOST 
} from '../utils/internetIdentity';
import { makeChildActor, type ChildActor } from '@/lib/canisters';

export type AuthMethod = 'ii' | null; // Changed from 'plug' to 'ii'

interface AuthContextType {
  // Authentication state
  isAuthenticated: boolean;
  authMethod: AuthMethod;
  principal: Principal | null;
  isLoading: boolean;
  
  // Authentication methods
  loginWithInternetIdentity: () => Promise<void>; // Renamed from loginWithPlug
  logout: () => Promise<void>;
  
  // Connection checking
  checkConnection: () => Promise<void>;
  
  // Actor access
  getActor: (canisterId: string) => Promise<ChildActor>;
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
   * Called on mount and after login/logout
   */
  const checkConnection = async () => {
    setIsLoading(true);
    
    try {
      // Check Internet Identity authentication
      const isIIAuth = await checkIIAuth();
      
      if (isIIAuth) {
        const iiPrincipal = await getPrincipal();
        setIsAuthenticated(true);
        setAuthMethod('ii');
        setPrincipal(iiPrincipal);
        console.log('✅ Authenticated with Internet Identity:', iiPrincipal?.toString());
        setIsLoading(false);
        return;
      }

      // No authentication found
      setIsAuthenticated(false);
      setAuthMethod(null);
      setPrincipal(null);
      console.log('ℹ️  No authentication found');
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
   * Login with Internet Identity
   */
  const loginWithInternetIdentity = async () => {
    setIsLoading(true);
    
    try {
      // Initiate II login flow
      const iiPrincipal = await loginWithII();
      
      setIsAuthenticated(true);
      setAuthMethod('ii');
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
      if (authMethod === 'ii') {
        await logoutII();
      }
      
      setIsAuthenticated(false);
      setAuthMethod(null);
      setPrincipal(null);
      
      // Clear localStorage
      localStorage.removeItem('selectedOrgId');
      localStorage.removeItem('userRole');
      localStorage.removeItem('userName');
      
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
   * Uses II identity if authenticated, anonymous otherwise
   */
  const getActor = async (canisterId: string) => {
    if (!isAuthenticated) {
      throw new Error('Not authenticated. Please login first.');
    }

    if (authMethod !== 'ii') {
      throw new Error('Unsupported authentication method');
    }

    return makeChildActor({ canisterId, host: II_HOST });
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
