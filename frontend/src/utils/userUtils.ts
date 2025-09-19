import { Principal } from '@dfinity/principal';

/**
 * Format user principal for display
 */
export const formatUserPrincipal = (principal: Principal | string | null | undefined): string => {
  if (!principal) return '';
  
  const principalStr = typeof principal === 'string' ? principal : principal.toString();
  return `${principalStr.slice(0, 8)}...${principalStr.slice(-4)}`;
};

/**
 * Generate a user-friendly name from principal
 */
export const generateUserName = (principal: Principal | string | null | undefined): string => {
  if (!principal) return 'Unknown User';
  
  const principalStr = typeof principal === 'string' ? principal : principal.toString();
  return `User ${principalStr.slice(0, 8)}`;
};

/**
 * Get user display data for sidebar
 */
export const getUserDisplayData = (principal: Principal | string | null | undefined) => {
  const principalStr = principal ? (typeof principal === 'string' ? principal : principal.toString()) : '';
  
  return {
    userName: generateUserName(principal),
    userPrincipal: principalStr,
    displayName: formatUserPrincipal(principal)
  };
};
