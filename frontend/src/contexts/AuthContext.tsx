import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Principal } from '@dfinity/principal';
import {
  ensurePlugAgent,
  getPlugPrincipal,
  isPlugConnected,
  disconnectPlug,
  PLUG_HOST,
} from '../utils/plug';
import {
  isInternetIdentityAuthenticated,
  loginInternetIdentity,
  logoutInternetIdentity,
  getInternetIdentityPrincipal,
} from '@/utils/internetIdentity';
import {
  makeChildActor,
  type ChildActor,
  makeFactoriaWithPlug,
  makeFactoriaWithInternetIdentity,
  getFactoriaCanisterId,
} from '@/lib/canisters';
import type { _SERVICE as FactoriaActor } from '@/declarations/factoria/factoria.did.d.ts';

export type AuthMethod = 'plug' | 'internetIdentity' | null;

const STORAGE_KEY = 'repdao:authMethod';

function saveAuthMethod(method: AuthMethod) {
  if (typeof window === 'undefined') return;
  if (!method) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }
  try {
    window.localStorage.setItem(STORAGE_KEY, method);
  } catch {
    /* ignore persistence errors */
  }
}

function loadAuthMethod(): AuthMethod {
  if (typeof window === 'undefined') return null;
  try {
    const value = window.localStorage.getItem(STORAGE_KEY);
    return value === 'plug' || value === 'internetIdentity' ? value : null;
  } catch {
    return null;
  }
}

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
  getChildActor: (canisterId: string) => Promise<ChildActor>;
  getFactoriaActor: () => Promise<FactoriaActor>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>(loadAuthMethod());
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const resolvePlugPrincipal = async (): Promise<Principal | null> => {
    if (!(await isPlugConnected())) return null;
    try {
      return await getPlugPrincipal();
    } catch (err) {
      console.error('Failed to read Plug principal:', err);
      return null;
    }
  };

  const resolveInternetIdentityPrincipal = async (): Promise<Principal | null> => {
    try {
      if (!(await isInternetIdentityAuthenticated())) return null;
      return await getInternetIdentityPrincipal();
    } catch (err) {
      console.error('Failed to read Internet Identity principal:', err);
      return null;
    }
  };

  /**
   * Check current authentication status
   */
  const checkConnection = async () => {
    setIsLoading(true);

    try {
      const last = loadAuthMethod();
      const order: AuthMethod[] =
        last === 'plug'
          ? ['plug', 'internetIdentity']
          : last === 'internetIdentity'
          ? ['internetIdentity', 'plug']
          : ['plug', 'internetIdentity'];

      for (const method of order) {
        if (method === 'plug') {
          const plugPrincipal = await resolvePlugPrincipal();
          if (plugPrincipal) {
            setIsAuthenticated(true);
            setAuthMethod('plug');
            setPrincipal(plugPrincipal);
            saveAuthMethod('plug');
            console.log('✅ Authenticated with Plug:', plugPrincipal.toString());
            return;
          }
        } else if (method === 'internetIdentity') {
          const iiPrincipal = await resolveInternetIdentityPrincipal();
          if (iiPrincipal) {
            setIsAuthenticated(true);
            setAuthMethod('internetIdentity');
            setPrincipal(iiPrincipal);
            saveAuthMethod('internetIdentity');
            console.log('✅ Authenticated with Internet Identity:', iiPrincipal.toString());
            return;
          }
        }
      }

      setIsAuthenticated(false);
      setAuthMethod(null);
      setPrincipal(null);
      saveAuthMethod(null);
      console.log('ℹ️ No authentication found');
    } catch (error) {
      console.error('❌ Error checking authentication:', error);
      setIsAuthenticated(false);
      setAuthMethod(null);
      setPrincipal(null);
      saveAuthMethod(null);
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
      // Connect with Plug
      await ensurePlugAgent({ host: PLUG_HOST });
      const plugPrincipal = await getPlugPrincipal();
      
      setIsAuthenticated(true);
      setAuthMethod('plug');
      setPrincipal(plugPrincipal);
      saveAuthMethod('plug');
      
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
      await loginInternetIdentity();
      const iiPrincipal = await resolveInternetIdentityPrincipal();
      if (!iiPrincipal) {
        throw new Error('Internet Identity login succeeded but principal is unavailable.');
      }

      setIsAuthenticated(true);
      setAuthMethod('internetIdentity');
      setPrincipal(iiPrincipal);
      saveAuthMethod('internetIdentity');

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
      if (authMethod === 'plug') {
        await disconnectPlug();
      } else if (authMethod === 'internetIdentity') {
        await logoutInternetIdentity();
      }

      setIsAuthenticated(false);
      setAuthMethod(null);
      setPrincipal(null);
      saveAuthMethod(null);
      
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
  const getChildActor = async (canisterId: string) => {
    if (!isAuthenticated || !authMethod) {
      throw new Error('Not authenticated. Please login first.');
    }
    if (authMethod === 'plug') {
      await ensurePlugAgent({ host: PLUG_HOST, whitelist: [canisterId] });
    }
    return makeChildActor(authMethod, { canisterId });
  };

  const getFactoriaActor = async () => {
    if (!isAuthenticated || !authMethod) {
      throw new Error('Not authenticated. Please login first.');
    }
    const canisterId = getFactoriaCanisterId();
    switch (authMethod) {
      case 'plug':
        await ensurePlugAgent({ host: PLUG_HOST, whitelist: [canisterId] });
        return makeFactoriaWithPlug();
      case 'internetIdentity':
        return makeFactoriaWithInternetIdentity();
      default:
        throw new Error(`Unsupported authentication method: ${authMethod}`);
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
    getChildActor,
    getFactoriaActor,
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
