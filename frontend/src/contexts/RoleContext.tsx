// src/contexts/RoleContext.tsx
// @ts-nocheck
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Principal } from '@dfinity/principal';
import { useAuth } from './AuthContext';
import { makeFactoriaWithPlug, getFactoriaCanisterId } from '../components/canister/factoria';
import { makeChildWithPlug } from '../components/canister/child';

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
  const context = useContext(RoleContext);
  if (!context) throw new Error('useRole must be used within a RoleProvider');
  return context;
};

interface RoleProviderProps { children: ReactNode; }

/** Extract :cid from current URL without requiring useParams (works even if Provider sits outside Router) */
function getCidFromUrl(): string | null {
  try {
    const path = window.location.pathname;
    // Match any of your dashboard routes that end with /:cid
    // e.g. /dashboard/home/aaaaa-bbbbb-...
    const m = path.match(/\/dashboard\/(?:home|award-rep|revoke-rep|manage-awarders|view-balances|transaction-log|decay-system)\/([^/]+)/i);
    if (m?.[1]) return m[1];
  } catch {}
  // Fallback to legacy storage if someone stored it
  const legacy = localStorage.getItem('selectedOrgId');
  return legacy || null;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const { isAuthenticated, principal } = useAuth();

  const [currentPrincipal, setCurrentPrincipal] = useState<Principal | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('Loading');
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const determineUserRole = async (): Promise<void> => {
    setError(null);
    setLoading(true);

    try {
      // must be authenticated with a principal
      if (!isAuthenticated || !principal) {
        setCurrentPrincipal(null);
        setUserRole('User');
        setUserName('');
        // clear persisted role if you want
        localStorage.removeItem('userRole');
        setLoading(false);
        return;
      }

      setCurrentPrincipal(principal);
      const me = principal.toText();
      setUserName(`${me.slice(0, 5)}...${me.slice(-3)}`);

      // resolve cid from URL (or storage fallback)
      const cid = getCidFromUrl();
      if (!cid) {
        setUserRole('User');
        setLoading(false);
        return;
      }

      // keep storage in sync for legacy consumers
      localStorage.setItem('selectedOrgId', cid);

      // --- Determine role ---
      let isAdmin = false;
      let isAwarder = false;

      // 1) Admin via Factory registry: child.owner === me
      try {
        const factoria = await makeFactoriaWithPlug({
          host: 'https://icp-api.io',
          canisterId: getFactoriaCanisterId(),
        });
        const childOpt = await factoria.getChild(Principal.fromText(cid));
        // Motoko ?Child returns [] | [Child] in JS bindings
        const child = Array.isArray(childOpt) ? childOpt[0] : null;
        const ownerText = child?.owner?.toText?.() ?? child?.owner?.toString?.();
        if (ownerText && ownerText === me) {
          isAdmin = true;
        }
      } catch (e) {
        // non-fatal: if Factory lookup fails, we’ll still try the child
        console.warn('Factory getChild failed; continuing', e);
      }

      // 2) Awarder via Child canister ACL: in getTrustedAwarders()
      if (!isAdmin) {
        try {
          const childActor = await makeChildWithPlug({ canisterId: cid, host: 'https://icp-api.io' });
          // Expecting something like [{ id: Principal, name: Text }, ...]
          const awarders = await childActor.getTrustedAwarders();
          isAwarder = !!awarders?.find?.((a: any) => {
            const aid = a?.id?.toText?.() ?? a?.id?.toString?.();
            return aid === me;
          });
        } catch (e) {
          console.warn('Child getTrustedAwarders failed; treating as non-awarder', e);
        }
      }

      // 3) Final role
      const finalRole: UserRole = isAdmin ? 'Admin' : isAwarder ? 'Awarder' : 'User';
      setUserRole(finalRole);
      // mirror into storage for your Dashboard redirect checks
      localStorage.setItem('userRole', finalRole);

    } catch (err: any) {
      console.error('❌ Error determining role:', err);
      setError(`Failed to determine role: ${err?.message || String(err)}`);
      setUserRole('User');
      localStorage.setItem('userRole', 'User');
    } finally {
      setLoading(false);
    }
  };

  // Run when auth or URL changes (URL change is captured by popstate/hashchange)
  useEffect(() => {
    determineUserRole();
    // Re-run on URL changes (same tab navigation)
    const onNav = () => determineUserRole();
    window.addEventListener('popstate', onNav);
    window.addEventListener('hashchange', onNav);
    return () => {
      window.removeEventListener('popstate', onNav);
      window.removeEventListener('hashchange', onNav);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, principal]);

  // Optional: if another tab changes selectedOrgId, refresh here too
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'selectedOrgId' || e.key === 'userRole') determineUserRole();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
