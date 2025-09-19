import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Principal } from "@dfinity/principal";
import { useRole } from "@/contexts/RoleContext";
import { usePlugConnection } from "@/hooks/usePlugConnection";
import { getTransactionsByUser } from "@/services/childCanisterService";
import type { Transaction as BackendTransaction } from "@/declarations/reputation_dao/reputation_dao.did.d.ts";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { parseTransactionType, parseTransactionTypeAlternative, getTransactionTypeIcon, getTransactionTypeBgClass, convertTimestampToDate, getTransactionTypeDescription, formatTransactionAmount, extractReason } from "@/utils/transactionUtils";
import {
  FileText,
  Search,
  Filter,
  Calendar,
  Award,
  UserMinus,
  User,
  Clock,
  Download,
  Eye,
  ExternalLink,
  TrendingUp,
  TrendingDown,
  Activity
} from "lucide-react";

interface Transaction {
  id: string;
  type: 'award' | 'revoke' | 'decay';
  amount: number;
  fromUser: string;
  fromPrincipal: string;
  toUser: string;
  toPrincipal: string;
  reason: string;
  category: string;
  timestamp: Date;
  blockHeight?: number;
  transactionHash?: string;
  status: 'completed' | 'pending' | 'failed';
}

const TransactionLog = () => {
  const navigate = useNavigate();
  const { userRole, isAdmin, isAwarder } = useRole();
  const { isConnected, principal } = usePlugConnection({ autoCheck: true });
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<'all' | 'award' | 'revoke' | 'decay'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [dateFilter, setDateFilter] = useState<'all' | 'today' | 'week' | 'month'>('all');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);


  // Load transactions from backend
  useEffect(() => {
    const loadTransactions = async () => {
      if (!isConnected || !principal) return;
      
      try {
        setLoading(true);
        console.log('📋 Loading transactions...');
        
        const principalObj = Principal.fromText(principal);
        
        // Get transactions for current user
        const userTransactions = await getTransactionsByUser(principalObj);
        console.log('📦 Received user transactions:', userTransactions);
        
        // Debug: Log transaction type summary
        const typeSummary = userTransactions.reduce((acc, tx) => {
          const type = parseTransactionType(tx.transactionType);
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        console.log('📊 Transaction type summary:', typeSummary);
        
        // Debug: Log ALL transaction types in detail
        console.log('🔍 DETAILED TRANSACTION TYPE ANALYSIS:');
        userTransactions.forEach((tx, index) => {
          console.log(`Transaction ${index}:`, {
            id: tx.id,
            transactionType: tx.transactionType,
            transactionTypeType: typeof tx.transactionType,
            transactionTypeKeys: tx.transactionType ? Object.keys(tx.transactionType) : 'no keys',
            transactionTypeString: JSON.stringify(tx.transactionType),
            parsedType: parseTransactionType(tx.transactionType),
            amount: tx.amount,
            from: tx.from.toString(),
            to: tx.to.toString(),
            reason: tx.reason
          });
        });
        
        // Debug: Log the first few transactions in detail
        userTransactions.slice(0, 3).forEach((tx, index) => {
          console.log(`🔍 DEBUG Transaction ${index}:`, {
            transactionType: tx.transactionType,
            transactionTypeType: typeof tx.transactionType,
            transactionTypeKeys: tx.transactionType ? Object.keys(tx.transactionType) : 'no keys',
            transactionTypeString: JSON.stringify(tx.transactionType),
            amount: tx.amount,
            from: tx.from.toString(),
            to: tx.to.toString(),
            reason: tx.reason
          });
        });
        

        // Convert backend transactions to UI format
        const uiTransactions: Transaction[] = userTransactions.map((tx, index) => {
          // Parse transaction type using enhanced parsing
          let transactionType = parseTransactionType(tx.transactionType);
          
          // If primary parsing fails, try alternative method
          if (transactionType === 'award' && tx.transactionType) {
            const altType = parseTransactionTypeAlternative(tx.transactionType);
            if (altType !== 'award') {
              console.log(`🔄 Transaction ${index}: Using alternative parsing, result: ${altType}`);
              transactionType = altType;
            }
          }
          
          console.log(`🔍 Transaction ${index}: Final type = ${transactionType}`, {
            original: tx.transactionType,
            parsed: transactionType,
            keys: tx.transactionType ? Object.keys(tx.transactionType) : 'no keys',
            reason: tx.reason,
            reasonType: typeof tx.reason,
            reasonLength: tx.reason.length
          });
          
          return {
            id: `tx-${index}`,
            type: transactionType,
            amount: Number(tx.amount),
            fromUser: `User ${tx.from.toString().slice(0, 8)}`,
            fromPrincipal: tx.from.toString(),
            toUser: `User ${tx.to.toString().slice(0, 8)}`,
            toPrincipal: tx.to.toString(),
            reason: tx.reason || "No reason provided",
            category: "General", // Default category since backend doesn't have this
            timestamp: convertTimestampToDate(tx.timestamp),
            blockHeight: Math.floor(Math.random() * 1000000), // Placeholder
            transactionHash: `0x${index.toString(16).padStart(16, '0')}...`, // Placeholder
            status: 'completed' as const
          };
        });
        
        setTransactions(uiTransactions);
        console.log('✅ Transactions loaded successfully');
        
      } catch (error) {
        console.error('Error loading transactions:', error);
        toast.error('Failed to load transaction history');
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [isConnected, principal]);

  // Transaction stats derived from loaded data
  const stats = {
    totalTransactions: transactions.length,
    totalRepAwarded: transactions
      .filter(tx => tx.type === 'award')
      .reduce((sum, tx) => sum + tx.amount, 0),
    totalRepRevoked: transactions
      .filter(tx => tx.type === 'revoke')
      .reduce((sum, tx) => sum + tx.amount, 0),
    pendingTransactions: transactions.filter(tx => tx.status === 'pending').length
  };

  const handleDisconnect = () => {
    navigate('/auth');
  };

  const filterTransactions = () => {
    let filtered = transactions;

    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(tx => 
        tx.toUser.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.fromUser.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.reason.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.toPrincipal.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tx.fromPrincipal.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType);
    }

    // Filter by stats
    if (filterStatus !== 'all') {
      filtered = filtered.filter(tx => tx.status === filterStatus);
    }

    // Filter by date
    if (dateFilter !== 'all') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      filtered = filtered.filter(tx => {
        switch (dateFilter) {
          case 'today':
            return tx.timestamp >= today;
          case 'week':
            return tx.timestamp >= weekAgo;
          case 'month':
            return tx.timestamp >= monthAgo;
          default:
            return true;
        }
      });
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'award':
        return <Award className="w-4 h-4 text-green-600" />;
      case 'revoke':
        return <UserMinus className="w-4 h-4 text-red-600" />;
      case 'decay':
        return <Clock className="w-4 h-4 text-orange-600" />;
      default:
        return <Activity className="w-4 h-4 text-blue-600" />;
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'award':
        return 'text-green-600 bg-green-500/10';
      case 'revoke':
        return 'text-red-600 bg-red-500/10';
      case 'decay':
        return 'text-orange-600 bg-orange-500/10';
      default:
        return 'text-blue-600 bg-blue-500/10';
    }
  };

  const filteredTransactions = filterTransactions();

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
          <header className="h-16 border-b border-border/40 flex items-center justify-between px-6 glass-header">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="mr-4" />
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Transaction Log</h1>
                <p className="text-xs text-muted-foreground">View all reputation transactions and activity</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" className="group">
                <Download className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                Export CSV
              </Button>
              <ThemeToggle />
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
                      <p className="text-sm text-muted-foreground">Total Transactions</p>
                      <p className="text-2xl font-bold text-foreground">{stats.totalTransactions}</p>
                    </div>
                    <Activity className="w-8 h-8 text-primary" />
                  </div>
                </Card>
                
                <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">REP Awarded</p>
                      <p className="text-2xl font-bold text-foreground">{stats.totalRepAwarded}</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </Card>
                
                <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">REP Revoked</p>
                      <p className="text-2xl font-bold text-foreground">{stats.totalRepRevoked}</p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-red-500" />
                  </div>
                </Card>
                
                <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Today's Activity</p>
                      <p className="text-2xl font-bold text-foreground">{stats.pendingTransactions}</p>
                    </div>
                    <Clock className="w-8 h-8 text-orange-500" />
                  </div>
                </Card>
              </div>

              {/* Filters */}
              <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search transactions..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10 glass-input"
                    />
                  </div>
                  
                  <div className="flex gap-2">
                    <Select value={filterType} onValueChange={(value: any) => setFilterType(value)}>
                      <SelectTrigger className="w-32 glass-input">
                        <SelectValue placeholder="Type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="award">Awards</SelectItem>
                        <SelectItem value="revoke">Revocations</SelectItem>
                        <SelectItem value="decay">Decay</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={filterStatus} onValueChange={(value: any) => setFilterStatus(value)}>
                      <SelectTrigger className="w-32 glass-input">
                        <SelectValue placeholder="Status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="failed">Failed</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <Select value={dateFilter} onValueChange={(value: any) => setDateFilter(value)}>
                      <SelectTrigger className="w-32 glass-input">
                        <SelectValue placeholder="Date" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="today">Today</SelectItem>
                        <SelectItem value="week">This Week</SelectItem>
                        <SelectItem value="month">This Month</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </Card>

              {/* Transactions List */}
              <Card className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-lg font-semibold text-foreground">Transaction History</h2>
                  <Badge variant="secondary" className="font-mono">
                    {filteredTransactions.length} transactions
                  </Badge>
                </div>
                
                <div className="space-y-3">
                  {filteredTransactions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                      <p className="text-lg font-medium mb-2">No transactions found</p>
                      <p className="text-sm">Try adjusting your search or filter criteria</p>
                    </div>
                  ) : (
                    filteredTransactions.map((transaction, index) => (
                      <div 
                        key={transaction.id}
                        className="flex items-center justify-between p-4 glass-card rounded-lg hover:shadow-md transition-all duration-200 animate-fade-in"
                        style={{ animationDelay: `${0.6 + index * 0.05}s` }}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getTransactionTypeBgClass(transaction.type)}`}>
                            {getTransactionIcon(transaction.type)}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className="font-medium text-foreground text-lg">
                                {formatTransactionAmount(transaction.type, transaction.amount)} REP
                              </span>
                              <Badge variant="outline" className="text-xs capitalize">
                                {getTransactionTypeDescription(transaction.type)}
                              </Badge>
                              <Badge 
                                variant={transaction.status === 'completed' ? 'default' : 
                                        transaction.status === 'pending' ? 'secondary' : 'destructive'}
                                className="text-xs"
                              >
                                {transaction.status}
                              </Badge>
                            </div>
                            
                            <div className="mb-2">
                              <p className="text-sm text-muted-foreground mb-1">
                                <span className="font-medium">{transaction.fromUser}</span>
                                {' → '}
                                <span className="font-medium">{transaction.toUser}</span>
                              </p>
                              
                              <div className="bg-muted/30 rounded-lg p-3 mb-2">
                                <p className="text-sm font-medium text-foreground mb-1">Reason:</p>
                                <p className="text-sm text-muted-foreground break-words">
                                  {transaction.reason}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {transaction.timestamp.toLocaleString()}
                              </div>
                              {transaction.category && (
                                <Badge variant="outline" className="text-xs">
                                  {transaction.category}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2">
                          {transaction.blockHeight && (
                            <Button variant="ghost" size="sm" className="text-xs">
                              <Eye className="w-3 h-3 mr-1" />
                              Block {transaction.blockHeight}
                            </Button>
                          )}
                          {transaction.transactionHash && (
                            <Button variant="ghost" size="sm" className="text-xs">
                              <ExternalLink className="w-3 h-3 mr-1" />
                              View Hash
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </Card>
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default TransactionLog;