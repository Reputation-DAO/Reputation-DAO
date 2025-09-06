import React, { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { internetIdentityService } from '../services/internetIdentity';
import type { AuthState } from '../services/internetIdentity';
import type { _SERVICE } from '../../../src/declarations/reputation_dao/reputation_dao.did.d.ts';

interface AuthContextType extends AuthState {
  login: () => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [authState, setAuthState] = useState<AuthState>({
    isAuthenticated: false,
    identity: null,
    principal: null,
    actor: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Check authentication status on mount
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const state = await internetIdentityService.getAuthState();
      setAuthState(state);
    } catch (err) {
      console.error('Error checking auth status:', err);
      setError('Failed to check authentication status');
    } finally {
      setLoading(false);
    }
  };

  const login = async () => {
    try {
      setLoading(true);
      setError(null);
      const state = await internetIdentityService.login();
      setAuthState(state);
    } catch (err) {
      console.error('Login failed:', err);
      setError('Login failed. Please try again.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      setError(null);
      await internetIdentityService.logout();
      setAuthState({
        isAuthenticated: false,
        identity: null,
        principal: null,
        actor: null,
      });
    } catch (err) {
      console.error('Logout failed:', err);
      setError('Logout failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const contextValue: AuthContextType = {
    ...authState,
    login,
    logout,
    loading,
    error,
  };

  return (
    <AuthContext.Provider value={contextValue}>
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

// Hook to get the authenticated actor
export const useActor = (): _SERVICE | null => {
  const { actor } = useAuth();
  return actor;
};
