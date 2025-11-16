import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { ReactNode } from 'react';
import { Principal } from '@dfinity/principal';
import type { DelegationIdentity } from '@dfinity/identity';
import { useSiwbIdentity } from 'ic-use-siwb-identity';
import {
  ensurePlugAgent,
  getPlugPrincipal,
  isPlugConnected,
  disconnectPlug,
  PLUG_HOST,
  PLUG_DISABLE_KEY,
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
  makeChildWithIdentity,
  makeFactoriaWithIdentity,
  getFactoriaCanisterId,
} from '@/lib/canisters';
import type { _SERVICE as FactoriaActor } from '@/declarations/factoria/factoria.did.d.ts';

export type AuthMethod = 'plug' | 'internetIdentity' | 'siwb' | null;

const STORAGE_KEY = 'repdao:authMethod';
const DEFAULT_IC_HOST = import.meta.env.VITE_IC_HOST || PLUG_HOST;
const setPlugDisabled = (disabled: boolean) => {
  if (typeof window === 'undefined') return;
  try {
    if (disabled) {
      window.localStorage.setItem(PLUG_DISABLE_KEY, '1');
    } else {
      window.localStorage.removeItem(PLUG_DISABLE_KEY);
    }
  } catch {
    /* ignore storage errors */
  }
};

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
    return value === 'plug' || value === 'internetIdentity' || value === 'siwb' ? value : null;
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
  btcAddress: string | null;
  
  // Authentication methods
  loginWithPlug: () => Promise<void>;
  loginWithInternetIdentity: () => Promise<void>;
  loginWithSiwb: () => Promise<void>;
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
  const siwb = useSiwbIdentity();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authMethod, setAuthMethod] = useState<AuthMethod>(loadAuthMethod());
  const [principal, setPrincipal] = useState<Principal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [btcAddress, setBtcAddress] = useState<string | null>(null);

  const resolvePlugPrincipal = useCallback(async (): Promise<Principal | null> => {
    if (!(await isPlugConnected())) return null;
    try {
      return await getPlugPrincipal();
    } catch (err) {
      console.error('Failed to read Plug principal:', err);
      return null;
    }
  }, []);

  const resolveInternetIdentityPrincipal = useCallback(async (): Promise<Principal | null> => {
    try {
      if (!(await isInternetIdentityAuthenticated())) return null;
      return await getInternetIdentityPrincipal();
    } catch (err) {
      console.error('Failed to read Internet Identity principal:', err);
      return null;
    }
  }, []);

  const adoptSiwbIdentity = useCallback(
    (identity: DelegationIdentity) => {
      const siwbPrincipal = identity.getPrincipal();
      setIsAuthenticated(true);
      setAuthMethod('siwb');
      setPrincipal(siwbPrincipal);
      setBtcAddress(siwb.identityAddress ?? null);
      saveAuthMethod('siwb');
      setPlugDisabled(true);
    },
    [siwb.identityAddress],
  );

  /**
   * Check current authentication status
   */
  const checkConnection = useCallback(async () => {
    setIsLoading(true);

    try {
      if (siwb.isInitializing) {
        return;
      }

      const last = loadAuthMethod();
      const order: AuthMethod[] =
        last === 'plug'
          ? ['plug', 'internetIdentity', 'siwb']
          : last === 'internetIdentity'
          ? ['internetIdentity', 'plug', 'siwb']
          : last === 'siwb'
          ? ['siwb', 'plug', 'internetIdentity']
          : ['plug', 'internetIdentity', 'siwb'];

      for (const method of order) {
        if (method === 'plug') {
          const plugPrincipal = await resolvePlugPrincipal();
          if (plugPrincipal) {
            setIsAuthenticated(true);
            setAuthMethod('plug');
            setPrincipal(plugPrincipal);
            saveAuthMethod('plug');
            setBtcAddress(null);
            setPlugDisabled(false);
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
            setBtcAddress(null);
            setPlugDisabled(true);
            try {
              await disconnectPlug();
            } catch {
              /* ignore disconnect errors */
            }
            console.log('✅ Authenticated with Internet Identity:', iiPrincipal.toString());
            return;
          }
        } else if (method === 'siwb') {
          if (siwb.identity) {
            adoptSiwbIdentity(siwb.identity);
            console.log('✅ Authenticated with SIWB:', siwb.identity.getPrincipal().toString());
            return;
          }
        }
      }

      setIsAuthenticated(false);
      setAuthMethod(null);
      setPrincipal(null);
      setBtcAddress(null);
      saveAuthMethod(null);
      console.log('ℹ️ No authentication found');
    } catch (error) {
      console.error('❌ Error checking authentication:', error);
      setIsAuthenticated(false);
      setAuthMethod(null);
      setPrincipal(null);
      setBtcAddress(null);
      saveAuthMethod(null);
    } finally {
      setIsLoading(false);
    }
  }, [
    adoptSiwbIdentity,
    resolveInternetIdentityPrincipal,
    resolvePlugPrincipal,
    siwb.identity,
    siwb.isInitializing,
  ]);

  /**
   * Login with Plug wallet
   */
  const loginWithPlug = async () => {
    setIsLoading(true);
    
    try {
      setPlugDisabled(false);
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
      try {
        await disconnectPlug();
      } catch {
        /* ignore disconnect errors */
      }
      setPlugDisabled(true);

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

  const loginWithSiwb = async () => {
    setIsLoading(true);
    try {
      const identity = await siwb.login();
      if (!identity) {
        throw new Error('SIWB login was cancelled.');
      }
      adoptSiwbIdentity(identity);
      console.log('✅ SIWB login successful:', identity.getPrincipal().toString());
    } catch (error) {
      console.error('❌ SIWB login failed:', error);
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
      } else if (authMethod === 'siwb') {
        siwb.clear();
      }

      setIsAuthenticated(false);
      setAuthMethod(null);
      setPrincipal(null);
       setBtcAddress(null);
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
      return makeChildActor('plug', { canisterId });
    }
    if (authMethod === 'internetIdentity') {
      return makeChildActor('internetIdentity', { canisterId });
    }
    if (authMethod === 'siwb') {
      if (!siwb.identity) throw new Error('Bitcoin identity unavailable.');
      return makeChildWithIdentity(siwb.identity, { canisterId, host: DEFAULT_IC_HOST });
    }
    throw new Error(`Unsupported authentication method: ${authMethod}`);
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
      case 'siwb':
        if (!siwb.identity) throw new Error('Bitcoin identity unavailable.');
        return makeFactoriaWithIdentity({ identity: siwb.identity });
      default:
        throw new Error(`Unsupported authentication method: ${authMethod}`);
    }
  };

  // Check connection on mount
  useEffect(() => {
    checkConnection();
  }, [checkConnection]);

  useEffect(() => {
    if (siwb.isInitializing) return;
    if (siwb.identity) {
      setBtcAddress(siwb.identityAddress ?? null);
      if (authMethod !== 'siwb') {
        adoptSiwbIdentity(siwb.identity);
      }
    } else if (authMethod === 'siwb') {
      setIsAuthenticated(false);
      setAuthMethod(null);
      setPrincipal(null);
      setBtcAddress(null);
      saveAuthMethod(null);
    }
  }, [adoptSiwbIdentity, authMethod, siwb.identity, siwb.identityAddress, siwb.isInitializing]);

  const value: AuthContextType = {
    isAuthenticated,
    authMethod,
    principal,
    isLoading,
    btcAddress,
    loginWithPlug,
    loginWithInternetIdentity,
    loginWithSiwb,
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
