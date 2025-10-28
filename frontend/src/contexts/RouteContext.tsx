import React, { createContext, useContext, useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface RouteContextType {
  isPlugAllowed: boolean;
  currentRoute: string;
}

const RouteContext = createContext<RouteContextType | undefined>(undefined);

// Routes where Plug should be completely blocked
const RESTRICTED_ROUTES = ['/', '/docs', '/blog', '/community'];

// Routes where Plug is allowed
const ALLOWED_ROUTES = ['/auth', '/org-selector', '/dashboard', '/award-rep', '/revoke-rep', '/manage-awarders', '/view-balances', '/transaction-log', '/decay-system'];

export const RouteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const location = useLocation();
  const { authMethod } = useAuth();
  const [isPlugAllowed, setIsPlugAllowed] = useState(false);
  const [currentRoute, setCurrentRoute] = useState(location.pathname);

  useEffect(() => {
    const path = location.pathname;
    setCurrentRoute(path);

    const matches = (route: string) => path === route || path.startsWith(`${route}/`);
    const explicitlyRestricted = RESTRICTED_ROUTES.some(matches);
    const explicitlyAllowed = ALLOWED_ROUTES.some(matches);

    // Allow Plug only on whitelisted routes that are not explicitly blocked
    const allowed = authMethod === 'plug' && explicitlyAllowed && !explicitlyRestricted;
    setIsPlugAllowed(allowed);
    
    console.log(`🛣️ Route changed to: ${path}, Plug allowed: ${allowed}`);
  }, [location.pathname, authMethod]);

  return (
    <RouteContext.Provider value={{ isPlugAllowed, currentRoute }}>
      {children}
    </RouteContext.Provider>
  );
};

export const useRoute = (): RouteContextType => {
  const context = useContext(RouteContext);
  if (context === undefined) {
    throw new Error('useRoute must be used within a RouteProvider');
  }
  return context;
};
