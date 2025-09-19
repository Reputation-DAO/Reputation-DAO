import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import { usePlugConnection } from "@/hooks/usePlugConnection";
import { getUserDisplayData } from "@/utils/userUtils";
import { formatDateForDisplay } from "@/utils/transactionUtils";
import { getBalance } from "@/services/childCanisterService";
import { Principal } from "@dfinity/principal";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Wallet,
  Search,
  TrendingUp,
  TrendingDown,
  Users,
  Crown,
  Shield,
  User,
  Star,
  Calendar,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Filter
} from "lucide-react";

interface UserBalance {
  id: string;
  name: string;
  principal: string;
  role: 'admin' | 'awarder' | 'member';
  reputation: number;
  reputationChange: number;
  lastActivity: Date;
  joinDate: Date;
  totalAwarded: number;
  totalRevoked: number;
  rank: number;
}

interface BalanceStats {
  totalUsers: number;
  totalReputation: number;
  averageReputation: number;
  topHolder: UserBalance | null;
  recentGainer: UserBalance | null;
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

const ViewBalances = () => {
  const navigate = useNavigate();
  const { userRole } = useRole();
  const { isConnected, principal } = usePlugConnection({ autoCheck: true });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [balanceSearchQuery, setBalanceSearchQuery] = useState("");
  const [searchedBalance, setSearchedBalance] = useState<{principal: string, balance: number} | null>(null);
  const [sortBy, setSortBy] = useState<'reputation' | 'name' | 'recent'>('reputation');
  const [loading, setLoading] = useState(false);
  const [balanceSearchLoading, setBalanceSearchLoading] = useState(false);
  const [userBalance, setUserBalance] = useState<number>(0);

  // Load user's own balance
  useEffect(() => {
    const loadBalance = async () => {
      if (isConnected && principal) {
        try {
          const principalObj = Principal.fromText(principal);
          const balance = await getBalance(principalObj);
          if (typeof balance === 'number') {
            setUserBalance(balance);
          }
        } catch (error) {
          console.error("Error loading balance:", error);
        }
      }
    };
    loadBalance();
  }, [isConnected, principal]);

  // Function to search for a specific user's balance
  const handleBalanceSearch = async () => {
    if (!balanceSearchQuery.trim()) {
      toast.error("Please enter a valid principal ID");
      return;
    }

    setBalanceSearchLoading(true);
    try {
      const principalObj = Principal.fromText(balanceSearchQuery.trim());
      const balance = await getBalance(principalObj);
      
      if (typeof balance === 'number') {
        setSearchedBalance({
          principal: balanceSearchQuery.trim(),
          balance: balance
        });
        toast.success("Balance retrieved successfully!");
      } else {
        setSearchedBalance(null);
        toast.error("Could not retrieve balance for this principal");
      }
    } catch (error) {
      console.error("Error searching balance:", error);
      toast.error("Invalid principal ID or error retrieving balance");
      setSearchedBalance(null);
    } finally {
      setBalanceSearchLoading(false);
    }
  };

  const [userBalances] = useState<UserBalance[]>([]);

  const handleDisconnect = () => {
    navigate('/auth');
  };

  const filteredBalances = userBalances
    .filter(user => 
      user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.principal.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      switch (sortBy) {
        case 'reputation':
          return b.reputation - a.reputation;
        case 'name':
          return a.name.localeCompare(b.name);
        case 'recent':
          return b.lastActivity.getTime() - a.lastActivity.getTime();
        default:
          return b.reputation - a.reputation;
      }
    });

  const stats: BalanceStats = {
    totalUsers: userBalances.length,
    totalReputation: userBalances.reduce((sum, user) => sum + user.reputation, 0),
    averageReputation: userBalances.length > 0 ? Math.round(userBalances.reduce((sum, user) => sum + user.reputation, 0) / userBalances.length) : 0,
    topHolder: userBalances.length > 0 ? userBalances.reduce((prev, current) => prev.reputation > current.reputation ? prev : current) : null,
    recentGainer: userBalances.length > 0 ? userBalances.reduce((prev, current) => prev.reputationChange > current.reputationChange ? prev : current) : null
  };

  const topPerformers = userBalances.slice(0, 3);
  const recentChanges = userBalances
    .filter(user => user.reputationChange !== 0)
    .sort((a, b) => Math.abs(b.reputationChange) - Math.abs(a.reputationChange))
    .slice(0, 5);

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background/95 to-muted/20">
        <DashboardSidebar 
          userRole={
            userRole
              ? (userRole.toLowerCase() as 'admin' | 'awarder' | 'member')
              : 'member'
          }
          userName={getUserDisplayData(principal).userName}
          userPrincipal={getUserDisplayData(principal).userPrincipal}
          onDisconnect={handleDisconnect}
        />
        
        <div className="flex-1">
          {/* Header */}
          <header className="h-16 border-b border-border/40 flex items-center px-6 glass-header">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                <Wallet className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">View Balances</h1>
                <p className="text-xs text-muted-foreground">Monitor reputation distribution across the organization</p>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-6">
            <div className="max-w-7xl mx-auto space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="glass-card p-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Users</p>
                      <p className="text-2xl font-bold text-foreground">{stats.totalUsers}</p>
                    </div>
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </Card>
                
                <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Reputation</p>
                      <p className="text-2xl font-bold text-foreground">{stats.totalReputation.toLocaleString()}</p>
                    </div>
                    <Star className="w-8 h-8 text-yellow-500" />
                  </div>
                </Card>
                
                <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Average Balance</p>
                      <p className="text-2xl font-bold text-foreground">{stats.averageReputation}</p>
                    </div>
                    <BarChart3 className="w-8 h-8 text-blue-500" />
                  </div>
                </Card>
                
                <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Top Holder</p>
                      <p className="text-lg font-bold text-foreground">{stats.topHolder?.name || 'No data'}</p>
                      <p className="text-sm text-muted-foreground">{stats.topHolder?.reputation || 0} REP</p>
                    </div>
                    <Crown className="w-8 h-8 text-yellow-500" />
                  </div>
                </Card>
              </div>

              <Tabs defaultValue="all-balances" className="space-y-6">
                <TabsList className="grid grid-cols-3 w-full max-w-md glass">
                  <TabsTrigger value="all-balances">All Balances</TabsTrigger>
                  <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
                  <TabsTrigger value="recent-changes">Recent Changes</TabsTrigger>
                </TabsList>

                <TabsContent value="all-balances" className="space-y-6">
                  {/* Balance Search */}
                  <Card className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                    <h3 className="text-lg font-semibold text-foreground mb-4">Check Specific Balance</h3>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative flex-1">
                        <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Enter principal ID to check balance..."
                          value={balanceSearchQuery}
                          onChange={(e) => setBalanceSearchQuery(e.target.value)}
                          className="pl-10 glass-input"
                          onKeyPress={(e) => e.key === 'Enter' && handleBalanceSearch()}
                        />
                      </div>
                      <Button 
                        onClick={handleBalanceSearch}
                        disabled={balanceSearchLoading || !balanceSearchQuery.trim()}
                        className="min-w-32"
                      >
                        {balanceSearchLoading ? (
                          <>
                            <div className="w-4 h-4 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Searching...
                          </>
                        ) : (
                          <>
                            <Search className="w-4 h-4 mr-2" />
                            Search
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {/* Search Result */}
                    {searchedBalance && (
                      <div className="mt-4 p-4 bg-primary/10 rounded-lg border border-primary/20">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-muted-foreground">Principal ID</p>
                            <p className="font-mono text-sm">{searchedBalance.principal}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm text-muted-foreground">Balance</p>
                            <p className="text-2xl font-bold text-primary">{searchedBalance.balance} REP</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </Card>

                  {/* Search and Filter */}
                  <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <div className="flex flex-col md:flex-row gap-4">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by name or principal ID..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 glass-input"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant={sortBy === 'reputation' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSortBy('reputation')}
                        >
                          <Star className="w-4 h-4 mr-1" />
                          Reputation
                        </Button>
                        <Button
                          variant={sortBy === 'name' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSortBy('name')}
                        >
                          <Filter className="w-4 h-4 mr-1" />
                          Name
                        </Button>
                        <Button
                          variant={sortBy === 'recent' ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setSortBy('recent')}
                        >
                          <Calendar className="w-4 h-4 mr-1" />
                          Recent
                        </Button>
                      </div>
                    </div>
                  </Card>

                  {/* Balances List */}
                  <Card className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    <div className="space-y-3">
                      {filteredBalances.map((user, index) => (
                        <div 
                          key={user.id}
                          className="flex items-center justify-between p-4 glass-card rounded-lg hover:shadow-md transition-all duration-200 animate-fade-in"
                          style={{ animationDelay: `${0.6 + index * 0.05}s` }}
                        >
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-mono text-muted-foreground w-8">
                                #{user.rank}
                              </span>
                              <Avatar className="w-10 h-10">
                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary-glow/20 text-primary">
                                  {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                                </AvatarFallback>
                              </Avatar>
                            </div>
                            
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-foreground">{user.name}</span>
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <RoleIcon role={user.role} />
                                  {user.role}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground font-mono">
                                {user.principal.slice(0, 25)}...
                              </p>
                              <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                                <span>Last active: {user.lastActivity.toLocaleDateString()}</span>
                                <span>Joined: {user.joinDate.toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="text-right">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg font-bold text-foreground">
                                {user.reputation.toLocaleString()} REP
                              </span>
                              {user.reputationChange !== 0 && (
                                <Badge 
                                  variant={user.reputationChange > 0 ? 'default' : 'destructive'}
                                  className="flex items-center gap-1"
                                >
                                  {user.reputationChange > 0 ? (
                                    <ArrowUpRight className="w-3 h-3" />
                                  ) : (
                                    <ArrowDownRight className="w-3 h-3" />
                                  )}
                                  {Math.abs(user.reputationChange)}
                                </Badge>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              <div>Awarded: {user.totalAwarded}</div>
                              {user.totalRevoked > 0 && (
                                <div>Revoked: {user.totalRevoked}</div>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="leaderboard" className="space-y-6">
                  <Card className="glass-card p-6 animate-fade-in">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Top Performers</h3>
                    <div className="space-y-4">
                      {topPerformers.map((user, index) => (
                        <div 
                          key={user.id}
                          className={`flex items-center gap-4 p-4 rounded-lg transition-all duration-200 ${
                            index === 0 ? 'bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border border-yellow-500/20' :
                            index === 1 ? 'bg-gradient-to-r from-gray-400/10 to-gray-500/10 border border-gray-400/20' :
                            'bg-gradient-to-r from-orange-500/10 to-orange-600/10 border border-orange-500/20'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                              index === 0 ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' :
                              index === 1 ? 'bg-gradient-to-br from-gray-400 to-gray-500' :
                              'bg-gradient-to-br from-orange-500 to-orange-600'
                            }`}>
                              {index + 1}
                            </div>
                            <Avatar className="w-12 h-12">
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary-glow/20 text-primary">
                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold text-foreground">{user.name}</span>
                              <Badge variant="secondary" className="flex items-center gap-1">
                                <RoleIcon role={user.role} />
                                {user.role}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {user.reputation.toLocaleString()} REP
                            </p>
                          </div>
                          
                          <div className="text-right">
                            {user.reputationChange > 0 && (
                              <Badge variant="default" className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3" />
                                +{user.reputationChange}
                              </Badge>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>

                <TabsContent value="recent-changes" className="space-y-6">
                  <Card className="glass-card p-6 animate-fade-in">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Recent Reputation Changes</h3>
                    <div className="space-y-3">
                      {recentChanges.map((user) => (
                        <div 
                          key={user.id}
                          className="flex items-center justify-between p-4 glass-card rounded-lg hover:shadow-md transition-all duration-200"
                        >
                          <div className="flex items-center gap-3">
                            <Avatar className="w-10 h-10">
                              <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary-glow/20 text-primary">
                                {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <div>
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-foreground">{user.name}</span>
                                <Badge variant="secondary" className="flex items-center gap-1">
                                  <RoleIcon role={user.role} />
                                  {user.role}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                Current: {user.reputation} REP
                              </p>
                            </div>
                          </div>
                          
                          <Badge 
                            variant={user.reputationChange > 0 ? 'default' : 'destructive'}
                            className="flex items-center gap-1"
                          >
                            {user.reputationChange > 0 ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            {user.reputationChange > 0 ? '+' : ''}{user.reputationChange} REP
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ViewBalances;