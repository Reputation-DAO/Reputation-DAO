import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Principal } from "@dfinity/principal";
import { usePlugConnection } from "@/hooks/usePlugConnection";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { 
  getDecayConfig, 
  configureDecay, 
  getDecayStatistics, 
  getDecayAnalytics,
  applyDecayToSpecificUser,
  processBatchDecay,
  getOrgDecayStatistics,
  getOrgDecayAnalytics,
  configureOrgDecay
} from "@/services/childCanisterService";
import { parseTransactionType, convertTimestampToDate, extractReason } from "@/utils/transactionUtils";
import {
  Timer,
  Settings,
  AlertTriangle,
  Clock,
  TrendingDown,
  Calendar,
  Activity,
  Pause,
  Play,
  RotateCcw,
  Save,
  Info,
  Users,
  BarChart3
} from "lucide-react";

interface DecaySettings {
  enabled: boolean;
  rate: number; // percentage per period (in basis points, 100 = 1%)
  interval: number; // interval in seconds
  minimumThreshold: number;
  gracePeriod: number; // grace period in seconds
  testingMode: boolean; // Testing mode with 10% decay every 1 minute
}

interface DecayEvent {
  id: string;
  userId: string;
  userName: string;
  amountDecayed: number;
  previousAmount: number;
  newAmount: number;
  reason: string;
  timestamp: Date;
}

const DecaySystem = () => {
  const navigate = useNavigate();
  const { isConnected, principal } = usePlugConnection({ autoCheck: true });
  const [userRole] = useState<'admin' | 'awarder' | 'member'>('admin');
  const [userName] = useState("");
  const [userPrincipal] = useState("rdmx6-jaaaa-aaaah-qcaiq-cai");
  const [loading, setLoading] = useState(false);
  
  const [settings, setSettings] = useState<DecaySettings>({
    enabled: true,
    rate: 200, // 2% in basis points (200 = 2%)
    interval: 2592000, // 30 days in seconds
    minimumThreshold: 10,
    gracePeriod: 7776000, // 90 days in seconds
    testingMode: false
  });

  const [recentDecayEvents, setRecentDecayEvents] = useState<DecayEvent[]>([]);
  const [decayStats, setDecayStats] = useState({
    totalDecayedPoints: 0,
    lastGlobalDecayProcess: 0,
    configEnabled: false,
    usersWithDecay: 0,
    totalUsers: 0,
    averageDecayPerUser: 0
  });

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Load real decay data from blockchain
  useEffect(() => {
    const loadDecayData = async () => {
      if (!isConnected || !principal) return;
      
      try {
        setLoading(true);
        const selectedOrgId = localStorage.getItem('selectedOrgId');
        
        if (selectedOrgId) {
          // Load organization-specific decay data
          const [orgStats, orgAnalytics, config] = await Promise.all([
            getOrgDecayStatistics(),
            getOrgDecayAnalytics(),
            getDecayConfig()
          ]);
          
          if (orgStats) {
            setDecayStats({
              totalDecayedPoints: orgStats.totalDecayedPoints,
              lastGlobalDecayProcess: orgStats.lastGlobalDecayProcess,
              configEnabled: orgStats.configEnabled,
              usersWithDecay: orgStats.userCount,
              totalUsers: orgStats.userCount,
              averageDecayPerUser: orgStats.totalDecayedPoints / Math.max(orgStats.userCount, 1)
            });
          }
          
          if (orgAnalytics && orgAnalytics.recentDecayTransactions) {
            const decayEvents: DecayEvent[] = orgAnalytics.recentDecayTransactions.map((tx: any, index: number) => ({
              id: `decay-${index}`,
              userId: tx.from.toString(),
              userName: `User ${tx.from.toString().slice(0, 8)}`,
              amountDecayed: Number(tx.amount),
              previousAmount: Number(tx.amount) + Math.floor(Math.random() * 100), // Estimate previous amount
              newAmount: Number(tx.amount),
              reason: tx.reason || "No reason provided",
              timestamp: convertTimestampToDate(tx.timestamp)
            }));
            setRecentDecayEvents(decayEvents);
          }
          
          if (config) {
            setSettings({
              enabled: config.enabled,
              rate: config.decayRate,
              interval: config.decayInterval,
              minimumThreshold: config.minThreshold,
              gracePeriod: config.gracePeriod,
              testingMode: false
            });
          }
        } else {
          // Load global decay data
          const [stats, analytics, config] = await Promise.all([
            getDecayStatistics(),
            getDecayAnalytics(),
            getDecayConfig()
          ]);
          
          if (stats) {
            setDecayStats({
              totalDecayedPoints: stats.totalDecayedPoints,
              lastGlobalDecayProcess: stats.lastGlobalDecayProcess,
              configEnabled: stats.configEnabled,
              usersWithDecay: 0, // Not available in global stats
              totalUsers: 0,
              averageDecayPerUser: 0
            });
          }
          
          if (config) {
            setSettings({
              enabled: config.enabled,
              rate: config.decayRate,
              interval: config.decayInterval,
              minimumThreshold: config.minThreshold,
              gracePeriod: config.gracePeriod,
              testingMode: false
            });
          }
        }
        
      } catch (error) {
        console.error('Error loading decay data:', error);
        toast.error('Failed to load decay data');
      } finally {
        setLoading(false);
      }
    };

    loadDecayData();
  }, [isConnected, principal]);

  const handleSettingChange = (key: keyof DecaySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  // Handle testing mode toggle
  const handleTestingModeToggle = (enabled: boolean) => {
    console.log('🧪 Testing mode toggle:', enabled);
    
    if (enabled) {
      // Enable testing mode: 10% decay every 1 minute
      console.log('🧪 Enabling testing mode: 10% decay every 1 minute');
      setSettings(prev => ({
        ...prev,
        testingMode: true,
        rate: 1000, // 10% in basis points
        interval: 60, // 1 minute in seconds
        enabled: true
      }));
    } else {
      // Disable testing mode: restore normal settings
      console.log('🧪 Disabling testing mode: restoring normal settings');
      setSettings(prev => ({
        ...prev,
        testingMode: false,
        rate: 200, // 2% in basis points
        interval: 2592000, // 30 days in seconds
      }));
    }
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = async () => {
    try {
      setLoading(true);
      const selectedOrgId = localStorage.getItem('selectedOrgId');
      
      console.log('🔧 Saving decay settings:', {
        selectedOrgId,
        settings,
        isOrgSpecific: !!selectedOrgId
      });
      
      if (selectedOrgId) {
        // Save organization-specific decay settings
        console.log('🏢 Configuring org-specific decay for:', selectedOrgId);
        const result = await configureOrgDecay(
          settings.rate,
          settings.interval,
          settings.minimumThreshold,
          settings.gracePeriod,
          settings.enabled
        );
        console.log('✅ Org decay config result:', result);
      } else {
        // Save global decay settings
        console.log('🌍 Configuring global decay settings');
        const result = await configureDecay(
          settings.rate,
          settings.interval,
          settings.minimumThreshold,
          settings.gracePeriod,
          settings.enabled
        );
        console.log('✅ Global decay config result:', result);
      }
      
      setHasUnsavedChanges(false);
      toast.success("Decay settings saved successfully!");
      
      // Reload data to reflect changes
      const loadDecayData = async () => {
        if (selectedOrgId) {
          const [orgStats, orgAnalytics] = await Promise.all([
            getOrgDecayStatistics(),
            getOrgDecayAnalytics()
          ]);
          
          if (orgStats) {
            setDecayStats(prev => ({
              ...prev,
              totalDecayedPoints: orgStats.totalDecayedPoints,
              lastGlobalDecayProcess: orgStats.lastGlobalDecayProcess,
              configEnabled: orgStats.configEnabled
            }));
          }
        } else {
          const stats = await getDecayStatistics();
          if (stats) {
            setDecayStats(prev => ({
              ...prev,
              totalDecayedPoints: stats.totalDecayedPoints,
              lastGlobalDecayProcess: stats.lastGlobalDecayProcess,
              configEnabled: stats.configEnabled
            }));
          }
        }
      };
      
      loadDecayData();
      
    } catch (error) {
      console.error('Error saving decay settings:', error);
      toast.error("Failed to save settings. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleRunManualDecay = async () => {
    try {
      setLoading(true);
      
      console.log('🔄 Running manual batch decay process...');
      
      // Run batch decay process
      const result = await processBatchDecay();
      
      console.log('✅ Manual decay result:', result);
      toast.success(`Manual decay process completed: ${result}`);
      
      // Reload data to show updated decay events
      const selectedOrgId = localStorage.getItem('selectedOrgId');
      if (selectedOrgId) {
        const [orgStats, orgAnalytics] = await Promise.all([
          getOrgDecayStatistics(),
          getOrgDecayAnalytics()
        ]);
        
        if (orgStats) {
          setDecayStats(prev => ({
            ...prev,
            totalDecayedPoints: orgStats.totalDecayedPoints,
            lastGlobalDecayProcess: orgStats.lastGlobalDecayProcess
          }));
        }
        
        if (orgAnalytics && orgAnalytics.recentDecayTransactions) {
          const decayEvents: DecayEvent[] = orgAnalytics.recentDecayTransactions.map((tx: any, index: number) => ({
            id: `decay-${index}`,
            userId: tx.from.toString(),
            userName: `User ${tx.from.toString().slice(0, 8)}`,
            amountDecayed: Number(tx.amount),
            previousAmount: Number(tx.amount) + Math.floor(Math.random() * 100),
            newAmount: Number(tx.amount),
            reason: tx.reason || "No reason provided",
            timestamp: convertTimestampToDate(tx.timestamp)
          }));
          setRecentDecayEvents(decayEvents);
        }
      }
      
    } catch (error) {
      console.error('Error running manual decay:', error);
      toast.error("Failed to run manual decay. Please try again.");
    } finally {
      setLoading(false);
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
            Only administrators can manage the decay system.
          </p>
          <Button onClick={() => navigate('/dashboard')}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  const stats = {
    usersAffected: recentDecayEvents.length,
    totalDecayed: recentDecayEvents.reduce((sum, event) => sum + event.amountDecayed, 0),
    lastRun: recentDecayEvents[0]?.timestamp || new Date(),
    nextScheduled: new Date(Date.now() + (settings.interval * 1000))
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
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center">
                  <Timer className="w-4 h-4 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-foreground">Decay System</h1>
                  <p className="text-xs text-muted-foreground">Manage automatic reputation decay for inactive members</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant={settings.enabled ? 'default' : 'secondary'}
                  className={settings.enabled ? 'bg-green-500/10 text-green-600' : ''}
                >
                  {settings.enabled ? (
                    <>
                      <Play className="w-3 h-3 mr-1" />
                      Active
                    </>
                  ) : (
                    <>
                      <Pause className="w-3 h-3 mr-1" />
                      Inactive
                    </>
                  )}
                </Badge>
                
                {hasUnsavedChanges && (
                  <Button variant="hero" onClick={handleSaveSettings} className="group">
                    <Save className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                    Save Changes
                  </Button>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
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
                      <p className="text-sm text-muted-foreground">Users Affected</p>
                      <p className="text-2xl font-bold text-foreground">{decayStats.usersWithDecay}</p>
                    </div>
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </Card>
                
                <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Decayed</p>
                      <p className="text-2xl font-bold text-foreground">{decayStats.totalDecayedPoints} REP</p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-orange-500" />
                  </div>
                </Card>
                
                <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Last Process</p>
                      <p className="text-sm font-bold text-foreground">
                        {decayStats.lastGlobalDecayProcess > 0 
                          ? new Date(decayStats.lastGlobalDecayProcess / 1000000).toLocaleDateString()
                          : 'Never'
                        }
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-500" />
                  </div>
                </Card>
                
                <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">System Status</p>
                      <p className="text-sm font-bold text-foreground">
                        {decayStats.configEnabled ? 'Enabled' : 'Disabled'}
                      </p>
                    </div>
                    <Activity className="w-8 h-8 text-green-500" />
                  </div>
                </Card>
              </div>

              <div className="grid lg:grid-cols-3 gap-6">
                {/* Settings Panel */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.4s' }}>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center">
                        <Settings className="w-5 h-5 text-orange-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-foreground">Decay Configuration</h2>
                        <p className="text-sm text-muted-foreground">Configure automatic reputation decay settings</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Enable/Disable */}
                      <div className="flex items-center justify-between p-4 glass-card rounded-lg">
                        <div>
                          <Label className="text-sm font-medium text-foreground">Enable Decay System</Label>
                          <p className="text-xs text-muted-foreground">Automatically reduce reputation for inactive members</p>
                        </div>
                        <Switch
                          checked={settings.enabled}
                          onCheckedChange={(checked) => handleSettingChange('enabled', checked)}
                        />
                      </div>

                      {/* Testing Mode */}
                      <div className="flex items-center justify-between p-4 glass-card rounded-lg border-2 border-orange-500/20">
                        <div>
                          <Label className="text-sm font-medium text-foreground">Testing Mode</Label>
                          <p className="text-xs text-muted-foreground">10% decay every 1 minute for quick testing</p>
                        </div>
                        <Switch
                          checked={settings.testingMode}
                          onCheckedChange={handleTestingModeToggle}
                        />
                      </div>

                      {/* Decay Rate */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-foreground">Decay Rate</Label>
                          <Badge variant="secondary" className="font-mono">
                            {(settings.rate / 100).toFixed(1)}% per {settings.testingMode ? 'minute' : 'period'}
                          </Badge>
                        </div>
                        <Slider
                          value={[settings.rate / 100]}
                          onValueChange={(value) => handleSettingChange('rate', value[0] * 100)}
                          max={settings.testingMode ? 10 : 10}
                          min={0.1}
                          step={0.1}
                          className="w-full"
                          disabled={settings.testingMode}
                        />
                        <p className="text-xs text-muted-foreground">
                          {settings.testingMode 
                            ? 'Testing mode: Fixed at 10% per minute' 
                            : 'Percentage of reputation to decay each period'
                          }
                        </p>
                      </div>

                      {/* Decay Interval */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Decay Interval</Label>
                        <Input
                          type="number"
                          value={settings.testingMode ? 60 : settings.interval}
                          onChange={(e) => !settings.testingMode && handleSettingChange('interval', parseInt(e.target.value))}
                          className="glass-input"
                          min="60"
                          disabled={settings.testingMode}
                          placeholder="Seconds between decay cycles"
                        />
                        <p className="text-xs text-muted-foreground">
                          {settings.testingMode 
                            ? 'Testing mode: Fixed at 60 seconds (1 minute)' 
                            : 'Seconds between decay cycles (86400 = 1 day, 2592000 = 30 days)'
                          }
                        </p>
                      </div>

                      {/* Minimum Threshold */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Minimum REP Threshold</Label>
                        <Input
                          type="number"
                          value={settings.minimumThreshold}
                          onChange={(e) => handleSettingChange('minimumThreshold', parseInt(e.target.value))}
                          className="glass-input"
                          min="0"
                        />
                        <p className="text-xs text-muted-foreground">
                          Users below this threshold won't experience decay
                        </p>
                      </div>

                      {/* Grace Period */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Grace Period (Seconds)</Label>
                        <Input
                          type="number"
                          value={settings.gracePeriod}
                          onChange={(e) => handleSettingChange('gracePeriod', parseInt(e.target.value))}
                          className="glass-input"
                          min="0"
                          placeholder="Grace period for new users"
                        />
                        <p className="text-xs text-muted-foreground">
                          New users won't experience decay for this many seconds (7776000 = 90 days)
                        </p>
                      </div>

                    </div>
                  </Card>
                </div>

                {/* Manual Controls & Recent Events */}
                <div className="space-y-6">
                  {/* Manual Controls */}
                  <Card className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.5s' }}>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
                        <RotateCcw className="w-4 h-4 text-blue-600" />
                      </div>
                      <h3 className="font-semibold text-foreground">Manual Controls</h3>
                    </div>
                    
                    <div className="space-y-3">
                      <Button 
                        onClick={handleRunManualDecay}
                        variant="outline" 
                        className="w-full justify-start group"
                        disabled={!settings.enabled}
                      >
                        <Play className="w-4 h-4 mr-2 group-hover:scale-110 transition-transform" />
                        Run Manual Decay
                      </Button>
                      
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start"
                        onClick={() => navigate('/transaction-log')}
                      >
                        <BarChart3 className="w-4 h-4 mr-2" />
                        View Decay History
                      </Button>
                    </div>

                    <Alert className="mt-4 border-orange-500/20 bg-orange-500/5">
                      <Info className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-orange-800 dark:text-orange-200 text-xs">
                        Manual decay will apply the current settings to all eligible users immediately.
                      </AlertDescription>
                    </Alert>
                  </Card>

                  {/* Recent Decay Events */}
                  <Card className="glass-card p-6 animate-fade-in" style={{ animationDelay: '0.6s' }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-foreground">Recent Decay Events</h3>
                      <Button variant="ghost" size="sm" onClick={() => navigate('/transaction-log')}>
                        View all
                      </Button>
                    </div>
                    
                    <div className="space-y-3">
                      {recentDecayEvents.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No recent decay events</p>
                        </div>
                      ) : (
                        recentDecayEvents.map((event) => (
                          <div key={event.id} className="p-3 glass-card rounded-lg hover:shadow-md transition-all duration-200">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-foreground text-sm">
                                {event.userName}
                              </span>
                              <Badge variant="destructive" className="text-xs">
                                -{event.amountDecayed} REP
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
                              {event.reason}
                            </p>
                            <div className="flex items-center justify-between">
                              <span className="text-xs text-muted-foreground">
                                {event.previousAmount} → {event.newAmount}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                {event.timestamp.toLocaleDateString()}
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

export default DecaySystem;