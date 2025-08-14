import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Principal } from '@dfinity/principal';
import { getPlugActor, getCurrentPrincipal } from '../components/canister/reputationDao';

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
  if (context === undefined) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

interface RoleProviderProps {
  children: ReactNode;
}

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const [currentPrincipal, setCurrentPrincipal] = useState<Principal | null>(null);
  const [userRole, setUserRole] = useState<UserRole>('Loading');
  const [userName, setUserName] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCheckingRole, setIsCheckingRole] = useState(false);

  // Owner principal - replace with your actual owner principal
  const OWNER_PRINCIPAL = 'gvlvr-wz5ef-7evg7-bphlu-yld24-vgds7-ghcic-do3kl-ecvlh-3mdkp-2ae';

  const determineUserRole = async (): Promise<void> => {
    if (isCheckingRole) {
      console.log('⏳ Role check already in progress, skipping...');
      return;
    }

    console.log('🔍 Starting role determination...');
    setIsCheckingRole(true);
    setError(null);
    setLoading(true);

    try {
      // Get current principal
      const principal = await getCurrentPrincipal();
      console.log('👤 Current principal:', principal?.toString() || 'null');
      
      if (!principal) {
        console.log('❌ No principal found, setting as User');
        setCurrentPrincipal(null);
        setUserRole('User');
        setUserName('');
        return;
      }

      setCurrentPrincipal(principal);
      const principalText = principal.toString();

      // Check if owner/admin
      if (principalText === OWNER_PRINCIPAL) {
        console.log('👑 User is Admin/Owner - IMMEDIATE RETURN');
        setUserRole('Admin');
        setUserName('Admin');
        setLoading(false);
        setIsCheckingRole(false);
        return; // Exit early for admin, don't continue to check awarders
      }

      // Get actor to check if user is a trusted awarder
      console.log('🔗 Getting actor to check awarders...');
      const actor = await getPlugActor();
      if (!actor) {
        console.log('❌ Failed to connect to canister, setting as User');
        setUserRole('User');
        setUserName(`${principalText.slice(0, 5)}...${principalText.slice(-3)}`);
        return;
      }

      // Get trusted awarders
      console.log('📋 Fetching trusted awarders...');
      const awarders = await actor.getTrustedAwarders();
      console.log('📋 Found awarders:', awarders);
      
      const awarder = awarders.find((a: any) => a.id.toString() === principalText);

      if (awarder) {
        console.log('⭐ User is a trusted awarder:', awarder.name);
        setUserRole('Awarder');
        setUserName(awarder.name);
      } else {
        console.log('👤 User is regular user');
        setUserRole('User');
        setUserName(`${principalText.slice(0, 5)}...${principalText.slice(-3)}`);
      }

    } catch (err) {
      console.error('❌ Error determining user role:', err);
      setError(err instanceof Error ? err.message : 'Failed to determine user role');
      setUserRole('User');
      setUserName('');
    } finally {
      console.log('✅ Role determination complete, setting loading to false');
      setLoading(false);
      setIsCheckingRole(false);
    }
  };

  // Monitor wallet connection changes
  useEffect(() => {
    determineUserRole();

    // Use Plug wallet events instead of polling for instant detection
    const handleAccountsChanged = async () => {
      console.log('🔄 Plug wallet account changed, updating role...');
      await determineUserRole();
    };

    const handleConnect = async () => {
      console.log('🔌 Plug wallet connected, updating role...');
      await determineUserRole();
    };

    const handleDisconnect = () => {
      console.log('🔌 Plug wallet disconnected, setting as User');
      setCurrentPrincipal(null);
      setUserRole('User');
      setUserName('');
      setLoading(false);
    };

    // Listen to Plug wallet events for instant detection
    if (window.ic?.plug) {
      // These are the standard wallet events - check if Plug supports them
      try {
        window.addEventListener('ic-agent-update', handleAccountsChanged);
        window.addEventListener('plug-connect', handleConnect);
        window.addEventListener('plug-disconnect', handleDisconnect);
      } catch (error) {
        console.log('Event listeners not supported, using minimal polling...');
        
        // Fallback to very light polling only if events don't work
        const intervalId = setInterval(async () => {
          try {
            const newPrincipal = await getCurrentPrincipal();
            const newPrincipalText = newPrincipal?.toString() || '';
            const currentPrincipalText = currentPrincipal?.toString() || '';

            if (newPrincipalText !== currentPrincipalText) {
              console.log('🔄 Principal changed, updating role...');
              await determineUserRole();
            }
          } catch (error) {
            // Silently handle errors to prevent console spam
          }
        }, 10000); // Much longer interval - 10 seconds

        return () => clearInterval(intervalId);
      }
    }

    // Cleanup event listeners
    return () => {
      try {
        window.removeEventListener('ic-agent-update', handleAccountsChanged);
        window.removeEventListener('plug-connect', handleConnect);
        window.removeEventListener('plug-disconnect', handleDisconnect);
      } catch (error) {
        // Ignore cleanup errors
      }
    };
  }, []); // Empty dependency array to run only once

  const refreshRole = async (): Promise<void> => {
    await determineUserRole();
  };

  const contextValue: RoleContextType = {
    currentPrincipal,
    userRole,
    userName,
    isAdmin: userRole === 'Admin',
    isAwarder: userRole === 'Awarder',
    isUser: userRole === 'User',
    loading,
    error,
    refreshRole,
  };

  return (
    <RoleContext.Provider value={contextValue}>
      {children}
    </RoleContext.Provider>
  );
};
