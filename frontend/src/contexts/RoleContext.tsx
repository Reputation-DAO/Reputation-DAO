// src/contexts/RoleContext.tsx
// @ts-nocheck
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useRef,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import { Principal } from '@dfinity/principal';
import { useLocation } from 'react-router-dom';

import { makeChildWithPlug } from '../components/canister/child';
import { makeFactoriaWithPlug, getFactoriaCanisterId } from '../components/canister/factoria';

export type UserRole = 'admin' | 'awarder' | 'member' | 'user' | 'loading';

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

/** Plug-first principal fetch (matches your past working version) */
async function getCurrentPrincipal(): Promise<Principal | null> {
  const plug = (window as any)?.ic?.plug;
  try {
    const p = await plug?.getPrincipal?.();
    return p ?? null;
  } catch {
    return null;
  }
}

/** Pretty principal helper */
const short = (t?: string | null) => (t ? `${t.slice(0, 6)}…${t.slice(-6)}` : '');

/** Read :cid from URL */
function extractCidFromPathname(pathname: string): string | null {
  const m = pathname.match(
    /\/dashboard\/(?:home|award-rep|revoke-rep|manage-awarders|view-balances|transaction-log|decay-system)\/([^/]+)/i
  );
  return m?.[1] || null;
}
const deriveCid = (pathname: string): string | null => {
  const fromPath = extractCidFromPathname(pathname);
  if (fromPath) return fromPath;
  try {
    return localStorage.getItem('selectedOrgId');
  } catch {
    return null;
  }
};

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const location = useLocation();

  const [cid, setCid] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    return deriveCid(window.location.pathname);
  });

  const [currentPrincipal, setCurrentPrincipal] = useState<Principal | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('loading');
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const requestIdRef = useRef(0);

  // Keep :cid in sync with current route (fallback to stored selection when absent)
  useEffect(() => {
    const next = deriveCid(location.pathname);
    setCid((prev) => (next === prev ? prev : next));
  }, [location.pathname]);

  useEffect(() => {
    const handleStorage = (event: StorageEvent) => {
      if (event.key === 'selectedOrgId') {
        const next = deriveCid(location.pathname);
        setCid((prev) => (next === prev ? prev : next));
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, [location.pathname]);

  const determineUserRole = useCallback(async (): Promise<void> => {
    const requestId = ++requestIdRef.current;
    setLoading(true);
    setUserRole('loading');
    setError(null);
    setCurrentPrincipal(null);
    setUserName('');

    let finalPrincipal: Principal | null = null;
    let finalRole: UserRole = 'user';
    let finalUserName = '';
    let finalError: string | null = null;
    let resolvedAdmin = false;
    let resolvedAwarder = false;

    const t0 = performance.now?.() ?? Date.now();
    console.groupCollapsed(
      `%c🔎 RoleContext · resolve role`,
      'background:#111;color:#0ff;padding:2px 6px;border-radius:6px;font-weight:600'
    );

    try {
      console.log('➡️ Input route cid:', cid || '(none)');

      // Require a route canister id
      if (!cid) {
        console.warn('⚠️ No :cid in route — defaulting role = user');
      } else {
        // Get Plug principal (no AuthContext dependency)
        const principal = await getCurrentPrincipal();
        console.log('👤 Plug principal:', principal ? short(principal.toString()) : '(none)');

        if (!principal) {
          console.warn('⚠️ No Plug principal — defaulting role = user');
        } else {
          finalPrincipal = principal;
          const meText = principal.toString();
          finalUserName = `${meText.slice(0, 5)}...${meText.slice(-3)}`;

          try {
            const factoria = await makeFactoriaWithPlug({
              host: 'https://icp-api.io',
              canisterId: getFactoriaCanisterId(),
            });

            console.log('🏭 Factoria ready:', { cid: short(cid), me: short(meText) });

            const childOpt = await factoria.getChild(Principal.fromText(cid));
            const child = Array.isArray(childOpt) ? childOpt[0] : null;
            const ownerText = child?.owner?.toString?.();
            console.log('📦 Factory.getChild result:', {
              found: !!child,
              owner: short(ownerText || ''),
              status: child?.status ? Object.keys(child.status)[0] : '(unknown)',
              note: child?.note ?? '',
            });

            if (ownerText && ownerText === meText) {
              resolvedAdmin = true;
              console.log('%c👑 Admin check: TRUE (factory owner match)', 'color:#ffd700;font-weight:700');
            } else {
              console.log('%c👑 Admin check: false', 'color:#888');
            }
          } catch (e) {
            console.error('❌ Factory.getChild failed during role check:', e);
          }

          if (!resolvedAdmin) {
            try {
              const child = await makeChildWithPlug({ canisterId: cid, host: 'https://icp-api.io' });

              if (typeof child.isTrustedAwarder === 'function') {
                const ok = await child.isTrustedAwarder(Principal.fromText(meText));
                resolvedAwarder = !!ok;
                console.log('🛡️ child.isTrustedAwarder():', ok);
              } else if (typeof child.getTrustedAwarders === 'function') {
                const awarders = await child.getTrustedAwarders();
                const listPreview =
                  Array.isArray(awarders)
                    ? awarders.slice(0, 6).map((a: any) => short(a?.id?.toString?.()))
                    : '(not-an-array)';
                resolvedAwarder = !!awarders?.find?.((a: any) => a?.id?.toString?.() === meText);
                console.log('🛡️ child.getTrustedAwarders():', {
                  size: Array.isArray(awarders) ? awarders.length : '(unknown)',
                  preview: listPreview,
                  containsMe: resolvedAwarder,
                });
              } else {
                console.warn('⚠️ Child has no isTrustedAwarder/getTrustedAwarders; cannot check awarder role');
              }
            } catch (e) {
              console.error('❌ Child awarder check failed:', e);
            }
          }

          if (resolvedAdmin) finalRole = 'admin';
          else if (resolvedAwarder) finalRole = 'awarder';
          else finalRole = 'member';

          try {
            localStorage.setItem('selectedOrgId', cid);
          } catch (storageErr) {
            console.warn('⚠️ Unable to persist selectedOrgId:', storageErr);
          }

          const t1 = performance.now?.() ?? Date.now();
          console.log(
            `%c✅ Final role: ${finalRole}`,
            'background:#0f0;color:#000;padding:2px 6px;border-radius:6px;font-weight:800'
          );
          console.table({
            route_cid: cid,
            me: meText,
            me_short: short(meText),
            isAdmin: resolvedAdmin,
            isAwarder: resolvedAwarder,
            finalRole,
            ms: Math.round(t1 - t0),
          });
        }
      }
    } catch (err: any) {
      console.error('❌ Error determining role:', err);
      finalError = `Failed to determine role: ${err?.message || String(err)}`;
      finalRole = 'user';
    } finally {
      if (requestIdRef.current === requestId) {
        setCurrentPrincipal(finalPrincipal);
        setUserName(finalUserName);
        setUserRole(finalRole);
        setError(finalError);
        setLoading(false);
      }
      console.groupEnd();
    }
  }, [cid]);

  // Recompute role whenever cid changes (via locationchange/storage)
  useEffect(() => {
    determineUserRole();
  }, [determineUserRole]);

  const contextValue: RoleContextType = {
    currentPrincipal,
    userRole,
    userName,
    isAdmin: userRole === 'admin',
    isAwarder: userRole === 'awarder',
    isUser: userRole === 'user' || userRole === 'member',
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
