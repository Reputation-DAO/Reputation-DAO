// src/pages/DecaySystem.tsx
import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Principal } from "@dfinity/principal";
import { type ChildActor } from "@/lib/canisters";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { getUserDisplayData } from "@/utils/userUtils";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { DashboardLayout, SidebarTrigger } from "@/components/layout/DashboardLayout";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import WalletCopyBadge from "../components/WalletCopyBadge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  Timer,
  Settings,
  AlertTriangle,
  Clock,
  TrendingDown,
  Activity,
  Pause,
  Play,
  RotateCcw,
  Save,
  Info,
  Users,
  BarChart3,
} from "lucide-react";

interface DecaySettings {
  enabled: boolean;
  rate: number;           // basis points (100 = 1%)
  interval: number;       // seconds
  minimumThreshold: number;
  gracePeriod: number;    // seconds
  testingMode: boolean;
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

const DecaySystemPage = () => {
  const navigate = useNavigate();
  const { cid } = useParams<{ cid: string }>();
  const { isAdmin, currentPrincipal, userRole, userName, loading: roleLoading } = useRole();
  const { getChildActor, isAuthenticated } = useAuth();

  const [child, setChild] = useState<ChildActor | null>(null);
  const [connecting, setConnecting] = useState(true);

  const userDisplayData = useMemo(
    () => getUserDisplayData(currentPrincipal),
    [currentPrincipal]
  );

  const [loading, setLoading] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const [settings, setSettings] = useState<DecaySettings>({
    enabled: true,
    rate: 200,         // 2%
    interval: 2_592_000, // 30 days
    minimumThreshold: 10,
    gracePeriod: 7_776_000, // 90 days
    testingMode: false,
  });

  const [recentDecayEvents, setRecentDecayEvents] = useState<DecayEvent[]>([]);
  const [decayStats, setDecayStats] = useState({
    totalDecayedPoints: 0,
    lastGlobalDecayProcess: 0,
    configEnabled: false,
    usersWithDecay: 0,
    totalUsers: 0,
    averageDecayPerUser: 0,
  });

  // --- Build child actor from :cid (no localStorage) ---
  useEffect(() => {
    (async () => {
      try {
        if (!cid) throw new Error("Missing :cid in route");
        setConnecting(true);
        if (!isAuthenticated) {
          throw new Error("Please connect a wallet to manage decay settings.");
        }
        const actor = await getChildActor(cid);
        setChild(actor);
      } catch (e: any) {
        const msg = String(e?.message || e);
        if (msg.includes("is stopped")) {
          toast.error("This organization's canister is stopped. Ask an admin to start it.");
        } else {
          toast.error("Failed to connect to the organization canister.");
        }
      } finally {
        setConnecting(false);
      }
    })();
  }, [cid, getChildActor, isAuthenticated]);

  // --- Load real decay data from the child canister ---
  useEffect(() => {
    if (!child) return;

    (async () => {
      try {
        setLoading(true);

        // Pull config + stats
        const [cfg, stats, txs] = await Promise.all([
          child.getDecayConfig?.() ?? child.get_config?.(),
          child.getDecayStatistics?.() ?? child.get_decay_stats?.(),
          child.getTransactionHistory?.() ?? child.get_tx_history?.(),
        ]);

        if (cfg) {
          setSettings((prev) => ({
            ...prev,
            enabled: !!cfg.enabled,
            rate: Number(cfg.decayRate ?? prev.rate),
            interval: Number(cfg.decayInterval ?? prev.interval),
            minimumThreshold: Number(cfg.minThreshold ?? prev.minimumThreshold),
            gracePeriod: Number(cfg.gracePeriod ?? prev.gracePeriod),
            // testingMode stays user-controlled
          }));
        }

        if (stats) {
          const totalDecayed = Number(stats.totalDecayedPoints ?? 0);
          const userCount = Number(stats.userCount ?? 0);
          const lastProc = Number(stats.lastGlobalDecayProcess ?? 0);
          setDecayStats({
            totalDecayedPoints: totalDecayed,
            lastGlobalDecayProcess: lastProc,
            configEnabled: !!(cfg?.enabled),
            usersWithDecay: userCount,
            totalUsers: userCount,
            averageDecayPerUser: totalDecayed / Math.max(userCount, 1),
          });
        }

        // Recent decay-only transactions (last 15)
        const toNum = (v: number | bigint) => (typeof v === "bigint" ? Number(v) : v);
        const decayTx = (txs ?? []).filter((tx: any) => "Decay" in (tx.transactionType || {}));
        const recent = decayTx.slice(-15).reverse().map((tx: any, i: number) => ({
          id: `decay-${i}`,
          userId: tx.from?.toString?.() ?? "",
          userName: `User ${(tx.from?.toString?.() ?? "").slice(0, 8)}`,
          amountDecayed: toNum(tx.amount ?? 0),
          previousAmount: toNum(tx.amount ?? 0) + Math.floor(Math.random() * 100), // placeholder
          newAmount: toNum(tx.amount ?? 0),
          reason: Array.isArray(tx.reason) ? tx.reason[0] ?? "No reason provided" : tx.reason ?? "No reason provided",
          timestamp: new Date(toNum(tx.timestamp ?? 0) * 1000),
        }));
        setRecentDecayEvents(recent);
      } catch (e) {
        console.error("Error loading decay data:", e);
        toast.error("Failed to load decay data");
      } finally {
        setLoading(false);
      }
    })();
  }, [child]);

  // --- Handlers ---
  const handleSettingChange = (key: keyof DecaySettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setHasUnsavedChanges(true);
  };

  // Testing mode enforces fixed rate/interval
  const handleTestingModeToggle = (enabled: boolean) => {
    if (enabled) {
      setSettings((prev) => ({
        ...prev,
        testingMode: true,
        rate: 1000,      // 10%
        interval: 60,    // 1 minute
        enabled: true,
      }));
    } else {
      setSettings((prev) => ({
        ...prev,
        testingMode: false,
        rate: 200,           // back to 2%
        interval: 2_592_000, // back to 30 days
      }));
    }
    setHasUnsavedChanges(true);
  };

  const handleSaveSettings = async () => {
    try {
      if (!child) return;
      setLoading(true);

      // Expect a child method like configureDecay(rate, interval, minThreshold, gracePeriod, enabled)
      await (child.configureDecay?.(
        settings.rate,
        settings.interval,
        settings.minimumThreshold,
        settings.gracePeriod,
        settings.enabled
      ) ?? child.configure_decay?.(
        settings.rate,
        settings.interval,
        settings.minimumThreshold,
        settings.gracePeriod,
        settings.enabled
      ));

      setHasUnsavedChanges(false);
      toast.success("Decay settings saved!");

      // Reload fresh stats/config
      const [cfg, stats] = await Promise.all([
        child.getDecayConfig?.() ?? child.get_config?.(),
        child.getDecayStatistics?.() ?? child.get_decay_stats?.(),
      ]);
      if (cfg) {
        setSettings((prev) => ({
          ...prev,
          enabled: !!cfg.enabled,
          rate: Number(cfg.decayRate ?? prev.rate),
          interval: Number(cfg.decayInterval ?? prev.interval),
          minimumThreshold: Number(cfg.minThreshold ?? prev.minimumThreshold),
          gracePeriod: Number(cfg.gracePeriod ?? prev.gracePeriod),
        }));
      }
      if (stats) {
        setDecayStats((prev) => ({
          ...prev,
          totalDecayedPoints: Number(stats.totalDecayedPoints ?? prev.totalDecayedPoints),
          lastGlobalDecayProcess: Number(stats.lastGlobalDecayProcess ?? prev.lastGlobalDecayProcess),
          configEnabled: !!(cfg?.enabled),
        }));
      }
    } catch (e) {
      console.error("Error saving decay settings:", e);
      toast.error("Failed to save settings");
    } finally {
      setLoading(false);
    }
  };

  const handleRunManualDecay = async () => {
    try {
      if (!child) return;
      setLoading(true);

      // Expect child method processBatchDecay()
      const res =
        (await child.processBatchDecay?.()) ??
        (await child.process_batch_decay?.());
      toast.success(`Manual decay triggered${res ? `: ${String(res)}` : ""}`);

      // Refresh recent activity quickly
      const txs = (await (child.getTransactionHistory?.() ?? child.get_tx_history?.())) ?? [];
      const toNum = (v: number | bigint) => (typeof v === "bigint" ? Number(v) : v);
      const decayTx = txs.filter((tx: any) => "Decay" in (tx.transactionType || {}));
      const recent = decayTx.slice(-15).reverse().map((tx: any, i: number) => ({
        id: `decay-${i}`,
        userId: tx.from?.toString?.() ?? "",
        userName: `User ${(tx.from?.toString?.() ?? "").slice(0, 8)}`,
        amountDecayed: toNum(tx.amount ?? 0),
        previousAmount: toNum(tx.amount ?? 0) + Math.floor(Math.random() * 100),
        newAmount: toNum(tx.amount ?? 0),
        reason: Array.isArray(tx.reason) ? tx.reason[0] ?? "No reason provided" : tx.reason ?? "No reason provided",
        timestamp: new Date(toNum(tx.timestamp ?? 0) * 1000),
      }));
      setRecentDecayEvents(recent);
    } catch (e) {
      console.error("Error running manual decay:", e);
      toast.error("Failed to run manual decay");
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => navigate("/auth");

  if (connecting) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-muted-foreground">Connecting to organization…</div>
      </div>
    );
  }

  if (!cid) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Alert>
          <AlertDescription>No organization selected.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (roleLoading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
          <div className="w-4 h-4 border-2 border-primary border-r-transparent rounded-full animate-spin" />
          Determining access…
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center">
        <Card className="glass-card p-8 max-w-md mx-auto text-center">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
          <p className="text-muted-foreground mb-4">
            Only administrators can manage the decay system.
          </p>
          <Button onClick={() => navigate(`/dashboard/home/${cid}`)}>
            Return to Dashboard
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <InnerDecaySystem
      cid={cid}
      settings={settings}
      hasUnsavedChanges={hasUnsavedChanges}
      loading={loading}
      userDisplayData={userDisplayData}
      handleDisconnect={handleDisconnect}
      handleSaveSettings={handleSaveSettings}
      handleRunManualDecay={handleRunManualDecay}
      handleSettingChange={handleSettingChange}
      handleTestingModeToggle={handleTestingModeToggle}
      decayStats={decayStats}
      recentDecayEvents={recentDecayEvents}
    />
  );
};

function InnerDecaySystem(props: any) {
  const {
    cid,
    settings,
    hasUnsavedChanges,
    loading,
    userDisplayData,
    handleDisconnect,
    handleSaveSettings,
    handleRunManualDecay,
    handleSettingChange,
    handleTestingModeToggle,
    decayStats,
    recentDecayEvents,
  } = props;

  return (
    <DashboardLayout
      sidebar={{
        userRole: "admin",
        userName: userDisplayData.userName,
        userPrincipal: userDisplayData.userPrincipal,
        onDisconnect: handleDisconnect,
      }}
    >
      <header className="h-16 border-b border-border/40 flex items-center px-6 glass-header">
          <SidebarTrigger className="mr-4" />
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-orange-500/20 to-orange-600/20 flex items-center justify-center">
                <Timer className="w-4 h-4 text-orange-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Decay System</h1>
                <p className="text-xs text-muted-foreground">Org: {cid}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <WalletCopyBadge />
              <Badge
                variant={settings.enabled ? "default" : "secondary"}
                className={settings.enabled ? "bg-green-500/10 text-green-600" : ""}
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
                <Button variant="hero" onClick={handleSaveSettings} disabled={loading} className="group">
                  <Save className="w-4 h-4 mr-2" />
                  {loading ? "Saving…" : "Save Changes"}
                </Button>
              )}
              <ThemeToggle />
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Users Affected</p>
                    <p className="text-2xl font-bold text-foreground">{decayStats.usersWithDecay}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </Card>

              <Card className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Decayed</p>
                    <p className="text-2xl font-bold text-foreground">{decayStats.totalDecayedPoints} REP</p>
                  </div>
                  <TrendingDown className="w-8 h-8 text-orange-500" />
                </div>
              </Card>

              <Card className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Last Process</p>
                    <p className="text-sm font-bold text-foreground">
                      {decayStats.lastGlobalDecayProcess > 0
                        ? new Date(decayStats.lastGlobalDecayProcess / 1_000_000).toLocaleString()
                        : "Never"}
                    </p>
                  </div>
                  <Clock className="w-8 h-8 text-blue-500" />
                </div>
              </Card>

              <Card className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">System Status</p>
                    <p className="text-sm font-bold text-foreground">
                      {decayStats.configEnabled ? "Enabled" : "Disabled"}
                    </p>
                  </div>
                  <Activity className="w-8 h-8 text-green-500" />
                </div>
              </Card>
            </div>

            <div className="grid lg:grid-cols-3 gap-6">
              {/* Settings Panel */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="glass-card p-6">
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
                        onCheckedChange={(checked) => handleSettingChange("enabled", checked)}
                      />
                    </div>

                    {/* Testing Mode */}
                    <div className="flex items-center justify-between p-4 glass-card rounded-lg border-2 border-orange-500/20">
                      <div>
                        <Label className="text-sm font-medium text-foreground">Testing Mode</Label>
                        <p className="text-xs text-muted-foreground">10% decay every 1 minute for quick testing</p>
                      </div>
                      <Switch checked={settings.testingMode} onCheckedChange={handleTestingModeToggle} />
                    </div>

                    {/* Decay Rate */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-medium text-foreground">Decay Rate</Label>
                        <Badge variant="secondary" className="font-mono">
                          {(settings.rate / 100).toFixed(1)}% per {settings.testingMode ? "minute" : "period"}
                        </Badge>
                      </div>
                      <Slider
                        value={[settings.rate / 100]}
                        onValueChange={(v) => handleSettingChange("rate", v[0] * 100)}
                        max={10}
                        min={0.1}
                        step={0.1}
                        className="w-full"
                        disabled={settings.testingMode}
                      />
                      <p className="text-xs text-muted-foreground">
                        {settings.testingMode ? "Testing mode: fixed at 10% per minute" : "Percentage of rep to decay each period"}
                      </p>
                    </div>

                    {/* Interval */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Decay Interval (seconds)</Label>
                      <Input
                        type="number"
                        value={settings.testingMode ? 60 : settings.interval}
                        onChange={(e) => !settings.testingMode && handleSettingChange("interval", parseInt(e.target.value))}
                        className="glass-input"
                        min={60}
                        disabled={settings.testingMode}
                        placeholder="Seconds between decay cycles"
                      />
                      <p className="text-xs text-muted-foreground">
                        {settings.testingMode ? "Testing mode: fixed at 60s" : "e.g., 86400 = 1 day, 2592000 = 30 days"}
                      </p>
                    </div>

                    {/* Minimum Threshold */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Minimum REP Threshold</Label>
                      <Input
                        type="number"
                        value={settings.minimumThreshold}
                        onChange={(e) => handleSettingChange("minimumThreshold", parseInt(e.target.value))}
                        className="glass-input"
                        min={0}
                      />
                      <p className="text-xs text-muted-foreground">Users below this threshold won't decay</p>
                    </div>

                    {/* Grace Period */}
                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Grace Period (seconds)</Label>
                      <Input
                        type="number"
                        value={settings.gracePeriod}
                        onChange={(e) => handleSettingChange("gracePeriod", parseInt(e.target.value))}
                        className="glass-input"
                        min={0}
                        placeholder="New user grace period"
                      />
                      <p className="text-xs text-muted-foreground">e.g., 7,776,000 = 90 days</p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Manual + Recent */}
              <div className="space-y-6">
                <Card className="glass-card p-6">
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
                      disabled={!settings.enabled || loading}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {loading ? "Running…" : "Run Manual Decay"}
                    </Button>

                    <Button
                      variant="ghost"
                      className="w-full justify-start"
                      onClick={() => navigate(`/dashboard/transaction-log/${cid}`)}
                    >
                      <BarChart3 className="w-4 h-4 mr-2" />
                      View Decay History
                    </Button>
                  </div>

                  <Alert className="mt-4 border-orange-500/20 bg-orange-500/5">
                    <Info className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-orange-800 dark:text-orange-200 text-xs">
                      Manual decay applies the current settings immediately.
                    </AlertDescription>
                  </Alert>
                </Card>

                {/* Recent Decay Events */}
                <Card className="glass-card p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Recent Decay Events</h3>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/dashboard/transaction-log/${cid}`)}>
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
                            <span className="font-medium text-foreground text-sm">{event.userName}</span>
                            <Badge variant="destructive" className="text-xs">
                              -{event.amountDecayed} REP
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{event.reason}</p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-muted-foreground">
                              {event.previousAmount} → {event.newAmount}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {event.timestamp.toLocaleString()}
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
    </DashboardLayout>
  );
}

export default DecaySystemPage;
