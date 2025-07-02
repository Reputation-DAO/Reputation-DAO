import React from 'react';
import DashboardIcon from '@mui/icons-material/Dashboard';
import EmojiEventsIcon from '@mui/icons-material/EmojiEvents';
import RemoveCircleIcon from '@mui/icons-material/RemoveCircle';
import GroupIcon from '@mui/icons-material/Group';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';

export const navItems = [
  { label: 'Dashboard', path: '/', icon: <DashboardIcon /> },
  { label: 'Award Rep', path: '/award', icon: <EmojiEventsIcon /> },
  { label: 'Revoke Rep', path: '/revoke', icon: <RemoveCircleIcon /> },
  { label: 'Manage Awarders', path: '/awarders', icon: <GroupIcon /> },
  { label: 'View Balances', path: '/balances', icon: <AccountBalanceWalletIcon /> },
];
