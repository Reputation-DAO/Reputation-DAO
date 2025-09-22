// src/contexts/RoleContext.tsx
// @ts-nocheck
import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Principal } from '@dfinity/principal';

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

/** Read :cid from URL (works even if provider sits outside Router) */
function extractCidFromPathname(pathname: string): string | null {
  const m = pathname.match(
    /\/dashboard\/(?:home|award-rep|revoke-rep|manage-awarders|view-balances|transaction-log|decay-system)\/([^/]+)/i
  );
  return m?.[1] || null;
}
function getCidFromUrl(): string | null {
  const fromPath = extractCidFromPathname(window.location.pathname);
  if (fromPath) return fromPath;
  // fallback for legacy or cross-tab selections
  return localStorage.getItem('selectedOrgId');
}

/** Ensure we get an event on pushState/replaceState too (SPA navigation) */
function installLocationChangeShim() {
  if ((window as any).__role_ctx_loc_shim_installed__) return;
  (window as any).__role_ctx_loc_shim_installed__ = true;

  const fire = () => window.dispatchEvent(new Event('locationchange'));
  const wrap = (type: 'pushState' | 'replaceState') => {
    const orig = history[type];
    return function wrapped(this: History, ...args: any[]) {
      const ret = orig.apply(this, args as any);
      fire();
      return ret;
    };
  };

  history.pushState = wrap('pushState');
  history.replaceState = wrap('replaceState');

  window.addEventListener('popstate', fire);
  window.addEventListener('hashchange', fire);
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  installLocationChangeShim();

  const [cid, setCid] = useState<string | null>(getCidFromUrl());

  const [currentPrincipal, setCurrentPrincipal] = useState<Principal | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('loading');
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /** Keep our :cid in sync with URL + storage changes */
  useEffect(() => {
    const refresh = () => {
      const next = getCidFromUrl();
      if (next !== cid) setCid(next);
    };
    window.addEventListener('locationchange', refresh);
    window.addEventListener('storage', (e: StorageEvent) => {
      if (e.key === 'selectedOrgId') refresh();
    });
    // initial check (in case)
    refresh();
    return () => {
      window.removeEventListener('locationchange', refresh);
      // storage listener is anonymous—no need to remove explicitly here
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const determineUserRole = async (): Promise<void> => {
    const t0 = performance.now?.() ?? Date.now();
    console.groupCollapsed(
      `%c🔎 RoleContext · resolve role`,
      'background:#111;color:#0ff;padding:2px 6px;border-radius:6px;font-weight:600'
    );

    try {
      console.log('➡️ Input route cid:', cid || '(none)');

      // Require a route canister id
      if (!cid) {
        setCurrentPrincipal(null);
        setUserRole('user');
        setUserName('');
        console.warn('⚠️ No :cid in route — defaulting role = user');
        return;
      }

      // Get Plug principal (no AuthContext dependency)
      const principal = await getCurrentPrincipal();
      console.log('👤 Plug principal:', principal ? short(principal.toString()) : '(none)');

      if (!principal) {
        setCurrentPrincipal(null);
        setUserRole('user');
        setUserName('');
        console.warn('⚠️ No Plug principal — defaulting role = user');
        return;
      }

      setCurrentPrincipal(principal);
      const meText = principal.toString();
      setUserName(`${meText.slice(0, 5)}...${meText.slice(-3)}`);

      let isAdmin = false;
      let isAwarder = false;

      // ✅ admin via Factory: getChild(cid).owner === me
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
          isAdmin = true;
          console.log('%c👑 Admin check: TRUE (factory owner match)', 'color:#ffd700;font-weight:700');
        } else {
          console.log('%c👑 Admin check: false', 'color:#888');
        }
      } catch (e) {
        console.error('❌ Factory.getChild failed during role check:', e);
      }

      // ✅ awarder via Child ACL: getTrustedAwarders() contains me
      if (!isAdmin) {
        try {
          const child = await makeChildWithPlug({ canisterId: cid, host: 'https://icp-api.io' });

          if (typeof child.isTrustedAwarder === 'function') {
            const ok = await child.isTrustedAwarder(Principal.fromText(meText));
            isAwarder = !!ok;
            console.log('🛡️ child.isTrustedAwarder():', ok);
          } else if (typeof child.getTrustedAwarders === 'function') {
            const awarders = await child.getTrustedAwarders();
            const listPreview =
              Array.isArray(awarders)
                ? awarders.slice(0, 6).map((a: any) => short(a?.id?.toString?.()))
                : '(not-an-array)';
            isAwarder = !!awarders?.find?.((a: any) => a?.id?.toString?.() === meText);
            console.log('🛡️ child.getTrustedAwarders():', {
              size: Array.isArray(awarders) ? awarders.length : '(unknown)',
              preview: listPreview,
              containsMe: isAwarder,
            });
          } else {
            console.warn('⚠️ Child has no isTrustedAwarder/getTrustedAwarders; cannot check awarder role');
          }
        } catch (e) {
          console.error('❌ Child awarder check failed:', e);
        }
      }

      // Final role (lower-case)
      let finalRole: UserRole = 'user';
      if (isAdmin) finalRole = 'admin';
      else if (isAwarder) finalRole = 'awarder';

      setUserRole(finalRole);

      // Keep legacy selection in sync for other tabs/components
      localStorage.setItem('selectedOrgId', cid);

      const t1 = performance.now?.() ?? Date.now();
      console.log(
        `%c✅ Final role: ${finalRole}`,
        'background:#0f0;color:#000;padding:2px 6px;border-radius:6px;font-weight:800'
      );
      console.table({
        route_cid: cid,
        me: meText,
        me_short: short(meText),
        isAdmin,
        isAwarder,
        finalRole,
        ms: Math.round(t1 - t0),
      });
    } catch (err: any) {
      console.error('❌ Error determining role:', err);
      setError(`Failed to determine role: ${err?.message || String(err)}`);
      setUserRole('user');
    } finally {
      setLoading(false);
      console.groupEnd();
    }
  };

  // Recompute role whenever cid changes (via locationchange/storage)
  useEffect(() => {
    determineUserRole();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cid]);

  const contextValue: RoleContextType = {
    currentPrincipal,
    userRole,
    userName,
    isAdmin: userRole === 'admin',
    isAwarder: userRole === 'awarder',
    isUser: userRole === 'user',
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
