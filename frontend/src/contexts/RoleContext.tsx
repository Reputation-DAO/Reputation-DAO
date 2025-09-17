// src/contexts/RoleContext.tsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Principal } from '@dfinity/principal';
import { useParams } from 'react-router-dom';

import { makeChildWithPlug } from '../components/canister/child';
import { makeFactoriaWithPlug, getFactoriaCanisterId } from '../components/canister/factoria';

export type UserRole = 'Admin' | 'Awarder' | 'User' | 'Loading';

export interface RoleContextType {
  currentPrincipal: Principal | null;
  userRole: UserRole;
  userName: string;
  isAdmin: boolean;
  isAwarder: boolean;
  isUser: boolean;
  loading: boolean;
  error: string | null;
  refreshRole: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const useRole = () => {
  const ctx = useContext(RoleContext);
  if (!ctx) throw new Error('useRole must be used within a RoleProvider');
  return ctx;
};

interface RoleProviderProps { children: ReactNode; }

async function getCurrentPrincipal(): Promise<Principal | null> {
  const plug = (window as any)?.ic?.plug;
  const p = await plug?.getPrincipal?.();
  return p ?? null;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const { cid } = useParams<{ cid: string }>();

  const [currentPrincipal, setCurrentPrincipal] = useState<Principal | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('Loading');
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const determineUserRole = async (): Promise<void> => {
    setError(null);
    setLoading(true);

    try {
      if (!cid) {
        setCurrentPrincipal(null);
        setUserRole('User');
        setUserName('');
        return;
      }

      const principal = await getCurrentPrincipal();
      if (!principal) {
        setCurrentPrincipal(null);
        setUserRole('User');
        setUserName('');
        return;
      }

      setCurrentPrincipal(principal);
      const pText = principal.toString();
      setUserName(`${pText.slice(0, 5)}...${pText.slice(-3)}`);

      let isAdmin = false;
      let isAwarder = false;

      // ✅ Admin via Factory: getChild(cid).owner === me
      try {
        const factoria = await makeFactoriaWithPlug({
          host: 'https://icp-api.io',
          canisterId: getFactoriaCanisterId(),
        });

        const childOpt = await factoria.getChild(Principal.fromText(cid));
        const child = Array.isArray(childOpt) ? childOpt[0] : null;
        if (child && child.owner && child.owner.toString() === pText) {
          isAdmin = true;
        }
      } catch (_) {
        // Factory lookup failed; ignore and fall back to child checks
      }

      // ✅ Awarder via Child: check getTrustedAwarders()
      try {
        const child = await makeChildWithPlug({ canisterId: cid, host: 'https://icp-api.io' });
        const awarders = await child.getTrustedAwarders();
        isAwarder = !!awarders.find((a: any) => a.id?.toString?.() === pText);
      } catch (_) {
        // If child query fails, treat as non-awarder
      }

      if (isAdmin) setUserRole('Admin');
      else if (isAwarder) setUserRole('Awarder');
      else setUserRole('User');
    } catch (err: any) {
      setError(`Failed to determine role: ${err?.message || String(err)}`);
      setUserRole('User');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    determineUserRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid]);

  const contextValue: RoleContextType = {
    currentPrincipal,
    userRole,
    userName,
    isAdmin: userRole === 'Admin',
    isAwarder: userRole === 'Awarder',
    isUser: userRole === 'User',
    loading,
    error,
    refreshRole: determineUserRole,
  };

  return (
    <RoleContext.Provider value={contextValue}>
      {children}
    </RoleContext.Provider>
  );
};
