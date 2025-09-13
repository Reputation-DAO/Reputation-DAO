import { useState } from "react";
import { useNavigate } from "react-router-dom";
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
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
  rate: number; // percentage per period
  period: 'daily' | 'weekly' | 'monthly';
  minimumThreshold: number;
  maxDecayPerPeriod: number;
  inactivityPeriod: number; // days
  exemptAdmins: boolean;
  exemptNewMembers: boolean;
  newMemberGraceDays: number;
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
  const [userRole] = useState<'admin' | 'awarder' | 'member'>('admin');
  const [userName] = useState("");
  const [userPrincipal] = useState("rdmx6-jaaaa-aaaah-qcaiq-cai");
  
  const [settings, setSettings] = useState<DecaySettings>({
    enabled: true,
    rate: 2, // 2% per month
    period: 'monthly',
    minimumThreshold: 10,
    maxDecayPerPeriod: 50,
    inactivityPeriod: 30,
    exemptAdmins: true,
    exemptNewMembers: true,
    newMemberGraceDays: 90
  });

  const [recentDecayEvents] = useState<DecayEvent[]>([
    {
      id: '1',
      userId: '3',
      userName: 'Carol Davis',
      amountDecayed: 5,
      previousAmount: 572,
      newAmount: 567,
      reason: 'Monthly decay - inactive for 45 days',
      timestamp: new Date(Date.now() - 86400000)
    },
    {
      id: '2',
      userId: '5',
      userName: 'Emma Brown',
      amountDecayed: 3,
      previousAmount: 301,
      newAmount: 298,
      reason: 'Monthly decay - inactive for 32 days',
      timestamp: new Date(Date.now() - 172800000)
    },
    {
      id: '3',
      userId: '4',
      userName: 'David Wilson',
      amountDecayed: 8,
      previousAmount: 431,
      newAmount: 423,
      reason: 'Monthly decay - inactive for 60 days',
      timestamp: new Date(Date.now() - 259200000)
    }
  ]);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleSettingChange = (key: keyof DecaySettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast.success("Decay system settings saved successfully");
      setHasUnsavedChanges(false);
    } catch (error) {
      toast.error("Failed to save settings. Please try again.");
    }
  };

  const handleRunManualDecay = async () => {
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast.success("Manual decay process completed successfully");
    } catch (error) {
      toast.error("Failed to run manual decay. Please try again.");
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
    nextScheduled: new Date(Date.now() + (settings.period === 'daily' ? 86400000 : 
                                         settings.period === 'weekly' ? 604800000 : 
                                         2592000000))
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
                      <p className="text-2xl font-bold text-foreground">{stats.usersAffected}</p>
                    </div>
                    <Users className="w-8 h-8 text-primary" />
                  </div>
                </Card>
                
                <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Decayed</p>
                      <p className="text-2xl font-bold text-foreground">{stats.totalDecayed} REP</p>
                    </div>
                    <TrendingDown className="w-8 h-8 text-orange-500" />
                  </div>
                </Card>
                
                <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: '0.2s' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Last Run</p>
                      <p className="text-sm font-bold text-foreground">{stats.lastRun.toLocaleDateString()}</p>
                    </div>
                    <Clock className="w-8 h-8 text-blue-500" />
                  </div>
                </Card>
                
                <Card className="glass-card p-4 animate-fade-in" style={{ animationDelay: '0.3s' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Next Scheduled</p>
                      <p className="text-sm font-bold text-foreground">{stats.nextScheduled.toLocaleDateString()}</p>
                    </div>
                    <Calendar className="w-8 h-8 text-green-500" />
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

                      {/* Decay Rate */}
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-medium text-foreground">Decay Rate</Label>
                          <Badge variant="secondary" className="font-mono">
                            {settings.rate}% per {settings.period.slice(0, -2)}
                          </Badge>
                        </div>
                        <Slider
                          value={[settings.rate]}
                          onValueChange={(value) => handleSettingChange('rate', value[0])}
                          max={10}
                          min={0.1}
                          step={0.1}
                          className="w-full"
                        />
                        <p className="text-xs text-muted-foreground">
                          Percentage of reputation to decay each period
                        </p>
                      </div>

                      {/* Decay Period */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Decay Period</Label>
                        <Select 
                          value={settings.period} 
                          onValueChange={(value: 'daily' | 'weekly' | 'monthly') => handleSettingChange('period', value)}
                        >
                          <SelectTrigger className="glass-input">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="daily">Daily</SelectItem>
                            <SelectItem value="weekly">Weekly</SelectItem>
                            <SelectItem value="monthly">Monthly</SelectItem>
                          </SelectContent>
                        </Select>
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

                      {/* Max Decay Per Period */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Max Decay Per Period</Label>
                        <Input
                          type="number"
                          value={settings.maxDecayPerPeriod}
                          onChange={(e) => handleSettingChange('maxDecayPerPeriod', parseInt(e.target.value))}
                          className="glass-input"
                          min="1"
                        />
                        <p className="text-xs text-muted-foreground">
                          Maximum REP that can be decayed in a single period
                        </p>
                      </div>

                      {/* Inactivity Period */}
                      <div className="space-y-2">
                        <Label className="text-sm font-medium text-foreground">Inactivity Period (Days)</Label>
                        <Input
                          type="number"
                          value={settings.inactivityPeriod}
                          onChange={(e) => handleSettingChange('inactivityPeriod', parseInt(e.target.value))}
                          className="glass-input"
                          min="1"
                        />
                        <p className="text-xs text-muted-foreground">
                          Days of inactivity before decay starts
                        </p>
                      </div>

                      {/* Exemptions */}
                      <div className="space-y-4">
                        <h3 className="text-sm font-medium text-foreground">Exemptions</h3>
                        
                        <div className="flex items-center justify-between p-4 glass-card rounded-lg">
                          <div>
                            <Label className="text-sm font-medium text-foreground">Exempt Administrators</Label>
                            <p className="text-xs text-muted-foreground">Admin roles won't experience decay</p>
                          </div>
                          <Switch
                            checked={settings.exemptAdmins}
                            onCheckedChange={(checked) => handleSettingChange('exemptAdmins', checked)}
                          />
                        </div>

                        <div className="flex items-center justify-between p-4 glass-card rounded-lg">
                          <div>
                            <Label className="text-sm font-medium text-foreground">Exempt New Members</Label>
                            <p className="text-xs text-muted-foreground">New members get a grace period</p>
                          </div>
                          <Switch
                            checked={settings.exemptNewMembers}
                            onCheckedChange={(checked) => handleSettingChange('exemptNewMembers', checked)}
                          />
                        </div>

                        {settings.exemptNewMembers && (
                          <div className="space-y-2 ml-4">
                            <Label className="text-sm font-medium text-foreground">Grace Period (Days)</Label>
                            <Input
                              type="number"
                              value={settings.newMemberGraceDays}
                              onChange={(e) => handleSettingChange('newMemberGraceDays', parseInt(e.target.value))}
                              className="glass-input"
                              min="0"
                            />
                          </div>
                        )}
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