import React, { useState } from 'react';
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LayoutDashboard, 
  Award, 
  UserMinus, 
  Users, 
  Wallet, 
  FileText, 
  Timer,
  Settings,
  LogOut,
  Crown,
  Shield,
  User,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  MessageCircle
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

interface SidebarProps {
  userRole: 'admin' | 'awarder' | 'member';
  userName: string;
  userPrincipal: string;
  onDisconnect: () => void;
}

const RoleIcon = ({ role }: { role: string }) => {
  switch (role) {
    case 'admin':
      return <Crown className="w-4 h-4 text-yellow-500" />;
    case 'awarder':
      return <Shield className="w-4 h-4 text-blue-500" />;
    default:
      return <User className="w-4 h-4 text-green-500" />;
  }
};

const mainNavItems = [
  {
    id: "dashboard",
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ['admin', 'awarder', 'member']
  },
  {
    id: "decay",
    title: "Decay System",
    url: "/decay-system",
    icon: Timer,
    roles: ['admin']
  },
  {
    id: "award",
    title: "Award Rep",
    url: "/award-rep",
    icon: Award,
    roles: ['admin', 'awarder']
  },
  {
    id: "revoke",
    title: "Revoke Rep",
    url: "/revoke-rep", 
    icon: UserMinus,
    roles: ['admin']
  },
  {
    id: "manage",
    title: "Manage Awarders",
    url: "/manage-awarders",
    icon: Users,
    roles: ['admin']
  },
  {
    id: "balances",
    title: "View Balances",
    url: "/view-balances",
    icon: Wallet,
    roles: ['admin', 'awarder', 'member']
  },
  {
    id: "transactions",
    title: "Transaction Log",
    url: "/transaction-log",
    icon: FileText,
    roles: ['admin', 'awarder', 'member']
  }
];

const supportItems = [
  {
    id: "help",
    title: "Help Center",
    url: "/help",
    icon: HelpCircle,
    roles: ['admin', 'awarder', 'member']
  },
  {
    id: "faqs",
    title: "FAQs",
    url: "/faqs",
    icon: MessageCircle,
    roles: ['admin', 'awarder', 'member']
  }
];

const settingsItems = [
  {
    id: "settings",
    title: "Settings",
    url: "/settings",
    icon: Settings,
    roles: ['admin']
  }
];

export function DashboardSidebar({ userRole, userName, userPrincipal, onDisconnect }: SidebarProps) {
  const { state, toggleSidebar } = useSidebar();
  const location = useLocation();
  const [activeItem, setActiveItem] = useState('dashboard');

  const isActive = (path: string) => location.pathname === path;
  
  const filteredMainItems = mainNavItems.filter(item => item.roles.includes(userRole));
  const filteredSupportItems = supportItems.filter(item => item.roles.includes(userRole));
  const filteredSettingsItems = settingsItems.filter(item => item.roles.includes(userRole));

  const collapsed = state === 'collapsed';
  
  return (
    <motion.div
      className="relative h-screen bg-white dark:bg-slate-900 border-r border-slate-200/60 dark:border-slate-800/60 overflow-hidden"
      initial={{ width: collapsed ? 72 : 280 }}
      animate={{ width: collapsed ? 72 : 280 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Subtle gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/40 dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-900/80" />
      
      <div className="relative z-10 flex flex-col h-full">
        {/* Header Section */}
        <div className="flex items-center justify-between px-6 py-6 border-b border-slate-200/40 dark:border-slate-800/40">
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                className="flex items-center space-x-3"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
              >
                <Avatar className="w-9 h-9 ring-1 ring-slate-200 dark:ring-slate-700">
                  <AvatarImage src="" />
                  <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    <User className="w-4 h-4" />
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-slate-900 dark:text-slate-100 truncate text-sm font-medium">
                    {userName || (userPrincipal ? `${userPrincipal.slice(0, 8)}...${userPrincipal.slice(-4)}` : 'Unknown User')}
                  </p>
                  <p className="text-slate-500 dark:text-slate-400 text-xs capitalize">{userRole}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          <Button
            variant="ghost"
            size="icon"
            onClick={toggleSidebar}
            className="w-8 h-8 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </Button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 px-4 py-6 space-y-1">
          {filteredMainItems.map((item) => {
            const Icon = item.icon;
            const isActiveNav = isActive(item.url);
            
            return (
              <motion.div
                key={item.id}
                whileHover={{ x: collapsed ? 0 : 2 }}
                whileTap={{ scale: 0.98 }}
                transition={{ duration: 0.15 }}
              >
                <NavLink
                  to={item.url}
                  onClick={() => setActiveItem(item.id)}
                  className={`
                    relative w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg
                    transition-all duration-200 group text-left
                    ${isActiveNav 
                      ? 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm' 
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50'
                    }
                  `}
                >
                  {/* Active indicator */}
                  {isActiveNav && (
                    <motion.div
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-slate-900 dark:bg-slate-100 rounded-full"
                      layoutId="activeIndicator"
                      transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    />
                  )}
                  
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        className="text-sm font-medium"
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        {item.title}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </NavLink>
              </motion.div>
            );
          })}
        </nav>

        {/* Support Section */}
        {filteredSupportItems.length > 0 && (
          <div className="px-4 pb-6">
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  className="mb-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="h-px bg-slate-200 dark:bg-slate-800 mb-4" />
                  <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 px-3 mb-2 uppercase tracking-wider">Support</h3>
                </motion.div>
              )}
            </AnimatePresence>
            
            <div className="space-y-1">
              {filteredSupportItems.map((item) => {
                const Icon = item.icon;
                
                return (
                  <motion.div
                    key={item.id}
                    whileHover={{ x: collapsed ? 0 : 2 }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.15 }}
                  >
                    <NavLink
                      to={item.url}
                      className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 group text-left"
                    >
                      <Icon className="w-4 h-4 flex-shrink-0" />
                      
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span
                            className="text-sm font-medium"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                          >
                            {item.title}
                          </motion.span>
                        )}
                      </AnimatePresence>
                    </NavLink>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {/* Settings at bottom for collapsed state */}
        {collapsed && filteredSettingsItems.length > 0 && (
          <motion.div
            className="px-4 pb-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <Button
              variant="ghost"
              size="icon"
              className="w-full h-10 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200"
            >
              <Settings className="w-4 h-4" />
            </Button>
          </motion.div>
        )}

        {/* User Section */}
        <div className="px-4 pb-6 border-t border-slate-200/40 dark:border-slate-800/40 pt-4">
          {!collapsed && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 glass-card rounded-lg">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary-glow/20 text-primary">
                    {userName ? userName.charAt(0).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{userName || 'Unknown User'}</p>
                  <div className="flex items-center gap-1">
                    <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                      <RoleIcon role={userRole} />
                      {userRole}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <Button 
                variant="ghost" 
                onClick={onDisconnect}
                className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4" />
                Disconnect
              </Button>
            </div>
          )}
          
          {collapsed && (
            <div className="flex flex-col items-center gap-2">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary-glow/20 text-primary">
                  {userName ? userName.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={onDisconnect}
                className="w-8 h-8 p-0"
              >
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}