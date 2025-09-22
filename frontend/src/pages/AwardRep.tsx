// src/pages/AwardRep.tsx
// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useRole } from "@/contexts/RoleContext";
import { usePlugConnection } from "@/hooks/usePlugConnection";
import { getUserDisplayData } from "@/utils/userUtils";
import { awardRep, getOrgTransactionHistory, getOrgStats } from "@/services/childCanisterService";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar"; // add useSidebar
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "sonner";
import { parseTransactionType, convertTimestampToDate, extractReason, formatDateForDisplay } from "@/utils/transactionUtils";
import { 
  Award, 
  Star, 
  TrendingUp, 
  User,
  AlertTriangle,
  CheckCircle,
  Info
} from "lucide-react";

interface AwardFormData {
  recipientAddress: string;
  reputationAmount: string;
  category: string;
  reason: string;
}

interface RecentAward {
  id: string;
  recipientName: string;
  recipientAddress: string;
  amount: number;
  category: string;
  reason: string;
  timestamp: Date;
  awardedBy: string;
}

const categories = [
  "Development",
  "Community Building", 
  "Innovation",
  "Leadership",
  "Mentorship",
  "Documentation",
  "Testing",
  "Design",
  "Marketing",
  "Other"
];

const AwardRep = () => {
  const navigate = useNavigate();
  const { userRole } = useRole();
  const { isConnected, principal } = usePlugConnection({ autoCheck: true });
  const [isAwarding, setIsAwarding] = useState(false);
  
  const [formData, setFormData] = useState<AwardFormData>({
    recipientAddress: '',
    reputationAmount: '',
    category: '',
    reason: ''
  });

  const [recentAwards, setRecentAwards] = useState<RecentAward[]>([]);

  const [stats, setStats] = useState({
    totalAwards: 0,
    totalREPAwarded: 0,
    monthlyAwards: 0
  });

  // Load award statistics and recent awards
  useEffect(() => {
    const loadAwardData = async () => {
      const selectedOrgId = localStorage.getItem('selectedOrgId');
      console.log('🔍 AwardRep: selectedOrgId from localStorage:', selectedOrgId);
      console.log('🔍 AwardRep: isConnected:', isConnected);
      console.log('🔍 AwardRep: principal:', principal?.toString());
      
      if (!selectedOrgId || !isConnected) {
        console.log('❌ AwardRep: Missing orgId or not connected, skipping data load');
        // Let's also check if there's a default org we can use
        if (isConnected && principal) {
          try {
            console.log('🔍 AwardRep: Trying to use default org "sample"');
            const defaultOrgId = "sample";
            localStorage.setItem('selectedOrgId', defaultOrgId);
            
            const orgStats = await getOrgStats();
            console.log('📊 AwardRep: Default org stats:', orgStats);
            
            if (orgStats) {
              setStats({
                totalAwards: Number(orgStats.totalTransactions),
                totalREPAwarded: orgStats.totalPoints,
                monthlyAwards: 0
              });
            }
          } catch (error) {
            console.error('❌ AwardRep: Error with default org:', error);
          }
        }
        return;
      }

      try {
        console.log('📊 AwardRep: Loading award statistics for:', selectedOrgId);
        
        // Get organization stats for total awarded points
        console.log('📊 AwardRep: Calling getOrgStats...');
        const orgStats = await getOrgStats();
        console.log('📊 AwardRep: orgStats result:', orgStats);
        
        const totalREPAwarded = orgStats?.totalPoints || 0;
        const totalTransactions = orgStats?.totalTransactions || 0;
        
        // Get transaction history to analyze awards
        console.log('📊 AwardRep: Calling getOrgTransactionHistory...');
        const transactions = await getOrgTransactionHistory();
        console.log('📊 AwardRep: transactions result:', transactions);
        

        // Filter only Award transactions
        const awardTransactions = transactions.filter(tx => {
          const transactionType = parseTransactionType(tx.transactionType);
          const isAward = transactionType === 'award';
          console.log('🔍 AwardRep: Transaction type check:', {
            original: tx.transactionType,
            parsed: transactionType,
            isAward: isAward,
            amount: tx.amount,
            from: tx.from.toString(),
            to: tx.to.toString()
          });
          return isAward;
        });
        
        console.log('📊 AwardRep: Found award transactions:', awardTransactions.length);
        
        const totalAwards = awardTransactions.length;
        
        // Calculate monthly awards (transactions from current month)
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyAwards = awardTransactions.filter(tx => {
          const txDate = convertTimestampToDate(tx.timestamp);
          return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
        }).length;
        
        console.log('📊 AwardRep: Calculated stats:', {
          totalAwards,
          totalREPAwarded,
          monthlyAwards
        });
        
        setStats({
          totalAwards,
          totalREPAwarded,
          monthlyAwards
        });
        
        // Convert recent award transactions to RecentAward format (last 5 awards)
        const recentAwardData: RecentAward[] = awardTransactions
          .slice(-5) // Get last 5 awards
          .reverse() // Show most recent first
          .map((tx, index) => ({
            id: `award-${index}`,
            recipientName: `User ${tx.to.toString().slice(0, 8)}`,
            recipientAddress: tx.to.toString(),
            amount: Number(tx.amount),
            category: "General", // Backend doesn't store category, so default
            reason: tx.reason || "No reason provided",
            timestamp: convertTimestampToDate(tx.timestamp),
            awardedBy: `User ${tx.from.toString().slice(0, 8)}`
          }));
          
        console.log('📊 AwardRep: Recent award data:', recentAwardData);
        setRecentAwards(recentAwardData);
        
        console.log('✅ AwardRep: Award data loaded successfully');
        
      } catch (error) {
        console.error('❌ AwardRep: Error loading award data:', error);
      }
    };

    loadAwardData();
  }, [isConnected, principal]); // Added principal as dependency

  const handleInputChange = (field: keyof AwardFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.recipientAddress || !formData.reputationAmount || !formData.category || !formData.reason) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Basic Principal ID validation (should contain hyphens and be reasonable length)
    if (!formData.recipientAddress.includes('-') || formData.recipientAddress.length < 20) {
      toast.error("Please enter a valid Principal ID");
      return;
    }

    if (!isConnected || !principal) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (userRole !== "Admin" && userRole !== "Awarder") {
      toast.error("Only Admins and Awarders can award reputation");
      return;
    }

    setIsAwarding(true);
    try {
      console.log('🎯 Awarding reputation:', {
        recipient: formData.recipientAddress,
        amount: parseInt(formData.reputationAmount),
        reason: formData.reason
      });
      
      const result = await awardRep(
        formData.recipientAddress, 
        parseInt(formData.reputationAmount), 
        formData.reason
      );
      
      console.log('✅ Award result:', result);
      
      // Simple string result from canister
      toast.success(`Successfully awarded ${formData.reputationAmount} REP points!`);
      
      // Reset form
      setFormData({
        recipientAddress: '',
        reputationAmount: '',
        category: '',
        reason: ''
      });
    } catch (error) {
      console.error("Error awarding reputation:", error);
      
      if (error instanceof Error) {
        if (error.message.includes("Not a trusted awarder")) {
          toast.error("You are not authorized to award reputation. Only trusted awarders can award points.");
        } else if (error.message.includes("Paused")) {
          toast.error("The reputation system is currently paused.");
        } else if (error.message.includes("Amount must be > 0")) {
          toast.error("Amount must be greater than 0.");
        } else if (error.message.includes("Cannot self-award")) {
          toast.error("You cannot award reputation to yourself.");
        } else if (error.message.includes("Blacklisted principal")) {
          toast.error("This principal is blacklisted and cannot receive reputation.");
        } else if (error.message.includes("Invalid principal")) {
          toast.error("Invalid recipient address. Please check the principal format.");
        } else if (error.message.includes("Organization does not exist")) {
          toast.error("Organization not found. Please check your organization selection.");
        } else {
          toast.error(`Failed to award reputation: ${error.message}`);
        }
      } else {
        toast.error("Failed to award reputation. Please try again.");
      }
    } finally {
      setIsAwarding(false);
    }
  };

  const handleDisconnect = () => {
    navigate('/auth');
  };

  if (!isConnected || (userRole !== "Admin" && userRole !== "Awarder")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center">
        <Card className="glass-card p-8 max-w-md mx-auto text-center">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            {!isConnected ? "Please connect your wallet to award reputation points." : "You don't have permission to award reputation points."}
          </p>
          <Button onClick={() => navigate(!isConnected ? '/auth' : '/dashboard')}>
            {!isConnected ? 'Connect Wallet' : 'Return to Dashboard'}
          </Button>
        </Card>
      </div>
    );
  }

  // ✅ Only layout change below: wrap in SidebarProvider and read sidebar state in inner component
  return (
    <SidebarProvider>
      <InnerAwardRep
        userRole={userRole}
        principal={principal}
        handleDisconnect={handleDisconnect}
        formData={formData}
        setFormData={setFormData}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isAwarding={isAwarding}
        stats={stats}
        recentAwards={recentAwards}
        navigate={navigate}
      />
    </SidebarProvider>
  );
};

function InnerAwardRep(props: any) {
  const {
    userRole,
    principal,
    handleDisconnect,
    formData,
    setFormData,
    handleInputChange,
    handleSubmit,
    isAwarding,
    stats,
    recentAwards,
    navigate,
  } = props;

  // Read sidebar state and pad content (collapsed: 72px, expanded: 280px)
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  const userDisplay = getUserDisplayData(principal);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background/95 to-muted/20">
      <DashboardSidebar 
        userRole={(userRole?.toLowerCase() as 'admin' | 'awarder' | 'member') || 'member'}
        userName={userDisplay.userName}
        userPrincipal={userDisplay.userPrincipal}
        onDisconnect={handleDisconnect}
      />

      {/* Push main content to the right of the fixed sidebar on md+ */}
      <div
        className={`flex min-h-screen flex-col transition-[padding-left] duration-300 pl-0 ${
          collapsed ? "md:pl-[72px]" : "md:pl-[280px]"
        }`}
      >
        {/* Header */}
        <header className="h-16 border-b border-border/40 flex items-center justify-between px-6 glass-header">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="mr-4" />
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
              <Award className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Award Reputation</h1>
              <p className="text-xs text-muted-foreground">Distribute reputation points to community members</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Award Form */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="glass-card p-6 animate-fade-in">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                      <Star className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">Award Reputation Points</h2>
                      <p className="text-sm text-muted-foreground">Recognize valuable contributions</p>
                    </div>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="recipientAddress" className="text-sm font-medium text-foreground">
                          Recipient Address *
                        </Label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="recipientAddress"
                            placeholder="Enter ICP address"
                            value={formData.recipientAddress}
                            onChange={(e) => handleInputChange('recipientAddress', e.target.value)}
                            className="pl-10 glass-input"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reputationAmount" className="text-sm font-medium text-foreground">
                          Reputation Amount *
                        </Label>
                        <div className="relative">
                          <Star className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="reputationAmount"
                            type="number"
                            placeholder="Enter amount"
                            value={formData.reputationAmount}
                            onChange={(e) => handleInputChange('reputationAmount', e.target.value)}
                            className="pl-10 glass-input"
                            min="1"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Category *</Label>
                      <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                        <SelectTrigger className="glass-input">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="reason" className="text-sm font-medium text-foreground">
                        Reason for Award *
                      </Label>
                      <Textarea
                        id="reason"
                        placeholder="Describe the contribution or achievement..."
                        value={formData.reason}
                        onChange={(e) => handleInputChange('reason', e.target.value)}
                        className="glass-input min-h-[100px] resize-none"
                        required
                      />
                    </div>

                    <div className="flex items-center gap-2 p-4 bg-blue-500/5 border border-blue-500/10 rounded-lg">
                      <Info className="w-5 h-5 text-blue-600 flex-shrink-0" />
                      <p className="text-sm text-muted-foreground">
                        Include detailed reasons to help build trust in the reputation system.
                      </p>
                    </div>

                    <Button type="submit" variant="hero" size="lg" className="w-full group" disabled={isAwarding}>
                      {isAwarding ? (
                        <>
                          <div className="w-5 h-5 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Awarding...
                        </>
                      ) : (
                        <>
                          <Award className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                          Award Reputation
                        </>
                      )}
                    </Button>
                  </form>
                </Card>
              </div>

              {/* Sidebar Stats & Recent Awards */}
              <div className="space-y-6">
                {/* Award Summary */}
                <Card className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4 text-green-600" />
                    </div>
                    <h3 className="font-semibold text-foreground">Award Summary</h3>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 glass-card rounded-lg">
                      <span className="text-sm text-muted-foreground">Total Awards</span>
                      <Badge variant="secondary" className="font-mono">
                        {stats.totalAwards}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 glass-card rounded-lg">
                      <span className="text-sm text-muted-foreground">Total REP Awarded</span>
                      <Badge variant="secondary" className="font-mono">
                        {stats.totalREPAwarded} REP
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 glass-card rounded-lg">
                      <span className="text-sm text-muted-foreground">This Month</span>
                      <Badge variant="secondary" className="font-mono">
                        {stats.monthlyAwards}
                      </Badge>
                    </div>
                  </div>
                </Card>

                {/* Recent Awards */}
                <Card className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Recent Awards</h3>
                    <Button variant="ghost" size="sm" onClick={() => navigate('/transaction-log')}>
                      View all
                    </Button>
                  </div>
                  
                  <div className="space-y-3">
                    {recentAwards.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <Award className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No recent awards found</p>
                      </div>
                    ) : (
                      recentAwards.map((award) => (
                        <div key={award.id} className="p-3 glass-card rounded-lg hover:shadow-md transition-all duration-200">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-foreground text-sm">
                              {award.recipientName}
                            </span>
                            <Badge variant="secondary" className="text-xs">
                              +{award.amount} REP
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                            {award.reason}
                          </p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs">
                              {award.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDateForDisplay(award.timestamp)}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default AwardRep;
