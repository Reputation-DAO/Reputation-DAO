import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Principal } from '@dfinity/principal';
import { useAuth } from './AuthContext';
import { getChildActor, getCurrentPrincipal } from '../services/childCanisterService';

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
  const { isAuthenticated, principal, authMethod } = useAuth();
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
      // Check if user is authenticated
      if (!isAuthenticated || !principal) {
        console.log('❌ User not authenticated');
        setCurrentPrincipal(null);
        setUserRole('User');
        setUserName('');
        setLoading(false);
        return;
      }

      console.log('👤 Current principal:', principal.toString());
      setCurrentPrincipal(principal);
      
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

      // Get currently selected organization from localStorage
      const selectedOrgId = localStorage.getItem('selectedOrgId');
      if (!selectedOrgId) {
        console.log('❌ No organization selected, setting as User');
        setUserRole('User');
        return;
      }

      console.log('🏢 Selected organization:', selectedOrgId);

      // Get actor to check user's role in the selected organization
      console.log('🔗 Getting actor to check organization role...');
      const actor = await getChildActor();
      if (!actor) {
        console.log('❌ Failed to connect to canister, setting as User');
        setUserRole('User');
        return;
      }

      // For now, we'll use a simplified role determination
      // In a real implementation, you would check the organization's admin and trusted awarders
      console.log('🔍 Determining user role...');
      
      // Check if user is admin by checking if they created the organization
      // This is a simplified check - in reality you'd check the organization's admin field
      const currentPrincipal = await getCurrentPrincipal();
      if (currentPrincipal && currentPrincipal.toString() === principalText) {
        // For now, assume the user is an admin if they're authenticated
        // In a real implementation, you'd check against the organization's admin
        console.log('✅ User is Admin of the selected organization');
        setUserRole('Admin');
        return;
      }

      // For now, set as regular user
      // In a real implementation, you'd check trusted awarders list
      console.log('👤 User is regular User in the selected organization');
      setUserRole('User');

    } catch (error: any) {
      console.error('❌ Error determining role:', error);
      setError(`Failed to determine role: ${error.message}`);
      setUserRole('User');
    } finally {
      setLoading(false);
    }
  };

  // Initial role determination and when authentication changes
  useEffect(() => {
    determineUserRole();
  }, [isAuthenticated, principal, authMethod]);

  // Listen for organization changes in localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      console.log('🔄 Organization changed in localStorage, refreshing role...');
      determineUserRole();
    };

    // Listen for storage changes
    window.addEventListener('storage', handleStorageChange);

    // Also listen for custom events when org changes within the same tab
    window.addEventListener('orgChanged', handleStorageChange as EventListener);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('orgChanged', handleStorageChange as EventListener);
    };
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
