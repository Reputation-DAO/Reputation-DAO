
import type { ReactElement } from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import GroupIcon from '@mui/icons-material/Group';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import HistoryIcon from '@mui/icons-material/History';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';

export interface NavItem {
  label: string;
  path: string;
  icon: ReactElement;
  allowedRoles: ('Admin' | 'Awarder' | 'User')[];
}

export const navItems: NavItem[] = [
  { 
    label: 'Dashboard', 
    path: '/dashboard', 
    icon: <DashboardIcon />, 
    allowedRoles: ['Admin', 'Awarder', 'User'] 
  },
  { 
    label: 'Decay System', 
    path: '/decay', 
    icon: <TrendingDownIcon />, 
    allowedRoles: ['Admin', 'Awarder', 'User'] 
  },
  { 
    label: 'Award Rep', 
    path: '/award', 
    icon: <EmojiEventsIcon />, 
    allowedRoles: ['Admin', 'Awarder'] 
  },
  { 
    label: 'Revoke Rep', 
    path: '/revoke', 
    icon: <RemoveCircleIcon />, 
    allowedRoles: ['Admin'] 
  },
  { 
    label: 'Manage Awarders', 
    path: '/awarders', 
    icon: <GroupIcon />, 
    allowedRoles: ['Admin'] 
  },
  { 
    label: 'View Balances', 
    path: '/balances', 
    icon: <AccountBalanceWalletIcon />, 
    allowedRoles: ['Admin', 'Awarder', 'User'] 
  },
  { 
    label: 'Transaction Log', 
    path: '/transactions', 
    icon: <HistoryIcon />, 
    allowedRoles: ['Admin', 'Awarder', 'User'] 
  },
];

export const getFilteredNavItems = (userRole: 'Admin' | 'Awarder' | 'User'): NavItem[] => {
  return navItems.filter(item => item.allowedRoles.includes(userRole));
};
