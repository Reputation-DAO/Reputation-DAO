import React from 'react';
import { useWalletConnectionMonitor } from '../../hooks/useWalletConnectionMonitor';

/**
 * Higher-order component that wraps main app pages with wallet disconnection monitoring
 * This ensures users are redirected to auth if their wallet gets disconnected
 * while using the main application features
 */
const ProtectedPage: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Monitor wallet connection and redirect to auth if disconnected
  useWalletConnectionMonitor();

  return <>{children}</>;
};

export default ProtectedPage;
