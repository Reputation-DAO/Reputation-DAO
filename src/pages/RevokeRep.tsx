import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Principal } from "@dfinity/principal";
import { useRole } from "@/contexts/RoleContext";
import { usePlugConnection } from "@/hooks/usePlugConnection";
import { getPlugActor, revokeRep, getTransactionsByUser, getOrgTransactionHistory, getOrgStats } from "@/components/canister/reputationDao";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { toast } from "sonner";
import { parseTransactionType, convertTimestampToDate } from "@/utils/transactionUtils";
import {
  UserMinus,
  AlertTriangle,
  TrendingDown,
  User,
  Shield,
  Info,
  History
} from "lucide-react";

interface RevokeFormData {
  recipientAddress: string;
  reputationAmount: string;
  category: string;
  reason: string;
}

interface RecentRevocation {
  id: string;
  recipientName: string;
  recipientAddress: string;
  amount: number;
  category: string;
  reason: string;
  timestamp: Date;
  revokedBy: string;
}

const revocationCategories = [
  "Misconduct",
  "Policy Violation",
  "Spam",
  "Inactive Participation",
  "Fraudulent Activity",
  "Community Guidelines Violation",
  "Code of Conduct Breach",
  "Other"
];

const RevokeRep = () => {
  const navigate = useNavigate();
  const { userRole, isAdmin, isAwarder } = useRole();
  const { isConnected, principal } = usePlugConnection({ autoCheck: true });
  const [formData, setFormData] = useState<RevokeFormData>({
    recipientAddress: '',
    reputationAmount: '',
    category: '',
    reason: ''
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [recentRevocations, setRecentRevocations] = useState<RecentRevocation[]>([]);
  const [loading, setLoading] = useState(false);
  
  const [stats, setStats] = useState({
    totalRevocations: 0,
    totalREPRevoked: 0,
    monthlyRevocations: 0
  });

  // Load recent revocations and stats
  useEffect(() => {
    const loadRevocationData = async () => {
      const selectedOrgId = localStorage.getItem('selectedOrgId');
      if (!selectedOrgId || !isConnected) return;
      
      try {
        console.log('📊 RevokeRep: Loading revocation data for:', selectedOrgId);
        
        // Get all organization transactions
        const transactions = await getOrgTransactionHistory(selectedOrgId);
        

        // Filter only Revoke transactions
        const revokeTransactions = transactions.filter(tx => {
          const transactionType = parseTransactionType(tx.transactionType);
          const isRevoke = transactionType === 'revoke';
          console.log('🔍 RevokeRep: Transaction type check:', {
            original: tx.transactionType,
            parsed: transactionType,
            isRevoke: isRevoke,
            amount: tx.amount,
            from: tx.from.toString(),
            to: tx.to.toString()
          });
          return isRevoke;
        });
        
        const totalRevocations = revokeTransactions.length;
        const totalREPRevoked = revokeTransactions.reduce((sum, tx) => sum + Number(tx.amount), 0);
        
        // Calculate monthly revocations
        const currentMonth = new Date().getMonth();
        const currentYear = new Date().getFullYear();
        const monthlyRevocations = revokeTransactions.filter(tx => {
          const txDate = convertTimestampToDate(tx.timestamp);
          return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear;
        }).length;
        
        setStats({
          totalRevocations,
          totalREPRevoked,
          monthlyRevocations
        });
        
        // Convert recent revoke transactions to UI format (last 5)
        const recentRevocationData: RecentRevocation[] = revokeTransactions
          .slice(-5)
          .reverse()
          .map((tx, index) => ({
            id: `rev-${index}`,
            recipientName: `User ${tx.to.toString().slice(0, 8)}`,
            recipientAddress: tx.to.toString(),
            amount: Number(tx.amount),
            category: "General",
            reason: tx.reason.length > 0 ? tx.reason[0] : "No reason provided",
            timestamp: convertTimestampToDate(tx.timestamp),
            revokedBy: `User ${tx.from.toString().slice(0, 8)}`
          }));
          
        setRecentRevocations(recentRevocationData);
        
        console.log('✅ RevokeRep: Data loaded:', {
          totalRevocations,
          totalREPRevoked,
          monthlyRevocations,
          recentRevocations: recentRevocationData.length
        });
        
      } catch (error) {
        console.error("❌ RevokeRep: Error loading revocation data:", error);
      }
    };

    loadRevocationData();
  }, [isConnected, principal]);

  const handleInputChange = (field: keyof RevokeFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.recipientAddress || !formData.reputationAmount || !formData.category || !formData.reason) {
      toast.error("Please fill in all required fields");
      return;
    }

    if (!isConnected || !principal) {
      toast.error("Please connect your wallet first");
      return;
    }

    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    try {
      setLoading(true);
      
      // Get organization ID from localStorage
      const selectedOrgId = localStorage.getItem('selectedOrgId');
      if (!selectedOrgId) {
        toast.error("No organization selected. Please select an organization first.");
        return;
      }

      // Parse recipient principal
      const recipientPrincipal = Principal.fromText(formData.recipientAddress);
      const amount = parseInt(formData.reputationAmount);
      
      console.log('🔄 Revoking reputation:', {
        orgId: selectedOrgId,
        recipient: recipientPrincipal.toString(),
        amount,
        reason: formData.reason
      });

      // Call backend revokeRep function
      const result = await revokeRep(selectedOrgId, recipientPrincipal, amount, formData.reason);
      
      // Check if result indicates an error
      if (typeof result === 'string') {
        console.error('❌ Backend returned error:', result);
        toast.error(`Failed to revoke reputation: ${result}`);
        return;
      }
      
      console.log('✅ Reputation revoked successfully:', result);
      toast.success(`Successfully revoked ${amount} REP points from ${formData.recipientAddress}`);
      
      // Reset form
      setFormData({
        recipientAddress: '',
        reputationAmount: '',
        category: '',
        reason: ''
      });
      setShowConfirmation(false);
      
      // Reload recent revocations to show the new one
      const principalObj = Principal.fromText(principal);
      const transactions = await getTransactionsByUser(principalObj);
      const revocations = transactions
        .filter(tx => {
          const transactionType = parseTransactionType(tx.transactionType);
          return transactionType === 'revoke';
        })
        .slice(0, 5)
        .map((tx, index) => ({
          id: `rev-${index}`,
          recipientName: `User ${tx.to.toString().slice(0, 8)}`,
          recipientAddress: tx.to.toString(),
          amount: Number(tx.amount),
          category: "General",
          reason: tx.reason.length > 0 ? tx.reason[0] : "No reason provided",
          timestamp: convertTimestampToDate(tx.timestamp),
          revokedBy: tx.from.toString()
        }));
      setRecentRevocations(revocations);
      
    } catch (error) {
      console.error("❌ Error revoking reputation:", error);
      if (error instanceof Error) {
        if (error.message.includes("Invalid principal")) {
          toast.error("Invalid recipient address. Please check the principal format.");
        } else if (error.message.includes("Organization does not exist")) {
          toast.error("Organization not found. Please check your organization selection.");
        } else if (error.message.includes("User not authorized")) {
          toast.error("You don't have permission to revoke reputation in this organization.");
        } else {
          toast.error(`Failed to revoke reputation: ${error.message}`);
        }
      } else {
        toast.error("Failed to revoke reputation. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => {
    navigate('/auth');
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center">
        <Card className="glass-card p-8 max-w-md mx-auto text-center">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            You don't have permission to revoke reputation points. Only admins can revoke reputation.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background/95 to-muted/20">
        <DashboardSidebar 
          userRole={userRole.toLowerCase() as 'admin' | 'awarder' | 'member'}
          userName={`User ${principal?.slice(0, 8) || 'Unknown'}`}
          userPrincipal={principal || ''}
          onDisconnect={handleDisconnect}
        />
        
        <div className="flex-1">
          {/* Header */}
          <header className="h-16 border-b border-border/40 flex items-center px-6 glass-header">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center">
                <UserMinus className="w-4 h-4 text-red-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Revoke Reputation</h1>
                <p className="text-xs text-muted-foreground">Remove reputation points for violations</p>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="p-6">
            <div className="max-w-7xl mx-auto">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Revoke Form */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="glass-card p-6 animate-fade-in">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center">
                        <UserMinus className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">Revoke Reputation Points</h2>
                        <p className="text-sm text-muted-foreground">Remove reputation for policy violations</p>
                      </div>
                    </div>

                    <Alert className="mb-6 border-orange-500/20 bg-orange-500/5">
                      <AlertTriangle className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800 dark:text-orange-200">
                        <strong>Warning:</strong> Revoking reputation points is a serious action that cannot be easily undone. 
                        Please ensure you have valid reasons and proper authorization.
                      </AlertDescription>
                    </Alert>

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
                              placeholder="Enter Principal ID (e.g. rdmx6-jaaaa-aaaah-qcaiq-cai)"
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
                            <UserMinus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="reputationAmount"
                              type="number"
                              placeholder="Enter amount to revoke"
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
                        <Label className="text-sm font-medium text-foreground">Revocation Category *</Label>
                        <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                          <SelectTrigger className="glass-input">
                            <SelectValue placeholder="Select revocation category" />
                          </SelectTrigger>
                          <SelectContent>
                            {revocationCategories.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="reason" className="text-sm font-medium text-foreground">
                          Reason for Revocation *
                        </Label>
                        <Textarea
                          id="reason"
                          placeholder="Provide detailed explanation for the revocation..."
                          value={formData.reason}
                          onChange={(e) => handleInputChange('reason', e.target.value)}
                          className="glass-input min-h-[120px] resize-none"
                          required
                        />
                      </div>

                      <div className="flex items-center gap-2 p-4 bg-red-500/5 border border-red-500/10 rounded-lg">
                        <Shield className="w-5 h-5 text-red-600 flex-shrink-0" />
                        <p className="text-sm text-muted-foreground">
                          All revocations are logged and require administrative approval.
                        </p>
                      </div>

                      {showConfirmation && (
                        <Alert className="border-red-500/20 bg-red-500/5">
                          <AlertTriangle className="h-4 w-4 text-red-600" />
                          <AlertDescription className="text-red-800 dark:text-red-200">
                            Are you sure you want to revoke <strong>{formData.reputationAmount} REP</strong> from this address? 
                            This action will be permanently recorded.
                          </AlertDescription>
                        </Alert>
                      )}

                      <div className="flex gap-3">
                        {showConfirmation ? (
                          <>
                            <Button 
                              type="submit" 
                              variant="destructive" 
                              size="lg" 
                              className="flex-1 group"
                              disabled={loading}
                            >
                              {loading ? (
                                <>
                                  <div className="w-4 h-4 border-2 border-white border-r-transparent rounded-full animate-spin mr-2" />
                                  Revoking...
                                </>
                              ) : (
                                <>
                                  <UserMinus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                                  Confirm Revocation
                                </>
                              )}
                            </Button>
                            <Button 
                              type="button" 
                              variant="outline" 
                              size="lg" 
                              onClick={() => setShowConfirmation(false)}
                              disabled={loading}
                            >
                              Cancel
                            </Button>
                          </>
                        ) : (
                          <Button 
                            type="submit" 
                            variant="destructive" 
                            size="lg" 
                            className="w-full group"
                            disabled={loading}
                          >
                            <UserMinus className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                            Revoke Reputation
                          </Button>
                        )}
                      </div>
                    </form>
                  </Card>
                </div>

                {/* Sidebar Stats & Recent Revocations */}
                <div className="space-y-6">
                  {/* Revocation Summary */}
                  <Card className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center">
                        <TrendingDown className="w-4 h-4 text-red-600" />
                      </div>
                      <h3 className="font-semibold text-foreground">Revocation Summary</h3>
                    </div>
                    
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 glass-card rounded-lg">
                        <span className="text-sm text-muted-foreground">Total Revocations</span>
                        <Badge variant="destructive" className="font-mono">
                          {stats.totalRevocations}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 glass-card rounded-lg">
                        <span className="text-sm text-muted-foreground">Total REP Revoked</span>
                        <Badge variant="destructive" className="font-mono">
                          {stats.totalREPRevoked} REP
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 glass-card rounded-lg">
                        <span className="text-sm text-muted-foreground">This Month</span>
                        <Badge variant="secondary" className="font-mono">
                          {stats.monthlyRevocations}
                        </Badge>
                      </div>
                    </div>

                    <div className="mt-4 p-3 bg-orange-500/5 border border-orange-500/10 rounded-lg">
                      <div className="flex items-center gap-2 mb-1">
                        <Info className="w-4 h-4 text-orange-600" />
                        <span className="text-sm font-medium text-orange-800 dark:text-orange-200">Notice</span>
                      </div>
                      <p className="text-xs text-orange-700 dark:text-orange-300">
                        All revocations are logged and require administrative approval.
                      </p>
                    </div>
                  </Card>

                  {/* Recent Revocations */}
                  <Card className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground">Recent Revocations</h3>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/transaction-log')}>
                        View all
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {recentRevocations.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No revocations yet</p>
                        </div>
                      ) : (
                        recentRevocations.map((revocation) => (
                          <div key={revocation.id} className="p-3 glass-card rounded-lg hover:shadow-md transition-all duration-200 border-l-2 border-red-500/30">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-foreground text-sm">
                                {revocation.recipientName}
                              </span>
                              <Badge variant="destructive" className="text-xs">
                                -{revocation.amount} REP
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {revocation.reason}
                            </p>
                            <div className="flex items-center justify-between">
                              <Badge variant="outline" className="text-xs border-red-500/20 text-red-600">
                                {revocation.category}
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                {revocation.timestamp.toLocaleDateString()}
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
    </SidebarProvider>
  );
};

export default RevokeRep;