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

  const determineUserRole = async (): Promise<void> => {
    console.log('🔍 Starting role determination...');
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
      setUserName(`${principalText.slice(0, 5)}...${principalText.slice(-3)}`);

      // Get actor to check user's organization role
      console.log('🔗 Getting actor to check organization role...');
      const actor = await getPlugActor();
      if (!actor) {
        console.log('❌ Failed to connect to canister, setting as User');
        setUserRole('User');
        return;
      }

      // Use new backend functions to check role
      console.log('🏢 Checking if user is admin of their organization...');
      const isOrgAdmin = await actor.isMyOrgAdmin();
      console.log('👑 Is org admin:', isOrgAdmin);

      if (isOrgAdmin) {
        console.log('✅ User is Admin of their organization');
        setUserRole('Admin');
        return;
      }

      // Check if user has an organization (trusted awarder)
      console.log('🔍 Checking user organization...');
      const myOrg = await actor.getMyOrganization();
      console.log('🏢 User organization:', myOrg);

      if (myOrg && myOrg.length > 0) {
        console.log('✅ User is Awarder (has organization association)');
        setUserRole('Awarder');
      } else {
        console.log('👤 User is regular User (no organization association)');
        setUserRole('User');
      }

    } catch (error: any) {
      console.error('❌ Error determining role:', error);
      setError(`Failed to determine role: ${error.message}`);
      setUserRole('User');
    } finally {
      setLoading(false);
    }
  };

  // Initial role determination
  useEffect(() => {
    determineUserRole();
  }, []);

  // Context value
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
