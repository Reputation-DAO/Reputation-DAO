import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { getCurrentPrincipal } from './components/canister/reputationDao';

export type UserRole = 'Admin' | 'Awarder' | 'User' | 'Loading';

interface RoleContextType {
  userRole: UserRole;
  loading: boolean;
  userName: string;
  checkRole: () => Promise<void>;
}

const RoleContext = createContext<RoleContextType | undefined>(undefined);

export const useRole = () => {
  const context = useContext(RoleContext);
  if (!context) {
    throw new Error('useRole must be used within a RoleProvider');
  }
  return context;
};

interface RoleProviderProps {
  children: ReactNode;
}

const hardcodedRoles: Record<string, { role: UserRole; userName: string }> = {
  // Admin/Owner principals
  'rdmx6-jaaaa-aaaah-qca7a-cai': { role: 'Admin' as UserRole, userName: 'Admin User' },
  'ofkbl-m6bgx-xlgm3-ko4y6-mh7i4-kp6b4-sojbh-wyy2r-aznnp-gmqtb-xqe': { role: 'Admin' as UserRole, userName: 'Admin User' },
  // Add more admin principals as needed
  
  // Trusted Awarder principals
  'other-principal-id': { role: 'Awarder' as UserRole, userName: 'Awarder User' },
  // Add more awarder principals as needed
};

const determineUserRole = async (): Promise<{ role: UserRole; userName: string }> => {
  try {
    const principal = await getCurrentPrincipal();
    
    if (!principal) {
      return { role: 'User', userName: 'Guest' };
    }

    const principalString = principal.toString();
    console.log('🔍 Checking role for principal:', principalString);

    // Check hardcoded roles first
    const hardcodedRole = hardcodedRoles[principalString];
    if (hardcodedRole) {
      console.log('✅ Role determined:', hardcodedRole.role, 'for', principalString);
      return hardcodedRole;
    }

    // TEMPORARY: Make any connected user an Admin for debugging
    console.log('🚧 TEMP: Making connected user Admin for debugging');
    return { role: 'Admin', userName: 'Temp Admin' };

    // Default to User role (commented out for debugging)
    // console.log('❌ No role found for principal:', principalString, 'defaulting to User');
    // return { role: 'User', userName: 'User' };
  } catch (error) {
    console.error('Error determining user role:', error);
    return { role: 'User', userName: 'Guest' };
  }
};

export const RoleProvider: React.FC<RoleProviderProps> = ({ children }) => {
  const [userRole, setUserRole] = useState<UserRole>('Loading');
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState('');
  const [isCheckingRole, setIsCheckingRole] = useState(false);

  const checkRole = async () => {
    if (isCheckingRole) return; // Prevent multiple simultaneous checks
    
    try {
      setIsCheckingRole(true);
      setLoading(true);
      
      const result = await determineUserRole();
      
      // Set role and immediately set loading to false
      setUserRole(result.role);
      setUserName(result.userName);
      setLoading(false);
      
    } catch (error) {
      console.error('Error in checkRole:', error);
      setUserRole('User');
      setUserName('Guest');
      setLoading(false);
    } finally {
      setIsCheckingRole(false);
    }
  };

  useEffect(() => {
    checkRole();
  }, []); // Empty dependency array to run only once

  return (
    <RoleContext.Provider value={{ userRole, loading, userName, checkRole }}>
      {children}
    </RoleContext.Provider>
  );
};
