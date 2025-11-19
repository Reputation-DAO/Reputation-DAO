// src/components/layout/DashboardLayout.tsx
import React, {
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
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
  MessageCircle,
  PanelLeft,
  Eye,
  EyeOff,
  Coins,
  DollarSign,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { toast } from "sonner";
import { Principal } from "@dfinity/principal";
import { makeFactoriaWithPlug } from "@/lib/canisters"; // <-- ensure this exists

const SIDEBAR_COOKIE_NAME = "sidebar:collapsed";
const SIDEBAR_COOKIE_MAX_AGE = 60 * 60 * 24 * 7;

const mainNavItems = [
  { id: "dashboard", title: "Dashboard", slug: "home", icon: LayoutDashboard, roles: ["admin", "awarder", "member"] },
  { id: "decay", title: "Decay System", slug: "decay-system", icon: Timer, roles: ["admin"] },
  { id: "economy", title: "Economy Settings", slug: "economy-settings", icon: Coins, roles: ["admin"] },
  { id: "award", title: "Award Rep", slug: "award-rep", icon: Award, roles: ["admin", "awarder"] },
  { id: "revoke", title: "Revoke Rep", slug: "revoke-rep", icon: UserMinus, roles: ["admin"] },
  { id: "manage", title: "Manage Awarders", slug: "manage-awarders", icon: Users, roles: ["admin"] },
  { id: "balances", title: "View Balances", slug: "view-balances", icon: Wallet, roles: ["admin", "awarder", "member"] },
  { id: "transactions", title: "Transaction Log", slug: "transaction-log", icon: FileText, roles: ["admin", "awarder", "member"] },
  { id: "earnings", title: "My Earnings", slug: "my-earnings", icon: DollarSign, roles: ["admin", "awarder", "member"] },
];

const supportItems = [
  { id: "faqs", title: "FAQs", url: "/#faq", icon: MessageCircle, roles: ["admin", "awarder", "member"] },
];

const settingsItems = [
  { id: "settings", title: "Settings", url: "/settings", icon: Settings, roles: ["admin"] },
];

type DashboardSidebarContextValue = {
  collapsed: boolean;
  toggle: () => void;
  isMobile: boolean;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
};

const DashboardSidebarContext = React.createContext<DashboardSidebarContextValue | null>(null);

function useDashboardSidebar() {
  const context = useContext(DashboardSidebarContext);
  if (!context) {
    throw new Error("useDashboardSidebar must be used within DashboardSidebarProvider");
  }
  return context;
}

function readCollapsedFromCookie() {
  if (typeof document === "undefined") return false;
  const entry = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${SIDEBAR_COOKIE_NAME}=`));
  if (!entry) return false;
  return entry.split("=")[1] === "true";
}

function writeCollapsedToCookie(next: boolean) {
  if (typeof document === "undefined") return;
  document.cookie = `${SIDEBAR_COOKIE_NAME}=${String(next)}; path=/; max-age=${SIDEBAR_COOKIE_MAX_AGE}`;
}

function DashboardSidebarProvider({ children }: { children: ReactNode }) {
  const isMobile = useIsMobile();
  const [collapsed, setCollapsed] = useState(() => readCollapsedFromCookie());
  const [openMobile, setOpenMobile] = useState(false);

  useEffect(() => {
    if (!isMobile) setOpenMobile(false);
  }, [isMobile]);

  const toggle = useCallback(() => {
    if (isMobile) {
      setOpenMobile((prev) => !prev);
    } else {
      setCollapsed((prev) => {
        const next = !prev;
        writeCollapsedToCookie(next);
        return next;
      });
    }
  }, [isMobile]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "b" && (event.metaKey || event.ctrlKey)) {
        event.preventDefault();
        toggle();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggle]);

  const value = useMemo(
    () => ({ collapsed, toggle, isMobile, openMobile, setOpenMobile }),
    [collapsed, toggle, isMobile, openMobile]
  );

  return (
    <DashboardSidebarContext.Provider value={value}>
      {children}
    </DashboardSidebarContext.Provider>
  );
}

export interface DashboardLayoutProps {
  sidebar: {
    userRole: "admin" | "awarder" | "member";
    userName: string;
    userPrincipal: string;
    onDisconnect: () => void;
  };
  className?: string;
  children: ReactNode | ((context: { collapsed: boolean }) => ReactNode);
}

export function DashboardLayout({ sidebar, className, children }: DashboardLayoutProps) {
  return (
    <DashboardSidebarProvider>
      <DashboardLayoutShell sidebar={sidebar} className={className}>
        {children}
      </DashboardLayoutShell>
    </DashboardSidebarProvider>
  );
}

function DashboardLayoutShell({
  sidebar,
  className,
  children,
}: {
  sidebar: DashboardLayoutProps["sidebar"];
  className?: string;
  children: DashboardLayoutProps["children"];
}) {
  const { collapsed } = useDashboardSidebar();
  const content = typeof children === "function" ? children({ collapsed }) : children;

  return (
    <div
      className={cn(
        "min-h-screen w-full bg-gradient-to-br from-background via-background/95 to-muted/20",
        className
      )}
    >
      <DashboardNavigation sidebar={sidebar} />
      <div
        className={cn(
          "flex min-h-screen flex-col transition-[padding-left] duration-300 pl-0",
          collapsed ? "md:pl-[72px]" : "md:pl-[280px]"
        )}
      >
        {content}
      </div>
    </div>
  );
}

const extractCidFromPath = (pathname: string) => {
  const match = pathname.match(/\/dashboard\/[^/]+\/([^/]+)/);
  return match?.[1] ?? "";
};

function DashboardNavigation({ sidebar }: { sidebar: DashboardLayoutProps["sidebar"] }) {
  const location = useLocation();
  const { collapsed, toggle, isMobile, openMobile, setOpenMobile } = useDashboardSidebar();

  const cid = useMemo(() => extractCidFromPath(location.pathname), [location.pathname]);

  const safeRole: "admin" | "awarder" | "member" =
    (["admin", "awarder", "member"] as const).includes(sidebar.userRole)
      ? sidebar.userRole
      : "member";

  const filteredMainItems = mainNavItems.filter((item) => item.roles.includes(safeRole));
  const filteredSupportItems = supportItems.filter((item) => item.roles.includes(safeRole));
  const filteredSettingsItems = settingsItems.filter((item) => item.roles.includes(safeRole));

  useEffect(() => {
    if (isMobile) setOpenMobile(false);
  }, [isMobile, location.pathname, setOpenMobile]);

  const handleNavItemSelect = useCallback(() => {
    if (isMobile) setOpenMobile(false);
  }, [isMobile, setOpenMobile]);

  const sidebarBody = (
    <SidebarContent
      collapsed={collapsed}
      toggle={toggle}
      safeRole={safeRole}
      sidebar={sidebar}
      filteredMainItems={filteredMainItems}
      filteredSupportItems={filteredSupportItems}
      filteredSettingsItems={filteredSettingsItems}
      cid={cid}
      pathname={location.pathname}
      onNavigate={handleNavItemSelect}
    />
  );

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetContent className="w-[18rem] bg-white dark:bg-slate-900 p-0" side="left">
          <div className="flex h-full w-full flex-col overflow-y-auto">
            {sidebarBody}
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <motion.div
      className="fixed inset-y-0 left-0 z-50 overflow-hidden border-r border-slate-200/60 dark:border-slate-800/60"
      initial={false}
      animate={{ width: collapsed ? 72 : 280 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="absolute inset-0 bg-gradient-to-b from-slate-50/80 via-white to-slate-50/40 dark:from-slate-900/90 dark:via-slate-900 dark:to-slate-900/80" />
      <div className="relative z-10 flex h-full flex-col">{sidebarBody}</div>
    </motion.div>
  );
}

function SidebarContent({
  collapsed,
  toggle,
  safeRole,
  sidebar,
  filteredMainItems,
  filteredSupportItems,
  filteredSettingsItems,
  cid,
  pathname,
  onNavigate,
}: {
  collapsed: boolean;
  toggle: () => void;
  safeRole: "admin" | "awarder" | "member";
  sidebar: DashboardLayoutProps["sidebar"];
  filteredMainItems: typeof mainNavItems;
  filteredSupportItems: typeof supportItems;
  filteredSettingsItems: typeof settingsItems;
  cid: string;
  pathname: string;
  onNavigate: () => void;
}) {
  const makePath = useCallback(
    (slug: string) => (cid ? `/dashboard/${slug}/${cid}` : `/dashboard/${slug}`),
    [cid]
  );

  const isActivePath = useCallback(
    (slug: string) => pathname.startsWith(makePath(slug)),
    [pathname, makePath]
  );

  // ---------- Visibility state & handlers ----------
  const [vis, setVis] = useState<"Public" | "Private" | null>(null);
  const [visBusy, setVisBusy] = useState(false);

  // Load current visibility for this cid
  useEffect(() => {
    (async () => {
      try {
        if (!cid) {
          setVis(null);
          return;
        }
        const factoria = await makeFactoriaWithPlug({
          canisterId: import.meta.env.VITE_FACTORIA_CANISTER_ID,
        });
        const res = await factoria.getChild(Principal.fromText(cid));
        if (Array.isArray(res) && res.length) {
          const v = "Public" in res[0].visibility ? "Public" : "Private";
          setVis(v);
        } else {
          setVis(null);
        }
      } catch {
        setVis(null);
      }
    })();
  }, [cid]);

  const onToggleVisibility = useCallback(async () => {
    try {
      if (!cid) return;
      setVisBusy(true);
      const factoria = await makeFactoriaWithPlug({
        canisterId: import.meta.env.VITE_FACTORIA_CANISTER_ID,
      });
      const next = await factoria.toggleVisibility(Principal.fromText(cid));
      const now = "Public" in next ? "Public" : "Private";
      setVis(now);
      toast.success(`Visibility set to ${now}`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to toggle visibility");
    } finally {
      setVisBusy(false);
    }
  }, [cid]);

  return (
    <div className="flex h-full flex-col">
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
                  {sidebar.userName ||
                    (sidebar.userPrincipal
                      ? `${sidebar.userPrincipal.slice(0, 8)}...${sidebar.userPrincipal.slice(-4)}`
                      : "Unknown User")}
                </p>
                <p className="text-slate-500 dark:text-slate-400 text-xs capitalize">{safeRole}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <Button
          variant="ghost"
          size="icon"
          onClick={toggle}
          className="w-8 h-8 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all duration-200"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>

      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 py-6">
        <nav className="space-y-1">
          {filteredMainItems.map((item) => {
            const Icon = item.icon;
            const active = isActivePath(item.slug);
            const to = makePath(item.slug);
            return (
              <motion.div key={item.id} whileHover={{ x: collapsed ? 0 : 2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
                <NavLink
                  to={to}
                  onClick={onNavigate}
                  className={cn(
                    "relative w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-all duration-200 group text-left",
                    active
                      ? "bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm"
                      : "text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                  )}
                >
                  {active && (
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

        {filteredSupportItems.length > 0 && (
          <div className="pt-6">
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
                  <h3 className="text-xs font-medium text-slate-500 dark:text-slate-400 px-3 mb-2 uppercase tracking-wider">
                    Support
                  </h3>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-1">
              {filteredSupportItems.map((item) => {
                const Icon = item.icon;
                return (
                  <motion.div key={item.id} whileHover={{ x: collapsed ? 0 : 2 }} whileTap={{ scale: 0.98 }} transition={{ duration: 0.15 }}>
                    <a
                      href={item.url}
                      onClick={onNavigate}
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
                    </a>
                  </motion.div>
                );
              })}
            </div>
          </div>
        )}

        {!collapsed && filteredSettingsItems.length > 0 && (
          <div className="pt-6">
            <div className="h-px bg-slate-200 dark:bg-slate-800 mb-4" />
            <NavLink
                to={cid ? `/dashboard/settings/${cid}` : "/dashboard/settings"}
                onClick={onNavigate}
                className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-all duration-200 group text-left"
              >
                <Settings className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm font-medium">Settings</span>
              </NavLink>

          </div>
        )}
      </div>

      <div className="px-4 pb-6 border-t border-slate-200/40 dark:border-slate-800/40 pt-4">
        {!collapsed ? (
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 glass-card rounded-lg">
              <Avatar className="w-8 h-8">
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary-glow/20 text-primary">
                  {sidebar.userName ? sidebar.userName.charAt(0).toUpperCase() : "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{sidebar.userName || "Unknown User"}</p>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="flex items-center gap-1 text-xs">
                    <RoleIcon role={safeRole} />
                    {safeRole}
                  </Badge>
                </div>
              </div>
            </div>

            {/* Toggle Visibility button (admin only, requires :cid) */}
            {cid && safeRole === "admin" && (
              <Button
                variant="outline"
                className="w-full justify-start gap-2"
                onClick={onToggleVisibility}
                disabled={visBusy || vis === null}
              >
                {visBusy ? (
                  <div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin" />
                ) : vis === "Public" ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
                {vis === "Public" ? "Make Private" : "Make Public"}
              </Button>
            )}

            <Button
              variant="ghost"
              onClick={sidebar.onDisconnect}
              className="w-full justify-start gap-2 text-muted-foreground hover:text-foreground"
            >
              <LogOut className="w-4 h-4" />
              Disconnect
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <Avatar className="w-8 h-8">
              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary-glow/20 text-primary">
                {sidebar.userName ? sidebar.userName.charAt(0).toUpperCase() : "U"}
              </AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="sm" onClick={sidebar.onDisconnect} className="w-8 h-8 p-0">
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function RoleIcon({ role }: { role: string }) {
  switch (role) {
    case "admin":
      return <Crown className="w-4 h-4 text-yellow-500" />;
    case "awarder":
      return <Shield className="w-4 h-4 text-blue-500" />;
    default:
      return <User className="w-4 h-4 text-green-500" />;
  }
}

export const SidebarTrigger = React.forwardRef<
  React.ElementRef<typeof Button>,
  React.ComponentProps<typeof Button>
>(({ className, onClick, ...props }, ref) => {
  const { toggle } = useDashboardSidebar();
  return (
    <Button
      ref={ref}
      data-sidebar="trigger"
      variant="ghost"
      size="icon"
      className={cn("h-7 w-7", className)}
      onClick={(event) => {
        onClick?.(event);
        toggle();
      }}
      {...props}
    >
      <PanelLeft />
      <span className="sr-only">Toggle Sidebar</span>
    </Button>
  );
});
SidebarTrigger.displayName = "SidebarTrigger";
