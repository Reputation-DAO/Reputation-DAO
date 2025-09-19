import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Principal } from "@dfinity/principal";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { getBalance, getOrgUserBalances, getOrgTransactionHistory, getOrgStats } from "@/services/childCanisterService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { parseTransactionTypeForUI, convertTimestampToDate, extractReason } from "@/utils/transactionUtils";
import {
  Star, 
  Users, 
  TrendingUp,
  Award, 
  Settings, 
  Plus,
  Activity,
  Crown,
  Shield,
  User,
  ArrowUpRight,
  Calendar,
  Target,
  BarChart3,
  LayoutDashboard
} from "lucide-react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";

interface ReputationActivity {
  id: string;
  type: 'awarded' | 'revoked' | 'decayed';
  points: number;
  reason: string;
  timestamp: Date;
  from?: string;
  to?: string;
}

interface Member {
  id: string;
  name: string;
  principal: string;
  reputation: number;
  role: 'admin' | 'awarder' | 'member';
  joinDate: Date;
  lastActive: Date;
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

const StatCard = ({ title, value, icon: Icon, trend, description }: {
  title: string;
  value: string | number;
  icon: any;
  trend?: string;
  description?: string;
}) => (
  <Card className="glass-card p-6 hover:shadow-[var(--shadow-glow)] transition-all duration-300 group">
    <div className="flex items-center justify-between mb-4">
      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/10 to-primary-glow/10 flex items-center justify-center group-hover:from-primary/20 group-hover:to-primary-glow/20 transition-all duration-300">
        <Icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform duration-300" />
      </div>
      {trend && (
        <Badge variant="secondary" className="text-green-600 bg-green-600/10">
          <ArrowUpRight className="w-3 h-3 mr-1" />
          {trend}
        </Badge>
      )}
    </div>
    <div>
      <h3 className="text-2xl font-bold text-foreground mb-1">{value}</h3>
      <p className="text-sm font-medium text-muted-foreground mb-1">{title}</p>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  </Card>
);

const ActivityItem = ({ activity }: { activity: ReputationActivity }) => (
  <div className="flex items-center gap-4 p-4 glass-card rounded-lg hover:shadow-md transition-all duration-200">
    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
      activity.type === 'awarded' ? 'bg-green-500/10 text-green-600' :
      activity.type === 'revoked' ? 'bg-red-500/10 text-red-600' :
      activity.type === 'decayed' ? 'bg-orange-500/10 text-orange-600' :
      'bg-blue-500/10 text-blue-600'
    }`}>
      <Star className="w-5 h-5" />
    </div>
    
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-medium text-foreground">
          {activity.type === 'awarded' ? '+' : activity.type === 'revoked' ? '-' : activity.type === 'decayed' ? '-' : '+'}{activity.points} points
        </span>
        <Badge variant="outline" className="text-xs">
          {activity.type}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{activity.reason}</p>
      {(activity.from || activity.to) && (
        <p className="text-xs text-muted-foreground mt-1">
          {activity.from && `From: ${activity.from}`}
          {activity.to && `To: ${activity.to}`}
        </p>
      )}
    </div>
    
    <div className="text-xs text-muted-foreground">
      {activity.timestamp.toLocaleDateString()}
    </div>
  </div>
);

const MemberItem = ({ member }: { member: Member }) => (
  <div className="flex items-center gap-4 p-4 glass-card rounded-lg hover:shadow-md transition-all duration-200">
    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center">
      <User className="w-5 h-5 text-primary" />
    </div>
    
    <div className="flex-1">
      <div className="flex items-center gap-2 mb-1">
        <span className="font-medium text-foreground">{member.name}</span>
        <Badge variant="secondary" className="flex items-center gap-1">
          <RoleIcon role={member.role} />
          {member.role}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground">{member.principal.toString().slice(0, 20)}...</p>
    </div>
    
    <div className="text-right">
      <div className="font-medium text-foreground">{member.reputation} rep</div>
      <div className="text-xs text-muted-foreground">
        Active {new Date(member.lastActive).toLocaleDateString()}
      </div>
    </div>
  </div>
);

const Dashboard = () => {
  const navigate = useNavigate();
  const { userRole, loading: roleLoading } = useRole();
  const { isAuthenticated, principal } = useAuth();
  const [userName] = useState("John Doe");
  const [userBalance, setUserBalance] = useState(0);
  const [loading, setLoading] = useState(false);
  const [orgStats, setOrgStats] = useState({
    totalMembers: 0,
    totalReputation: 0,
    growthRate: "0%",
    recentTransactions: 0
  });
  
  // Debug logging
  useEffect(() => {
    console.log('🏠 Dashboard mounted with state:', {
      isAuthenticated,
      principal: principal?.toString(),
      userRole,
      roleLoading,
      selectedOrgId: localStorage.getItem('selectedOrgId')
    });
  }, [isAuthenticated, principal, userRole, roleLoading]);
  
  // Load user's balance
  useEffect(() => {
    const loadBalance = async () => {
      if (isAuthenticated && principal) {
        try {
          setLoading(true);
          const principalObj = principal;
          const balance = await getBalance(principalObj);
          if (typeof balance === 'number') {
            setUserBalance(balance);
          }
        } catch (error) {
          console.error("Error loading balance:", error);
          toast.error("Failed to load reputation balance");
        } finally {
          setLoading(false);
        }
      }
    };
    loadBalance();
  }, [isAuthenticated, principal]);
  
  // Load organization stats
  useEffect(() => {
    const loadOrgStats = async () => {
      const selectedOrgId = localStorage.getItem('selectedOrgId');
      if (!selectedOrgId || !isAuthenticated) return;
      
      try {
        console.log('📊 Loading organization stats for:', selectedOrgId);
        
        // Get organization stats (total points distributed, not current balances)
        const orgStatsData = await getOrgStats();
        const totalPointsDistributed = orgStatsData?.totalPoints || 0;
        const totalMembers = orgStatsData?.userCount || 0;
        
        // Get all users and their current balances for member list
        const userBalances = await getOrgUserBalances();
        
        // Convert user balances to members data
        const membersData: Member[] = userBalances.map((user, index) => ({
          id: `member-${index}`,
          name: `User ${user.userId.toString().slice(0, 8)}`,
          principal: user.userId.toString(),
          reputation: user.balance,
          role: 'member' as const, // Default role - could be enhanced to get actual roles
          joinDate: new Date(), // Placeholder - would need historical data
          lastActive: new Date() // Placeholder - would need activity tracking
        }));
        
        setMembers(membersData);
        
        // Get recent transactions for activity count and recent activity
        const recentTransactions = await getOrgTransactionHistory();
        const recentCount = recentTransactions.length;
        

        // Convert recent transactions to activity data (last 5)
        const activityData: ReputationActivity[] = recentTransactions
          .slice(-5) // Get last 5 transactions
          .reverse() // Show most recent first
          .map((tx, index) => {
            const txType = parseTransactionTypeForUI(tx.transactionType);
            
            return {
              id: `activity-${index}`,
              type: txType,
              points: Number(tx.amount),
              reason: tx.reason || "No reason provided",
              timestamp: convertTimestampToDate(tx.timestamp),
              from: tx.from.toString().slice(0, 8),
              to: tx.to.toString().slice(0, 8)
            };
          });
        
        setRecentActivity(activityData);
        
        // Calculate growth rate (placeholder calculation - in reality you'd compare with historical data)
        const growthRate = totalMembers > 0 ? `+${Math.floor(totalMembers * 0.08)}%` : "0%";
        
        setOrgStats({
          totalMembers,
          totalReputation: totalPointsDistributed, // Total points ever distributed
          growthRate,
          recentTransactions: recentCount
        });
        
        console.log('✅ Organization stats loaded:', {
          totalMembers,
          totalReputation: totalPointsDistributed,
          growthRate,
          recentTransactions: recentCount
        });
        
      } catch (error) {
        console.error('❌ Error loading organization stats:', error);
      }
    };
    
    loadOrgStats();
  }, [isAuthenticated, principal]);
  
  const handleDisconnect = () => {
    navigate('/auth');
  };
  
  const [recentActivity, setRecentActivity] = useState<ReputationActivity[]>([]);

  const [members, setMembers] = useState<Member[]>([]);

  useEffect(() => {
    // Add a small delay to avoid redirecting during connection state updates
    const timer = setTimeout(() => {
      const selectedOrgId = localStorage.getItem('selectedOrgId');
      const userRole = localStorage.getItem('userRole');
      
      console.log('🔍 Dashboard redirect check:', {
        isAuthenticated,
        principal: principal?.toString(),
        selectedOrgId,
        userRole,
        roleLoading
      });
      
      // Don't redirect if role is still loading or if we're coming from org creation
      if (roleLoading) {
        console.log('⏳ Role still loading, skipping redirect check');
        return;
      }
      
      // Only redirect if truly not connected and no valid session exists
      if (!isAuthenticated && !principal) {
        if (!selectedOrgId || !userRole) {
          console.log('❌ No connection and no valid session, redirecting to auth');
          navigate('/auth');
        } else {
          console.log('⚠️ Session exists but not connected, redirecting to org selector');
          navigate('/org-selector');
        }
      }
    }, 3000); // 3 second delay to allow all state to fully stabilize

    return () => clearTimeout(timer);
  }, [isAuthenticated, principal, roleLoading, navigate]);

  const quickActions = [
    {
      title: "Award Reputation",
      description: "Give reputation points to members",
      icon: Award,
      action: () => navigate('/award-rep'),
      variant: "hero" as const,
      show: ['Admin', 'Awarder'].includes(userRole || '')
    },
    {
      title: "Manage Members",
      description: "Add or manage organization members",
      icon: Users,
      action: () => navigate('/manage-awarders'),
      variant: "outline" as const,
      show: userRole === 'Admin'
    },
    {
      title: "View Activity",
      description: "See all reputation transactions",
      icon: Activity,
      action: () => navigate('/activity'),
      variant: "outline" as const,
      show: true
    },
    {
      title: "Settings",
      description: "Configure organization settings",
      icon: Settings,
      action: () => navigate('/settings'),
      variant: "ghost" as const,
      show: userRole === 'Admin'
    }
  ].filter(action => action.show);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center">
        <Card className="glass-card p-8 max-w-md mx-auto text-center">
          <h2 className="text-xl font-bold text-foreground mb-2">Wallet Required</h2>
          <p className="text-muted-foreground mb-4">
            Please connect your wallet to access the dashboard.
          </p>
          <Button onClick={() => navigate('/auth')}>
            Connect Wallet
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background/95 to-muted/20">
        <DashboardSidebar 
          userRole={userRole?.toLowerCase() as 'admin' | 'awarder' | 'member' || 'member'}
          userName={userName}
          userPrincipal={principal?.toString() || ""}
          onDisconnect={handleDisconnect}
        />
        
        <div className="flex-1">
          <header className="h-16 border-b border-border/40 flex items-center justify-between px-6 glass-header">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="mr-4" />
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary-glow/20 flex items-center justify-center">
                <LayoutDashboard className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Dashboard</h1>
                <p className="text-xs text-muted-foreground">Welcome back to {localStorage.getItem('selectedOrgId') || "Reputation DAO"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <ThemeToggle />
            </div>
          </header>
          
          <main className="p-6">
            <div className="relative pt-20">
              {/* Background Effects */}
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/3 rounded-full blur-3xl animate-pulse-glow" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary-glow/3 rounded-full blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
              </div>

              <div className="relative max-w-7xl mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8 animate-fade-in">
            <div>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                Welcome back to {localStorage.getItem('selectedOrgId') || "Reputation DAO"}
              </h1>
              <p className="text-muted-foreground">
                Manage reputation, track activity, and grow your community
              </p>
            </div>
            
            <Badge variant="secondary" className="flex items-center gap-2 px-4 py-2">
              <RoleIcon role={userRole?.toLowerCase() || 'member'} />
              <span className="capitalize">{userRole || 'Member'}</span>
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="animate-fade-in" style={{ animationDelay: '0.1s' }}>
              <StatCard
                title="Total Members"
                value={orgStats.totalMembers}
                icon={Users}
                trend={orgStats.totalMembers > 0 ? `+${Math.floor(orgStats.totalMembers * 0.12)}%` : "0%"}
                description="Active community members"
              />
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.2s' }}>
              <StatCard
                title="Total Reputation"
                value={orgStats.totalReputation.toLocaleString()}
                icon={Star}
                trend={orgStats.totalReputation > 0 ? `+${Math.floor(orgStats.totalReputation * 0.08)}%` : "0%"}
                description="Points distributed"
              />
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <StatCard
                title="Your Reputation"
                value={loading ? "Loading..." : userBalance}
                icon={Award}
                trend={userBalance > 0 ? `+${Math.floor(userBalance * 0.1)}%` : ""}
                description="Your current points"
              />
            </div>
            <div className="animate-fade-in" style={{ animationDelay: '0.4s' }}>
        <StatCard
                title="Growth Rate"
                value={orgStats.growthRate}
                icon={BarChart3}
                description="Member growth rate"
              />
            </div>
          </div>

          {/* Quick Actions */}
          <div className="mb-8 animate-fade-in" style={{ animationDelay: '0.5s' }}>
            <h2 className="text-xl font-semibold text-foreground mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => (
                <Button
                  key={action.title}
                  variant={action.variant}
                  onClick={action.action}
                  className="h-auto p-4 flex flex-col items-start gap-2 hover:scale-105 transition-all duration-300"
                >
                  <action.icon className="w-5 h-5" />
                  <div className="text-left">
                    <div className="font-medium">{action.title}</div>
                    <div className="text-xs opacity-70">{action.description}</div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* Main Content Tabs */}
          <div className="animate-fade-in" style={{ animationDelay: '0.6s' }}>
            <Tabs defaultValue="activity" className="space-y-6">
              <TabsList className="grid grid-cols-3 w-full max-w-md glass">
                <TabsTrigger value="activity">Recent Activity</TabsTrigger>
                <TabsTrigger value="members">Members</TabsTrigger>
                <TabsTrigger value="analytics">Analytics</TabsTrigger>
              </TabsList>

              <TabsContent value="activity" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
                  <Button variant="outline" size="sm">
                    View All
                    <ArrowUpRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
                
                <div className="space-y-3">
                  {recentActivity.map((activity) => (
                    <ActivityItem key={activity.id} activity={activity} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="members" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-foreground">Organization Members</h3>
                  {userRole === 'Admin' && (
                    <Button variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-1" />
                      Add Member
                    </Button>
                  )}
                </div>
                
                <div className="space-y-3">
                  {members.map((member) => (
                    <MemberItem key={member.id} member={member} />
                  ))}
                </div>
              </TabsContent>

              <TabsContent value="analytics" className="space-y-4">
                <h3 className="text-lg font-semibold text-foreground">Analytics & Insights</h3>
                
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="glass-card p-6">
                    <h4 className="font-medium text-foreground mb-4">Reputation Distribution</h4>
                    <div className="space-y-3">
                      {members.map((member, index) => (
                        <div key={member.id} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{member.name}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-gradient-to-r from-primary to-primary-glow rounded-full transition-all duration-1000"
                                style={{ 
                                  width: `${(member.reputation / Math.max(...members.map(m => m.reputation))) * 100}%`,
                                  animationDelay: `${index * 0.1}s`
                                }}
                              />
                            </div>
                            <span className="text-sm font-medium text-foreground">{member.reputation}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                  
                  <Card className="glass-card p-6">
                    <h4 className="font-medium text-foreground mb-4">Monthly Growth</h4>
                    <div className="space-y-4">
                      {/* Simple Bar Chart */}
                      <div className="space-y-3">
                        {/* January */}
                        <div className="flex items-center gap-3">
                          <span className="text-sm w-12 text-muted-foreground">Jan</span>
                          <div className="flex-1 bg-muted/30 h-4 rounded overflow-hidden">
                            <div className="bg-primary h-full rounded transition-all duration-500" style={{ width: '75%' }}></div>
                          </div>
                          <span className="text-sm w-12 text-muted-foreground">+750</span>
                        </div>
                        
                        {/* February */}
                        <div className="flex items-center gap-3">
                          <span className="text-sm w-12 text-muted-foreground">Feb</span>
                          <div className="flex-1 bg-muted/30 h-4 rounded overflow-hidden">
                            <div className="bg-primary h-full rounded transition-all duration-500" style={{ width: '60%' }}></div>
                          </div>
                          <span className="text-sm w-12 text-muted-foreground">+600</span>
                        </div>
                        
                        {/* March */}
                        <div className="flex items-center gap-3">
                          <span className="text-sm w-12 text-muted-foreground">Mar</span>
                          <div className="flex-1 bg-muted/30 h-4 rounded overflow-hidden">
                            <div className="bg-primary h-full rounded transition-all duration-500" style={{ width: '90%' }}></div>
                          </div>
                          <span className="text-sm w-12 text-muted-foreground">+900</span>
                        </div>
                        
                        {/* April */}
                        <div className="flex items-center gap-3">
                          <span className="text-sm w-12 text-muted-foreground">Apr</span>
                          <div className="flex-1 bg-muted/30 h-4 rounded overflow-hidden">
                            <div className="bg-green-500 h-full rounded transition-all duration-500" style={{ width: '100%' }}></div>
                          </div>
                          <span className="text-sm w-12 text-muted-foreground">+1000</span>
                        </div>
                        
                        {/* May */}
                        <div className="flex items-center gap-3">
                          <span className="text-sm w-12 text-muted-foreground">May</span>
                          <div className="flex-1 bg-muted/30 h-4 rounded overflow-hidden">
                            <div className="bg-primary h-full rounded transition-all duration-500" style={{ width: '85%' }}></div>
                          </div>
                          <span className="text-sm w-12 text-muted-foreground">+850</span>
                        </div>
                        
                        {/* June */}
                        <div className="flex items-center gap-3">
                          <span className="text-sm w-12 text-muted-foreground">Jun</span>
                          <div className="flex-1 bg-muted/30 h-4 rounded overflow-hidden">
                            <div className="bg-primary h-full rounded transition-all duration-500" style={{ width: '70%' }}></div>
                          </div>
                          <span className="text-sm w-12 text-muted-foreground">+700</span>
                        </div>
                      </div>
                      
                      <div className="text-center pt-2">
                        <p className="text-xs text-muted-foreground">Reputation Points Awarded Per Month</p>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
              </div>
            </div>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default Dashboard;