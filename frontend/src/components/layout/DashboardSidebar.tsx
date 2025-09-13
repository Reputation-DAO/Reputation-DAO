import { NavLink, useLocation } from "react-router-dom";
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
  User
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    roles: ['admin', 'awarder', 'member']
  },
  {
    title: "Award Rep",
    url: "/award-rep",
    icon: Award,
    roles: ['admin', 'awarder']
  },
  {
    title: "Revoke Rep",
    url: "/revoke-rep", 
    icon: UserMinus,
    roles: ['admin']
  },
  {
    title: "Manage Awarders",
    url: "/manage-awarders",
    icon: Users,
    roles: ['admin']
  },
  {
    title: "View Balances",
    url: "/view-balances",
    icon: Wallet,
    roles: ['admin', 'awarder', 'member']
  },
  {
    title: "Transaction Log",
    url: "/transaction-log",
    icon: FileText,
    roles: ['admin', 'awarder', 'member']
  },
  {
    title: "Decay System",
    url: "/decay-system",
    icon: Timer,
    roles: ['admin']
  }
];

const settingsItems = [
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
    roles: ['admin']
  }
];

export function DashboardSidebar({ userRole, userName, userPrincipal, onDisconnect }: SidebarProps) {
  const { state } = useSidebar();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;
  
  const getNavClass = (isActive: boolean) => 
    isActive 
      ? "bg-primary/10 text-primary border-r-2 border-primary font-medium" 
      : "hover:bg-muted/50 text-muted-foreground hover:text-foreground";

  const filteredMainItems = mainNavItems.filter(item => item.roles.includes(userRole));
  const filteredSettingsItems = settingsItems.filter(item => item.roles.includes(userRole));

  const collapsed = state === 'collapsed';
  
  return (
    <Sidebar className={`border-r border-border/40 glass-sidebar ${collapsed ? 'w-16' : 'w-64'}`}>
      <SidebarHeader className="border-b border-border/40 p-4">
        {!collapsed && (
          <div className="flex items-center gap-3 animate-fade-in">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <Award className="w-4 h-4 text-white" />
            </div>
            <div>
              <h2 className="font-semibold text-foreground">Reputation DAO</h2>
              <p className="text-xs text-muted-foreground">Decentralized Reputation</p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className="flex justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center">
              <Award className="w-4 h-4 text-white" />
            </div>
          </div>
        )}
      </SidebarHeader>

      <SidebarContent className="px-2 py-4">
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Main Navigation
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {filteredMainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive }) => 
                        `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${getNavClass(isActive)}`
                      }
                    >
                      <item.icon className="w-5 h-5 flex-shrink-0" />
                      {!collapsed && <span className="truncate">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {filteredSettingsItems.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
              Settings
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {filteredSettingsItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <NavLink 
                        to={item.url} 
                        className={({ isActive }) => 
                          `flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 ${getNavClass(isActive)}`
                        }
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        {!collapsed && <span className="truncate">{item.title}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className="border-t border-border/40 p-4">
        {!collapsed && (
          <div className="space-y-3 animate-fade-in">
            <div className="flex items-center gap-3 p-3 glass-card rounded-lg">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary-glow/20 text-primary">
                  {userName.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{userName}</p>
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
                {userName.charAt(0).toUpperCase()}
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
      </SidebarFooter>
    </Sidebar>
  );
}