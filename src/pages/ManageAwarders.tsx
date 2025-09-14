import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { toast } from "sonner";
import {
  Users,
  UserPlus,
  Crown,
  Shield,
  User,
  Settings,
  Trash2,
  Calendar,
  Activity,
  AlertTriangle,
  CheckCircle,
  MoreVertical
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { addTrustedAwarder, removeTrustedAwarder, getTrustedAwarders, getOrgUserBalances, getOrgTransactionHistory } from "@/components/canister/reputationDao";
import { Principal } from "@dfinity/principal";
import { usePlugConnection } from "@/hooks/usePlugConnection";
import { parseTransactionType, convertTimestampToDate } from "@/utils/transactionUtils";

interface Awarder {
  id: string;
  name: string;
  principal: string;
  role: 'admin' | 'awarder';
  reputation: number;
  joinDate: Date;
  lastActive: Date;
  awardsGiven: number;
  status: 'active' | 'inactive';
}

interface NewAwarderForm {
  name: string;
  principal: string;
  role: 'admin' | 'awarder';
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

const ManageAwarders = () => {
  const navigate = useNavigate();
  const { isConnected, principal } = usePlugConnection({ autoCheck: true });
  const [userRole] = useState<'admin' | 'awarder' | 'member'>('admin');
  const [userName] = useState("");
  const [userPrincipal] = useState("rdmx6-jaaaa-aaaah-qcaiq-cai");
  const [loading, setLoading] = useState(false);
  
  const [awarders, setAwarders] = useState<Awarder[]>([]);

  // Load awarders from backend
  React.useEffect(() => {
    const loadAwarders = async () => {
      if (!isConnected || !principal) return;
      
      setLoading(true);
      try {
        const selectedOrgId = localStorage.getItem('selectedOrgId');
        if (!selectedOrgId) {
          console.error('No organization selected');
          return;
        }

        const backendAwarders = await getTrustedAwarders(selectedOrgId);
        console.log('📦 Received awarders:', backendAwarders);
        
        // Get real data for awarders
        const userBalances = await getOrgUserBalances(selectedOrgId);
        const transactions = await getOrgTransactionHistory(selectedOrgId);
        
        // Create a map of user balances for quick lookup
        const balanceMap = new Map<string, number>();
        userBalances.forEach(user => {
          balanceMap.set(user.userId.toString(), user.balance);
        });
        
        // Create a map of awards given by each user
        const awardsGivenMap = new Map<string, number>();
        transactions.forEach(tx => {
          const transactionType = parseTransactionType(tx.transactionType);
          if (transactionType === 'award') {
            const fromUser = tx.from.toString();
            awardsGivenMap.set(fromUser, (awardsGivenMap.get(fromUser) || 0) + 1);
          }
        });
        
        // Create a map of last activity (most recent transaction)
        const lastActivityMap = new Map<string, Date>();
        transactions.forEach(tx => {
          const fromUser = tx.from.toString();
          const txDate = convertTimestampToDate(tx.timestamp);
          const existingDate = lastActivityMap.get(fromUser);
          if (!existingDate || txDate > existingDate) {
            lastActivityMap.set(fromUser, txDate);
          }
        });
        
        // Transform backend data to UI format with real data
        const uiAwarders: Awarder[] = Array.isArray(backendAwarders) 
          ? backendAwarders.map((awarder, index) => {
              const principalStr = awarder.toString();
              const reputation = balanceMap.get(principalStr) || 0;
              const awardsGiven = awardsGivenMap.get(principalStr) || 0;
              const lastActive = lastActivityMap.get(principalStr) || new Date();
              
              return {
                id: index.toString(),
                name: `User ${principalStr.slice(0, 8)}`,
                principal: principalStr,
                role: 'awarder' as const,
                reputation: reputation,
                joinDate: new Date(Date.now() - Math.random() * 31536000000), // Still placeholder as we don't have join date in backend
                lastActive: lastActive,
                awardsGiven: awardsGiven,
                status: 'active' as const
              };
            })
          : [];
        
        setAwarders(uiAwarders);
        console.log('✅ Awarders loaded successfully');
        
      } catch (error) {
        console.error('Error loading awarders:', error);
        toast.error('Failed to load awarders');
      } finally {
        setLoading(false);
      }
    };

    loadAwarders();
  }, [isConnected, principal]);

  const [newAwarder, setNewAwarder] = useState<NewAwarderForm>({
    name: '',
    principal: '',
    role: 'awarder'
  });

  const [isAddingAwarder, setIsAddingAwarder] = useState(false);

  const handleAddAwarder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newAwarder.name || !newAwarder.principal) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setIsAddingAwarder(true);
      
      const selectedOrgId = localStorage.getItem('selectedOrgId');
      if (!selectedOrgId) {
        toast.error('No organization selected');
        return;
      }

      // Add awarder via backend
      const principalObj = Principal.fromText(newAwarder.principal);
      const result = await addTrustedAwarder(selectedOrgId, principalObj, newAwarder.name);
      console.log('✅ Awarder added successfully:', result);
      
      const newAwarderData: Awarder = {
        id: Date.now().toString(),
        name: newAwarder.name,
        principal: newAwarder.principal,
        role: newAwarder.role,
        reputation: 0,
        joinDate: new Date(),
        lastActive: new Date(),
        awardsGiven: 0,
        status: 'active'
      };

      setAwarders(prev => [...prev, newAwarderData]);
      setNewAwarder({ name: '', principal: '', role: 'awarder' });
      setIsAddingAwarder(false);
      
      toast.success(`Successfully added ${newAwarder.name} as ${newAwarder.role}`);
    } catch (error) {
      toast.error("Failed to add awarder. Please try again.");
    }
  };

  const handleRemoveAwarder = async (id: string, name: string) => {
    try {
      const selectedOrgId = localStorage.getItem('selectedOrgId');
      if (!selectedOrgId) {
        toast.error('No organization selected');
        return;
      }

      // Find the awarder to get their principal
      const awarder = awarders.find(a => a.id === id);
      if (!awarder) {
        toast.error('Awarder not found');
        return;
      }

      // Remove awarder via backend
      const principalObj = Principal.fromText(awarder.principal);
      const result = await removeTrustedAwarder(selectedOrgId, principalObj);
      console.log('✅ Awarder removed successfully:', result);
      
      setAwarders(prev => prev.filter(awarder => awarder.id !== id));
      toast.success(`Removed ${name} from awarders`);
    } catch (error) {
      console.error('Error removing awarder:', error);
      toast.error("Failed to remove awarder. Please try again.");
    }
  };

  const handleRoleChange = async (id: string, newRole: 'admin' | 'awarder') => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setAwarders(prev => prev.map(awarder => 
        awarder.id === id ? { ...awarder, role: newRole } : awarder
      ));
      toast.success(`Role updated successfully`);
    } catch (error) {
      toast.error("Failed to update role. Please try again.");
    }
  };

  const handleDisconnect = () => {
    navigate('/auth');
  };

  if (userRole !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center">
        <Card className="glass-card p-8 max-w-md mx-auto text-center">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            Only administrators can manage awarders.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const stats = {
    totalAwarders: awarders.length,
    activeAwarders: awarders.filter(a => a.status === 'active').length,
    totalAwards: awarders.reduce((sum, a) => sum + a.awardsGiven, 0),
    admins: awarders.filter(a => a.role === 'admin').length
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-background via-background/95 to-muted/20">
        <DashboardSidebar 
          userRole={userRole}
          userName={userName}
          userPrincipal={userPrincipal}
          onDisconnect={handleDisconnect}
        />
        
        <div className="flex-1">
          {/* Header */}
          <header className="h-16 border-b border-border/40 flex items-center px-6 glass-header">
            <SidebarTrigger className="mr-4" />
            <div className="flex items-center justify-between w-full">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
                  <Users className="w-4 h-4 text-purple-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">Manage Awarders</h1>
                  <p className="text-xs text-muted-foreground">Add, remove, and manage organization members</p>
                </div>
              </div>
              
              <Dialog open={isAddingAwarder} onOpenChange={setIsAddingAwarder}>
                <DialogTrigger asChild>
                  <Button variant="hero" className="group">
                    <UserPlus className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Add Awarder
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md bg-background border border-border shadow-lg">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-primary" />
                      Add New Awarder
                    </DialogTitle>
                  </DialogHeader>
                  
                  <form onSubmit={handleAddAwarder} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name *</Label>
                      <Input
                        id="name"
                        placeholder="Enter full name"
                        value={newAwarder.name}
                        onChange={(e) => setNewAwarder(prev => ({ ...prev, name: e.target.value }))}
                        className="glass-input"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="principal">Principal ID *</Label>
                      <Input
                        id="principal"
                        placeholder="Enter ICP Principal ID"
                        value={newAwarder.principal}
                        onChange={(e) => setNewAwarder(prev => ({ ...prev, principal: e.target.value }))}
                        className="glass-input"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Role *</Label>
                      <Select 
                        value={newAwarder.role} 
                        onValueChange={(value: 'admin' | 'awarder') => 
                          setNewAwarder(prev => ({ ...prev, role: value }))
                        }
                      >
                        <SelectTrigger className="glass-input">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="awarder">
                            <div className="flex items-center gap-2">
                              <Shield className="w-4 h-4 text-blue-500" />
                              Awarder
                            </div>
                          </SelectItem>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <Crown className="w-4 h-4 text-yellow-500" />
                              Admin
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="flex gap-2 pt-4">
                      <Button type="submit" variant="hero" className="flex-1" disabled={loading}>
                        {loading ? (
                          <>
                            <div className="w-4 h-4 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                            Adding...
                          </>
                        ) : (
                          "Add Awarder"
                        )}
                      </Button>
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={() => setIsAddingAwarder(false)}
                        disabled={loading}
                      >
                        Cancel
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
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
                      <p className="text-sm text-muted-foreground">Total Awarders</p>
                      <p className="text-2xl font-bold text-foreground">{stats.totalAwarders}</p>
                    </div>
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </Card>
                
                <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Active Members</p>
                      <p className="text-2xl font-bold text-foreground">{stats.activeAwarders}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </Card>
                
                <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Awards</p>
                      <p className="text-2xl font-bold text-foreground">{stats.totalAwards}</p>
                    </div>
                    <Activity className="w-8 h-8 text-blue-500" />
                  </div>
                </Card>
                
                <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Administrators</p>
                      <p className="text-2xl font-bold text-foreground">{stats.admins}</p>
                    </div>
                    <Crown className="w-8 h-8 text-yellow-500" />
                  </div>
                </Card>
              </div>

              {/* Awarders List */}
              <Card className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-foreground">Organization Members</h2>
                  <Badge variant="secondary" className="font-mono">
                    {awarders.length} members
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {awarders.map((awarder, index) => (
                    <div 
                      key={awarder.id} 
                      className="flex items-center justify-between p-4 glass-card rounded-lg hover:shadow-md transition-all duration-200 animate-fade-in"
                      style={{ animationDelay: `${0.5 + index * 0.1}s` }}
                    >
                      <div className="flex items-center gap-4">
                        <Avatar className="w-12 h-12">
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary-glow/20 text-primary font-medium">
                            {awarder.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-foreground">{awarder.name}</span>
                            <Badge variant="secondary" className="flex items-center gap-1">
                              <RoleIcon role={awarder.role} />
                              {awarder.role}
                            </Badge>
                            <Badge 
                              variant={awarder.status === 'active' ? 'default' : 'secondary'}
                              className={awarder.status === 'active' ? 'bg-green-500/10 text-green-600' : ''}
                            >
                              {awarder.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground font-mono">
                            {awarder.principal.slice(0, 25)}...
                          </p>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              Joined {awarder.joinDate.toLocaleDateString()}
                            </div>
                            <div className="flex items-center gap-1">
                              <Activity className="w-3 h-3" />
                              {awarder.awardsGiven} awards given
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="font-medium text-foreground">{awarder.reputation} REP</div>
                          <div className="text-xs text-muted-foreground">
                            Active {awarder.lastActive.toLocaleDateString()}
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass-card">
                            <DropdownMenuItem 
                              onClick={() => handleRoleChange(awarder.id, awarder.role === 'admin' ? 'awarder' : 'admin')}
                              className="flex items-center gap-2"
                            >
                              <Settings className="w-4 h-4" />
                              Change to {awarder.role === 'admin' ? 'Awarder' : 'Admin'}
                            </DropdownMenuItem>
                            {awarder.id !== '1' && ( // Don't allow removing self
                              <DropdownMenuItem 
                                onClick={() => handleRemoveAwarder(awarder.id, awarder.name)}
                                className="flex items-center gap-2 text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remove Awarder
                              </DropdownMenuItem>
                            )}
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default ManageAwarders;