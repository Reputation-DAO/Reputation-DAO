// src/features/dashboard/pages/EconomySettingsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { DashboardLayout, SidebarTrigger } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import WalletCopyBadge from "../components/WalletCopyBadge";
import { AlertTriangle, Coins, RefreshCw, Save } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type RailToggle = { btc: boolean; icp: boolean; eth: boolean };
type Thresholds = { btcMin: string; icpMin: string; ethMin: string };

type MicroTipsConfig = {
  enabled: boolean;
  btcTipAmount: string;
  icpTipAmount: string;
  ethTipAmount: string;
  maxBtcPerPeriod: string;
  maxIcpPerPeriod: string;
  maxEthPerPeriod: string;
  maxEventsPerWindow: string;
};

type ScheduledConfig = {
  enabled: boolean;
  frequency: "Monthly";
  maxBtcPerCycle: string;
  maxIcpPerCycle: string;
  maxEthPerCycle: string;
};

type ComplianceConfig = {
  kycRequired: boolean;
  tagWhitelist: string[];
};

export type OrgEconomyConfig = {
  rails: RailToggle;
  thresholds: Thresholds;
  microTips: MicroTipsConfig;
  scheduled: ScheduledConfig;
  compliance: ComplianceConfig;
};

const mockConfig: OrgEconomyConfig = {
  rails: { btc: true, icp: true, eth: false },
  thresholds: { btcMin: "1000", icpMin: "200000000", ethMin: "0" },
  microTips: {
    enabled: true,
    btcTipAmount: "5000",
    icpTipAmount: "10000000",
    ethTipAmount: "2000000000000000",
    maxBtcPerPeriod: "500000",
    maxIcpPerPeriod: "2500000000",
    maxEthPerPeriod: "100000000000000000",
    maxEventsPerWindow: "25",
  },
  scheduled: {
    enabled: true,
    frequency: "Monthly",
    maxBtcPerCycle: "1500000",
    maxIcpPerCycle: "7500000000",
    maxEthPerCycle: "200000000000000000",
  },
  compliance: {
    kycRequired: false,
    tagWhitelist: ["core", "trusted"],
  },
};

type EconomyHookState = {
  config: OrgEconomyConfig | null;
  loading: boolean;
  saving: boolean;
  error: string | null;
  dirty: boolean;
  update: (updater: (prev: OrgEconomyConfig) => OrgEconomyConfig) => void;
  save: () => Promise<void>;
  reset: () => void;
};

function useOrgEconomyConfig(cid?: string): EconomyHookState {
  const [config, setConfig] = useState<OrgEconomyConfig | null>(null);
  const [initial, setInitial] = useState<OrgEconomyConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    // TODO: Replace mock load with Treasury canister fetch.
    const timer = setTimeout(() => {
      setConfig(mockConfig);
      setInitial(mockConfig);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [cid]);

  const dirty = useMemo(() => {
    if (!config || !initial) return false;
    return JSON.stringify(config) !== JSON.stringify(initial);
  }, [config, initial]);

  const update = (updater: (prev: OrgEconomyConfig) => OrgEconomyConfig) => {
    setConfig((prev) => (prev ? updater(prev) : prev));
  };

  const save = async () => {
    if (!config) return;
    setSaving(true);
    // TODO: Persist config to Treasury canister.
    await new Promise((resolve) => setTimeout(resolve, 600));
    setInitial(config);
    setSaving(false);
  };

  const reset = () => {
    if (initial) setConfig(initial);
  };

  return { config, loading, saving, error, dirty, update, save, reset };
}

export default function EconomySettingsPage() {
  const navigate = useNavigate();
  const { cid } = useParams<{ cid: string }>();
  const { isAuthenticated, principal } = useAuth();
  const { isAdmin, loading: roleLoading, userRole, userName, currentPrincipal } = useRole();

  const [submitting, setSubmitting] = useState(false);
  const {
    config,
    loading,
    dirty,
    saving,
    update,
    reset,
    save: persistConfig,
  } = useOrgEconomyConfig(cid);

  const sidebarPrincipal = currentPrincipal?.toText() || principal?.toText() || "";

  const handleRailToggle = (rail: keyof RailToggle, value: boolean) =>
    update((prev) => ({
      ...prev,
      rails: { ...prev.rails, [rail]: value },
    }));

  const handleThresholdChange = (rail: keyof Thresholds, value: string) =>
    update((prev) => ({
      ...prev,
      thresholds: { ...prev.thresholds, [rail]: value.replace(/[^\d]/g, "") },
    }));

  const handleMicroTipChange = (field: keyof MicroTipsConfig, value: string | boolean) =>
    update((prev) => ({
      ...prev,
      microTips: {
        ...prev.microTips,
        [field]:
          typeof value === "string" ? value.replace(/[^\d]/g, "") : value,
      },
    }));

  const handleScheduledChange = (field: keyof ScheduledConfig, value: string | boolean) =>
    update((prev) => ({
      ...prev,
      scheduled: {
        ...prev.scheduled,
        [field]:
          typeof value === "string" && field !== "frequency"
            ? value.replace(/[^\d]/g, "")
            : value,
      },
    }));

  const handleComplianceChange = (field: keyof ComplianceConfig, value: boolean | string[]) =>
    update((prev) => ({
      ...prev,
      compliance: {
        ...prev.compliance,
        [field]: value,
      },
    }));

  const tagValue = config?.compliance.tagWhitelist.join(", ") ?? "";

  const onSave = async () => {
    if (!dirty || !config) return;
    setSubmitting(true);
    await persistConfig();
    setSubmitting(false);
  };

  if (roleLoading || loading) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
          <div className="w-4 h-4 border-2 border-primary border-r-transparent rounded-full animate-spin" />
          Loading economy settings…
        </div>
      </div>
    );
  }

  if (!cid) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Card className="glass-card p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-orange-500 mx-auto mb-3" />
          <p className="text-muted-foreground">Select an organization to configure its economy settings.</p>
          <Button className="mt-4" onClick={() => navigate("/org-selector")}>
            Choose Organization
          </Button>
        </Card>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center">
        <Card className="glass-card p-8 max-w-md text-center">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Admin Only</h2>
          <p className="text-sm text-muted-foreground">
            You need admin privileges to manage payout rails and treasury settings.
          </p>
        </Card>
      </div>
    );
  }

  if (!config) {
    return null;
  }

  return (
    <DashboardLayout
      sidebar={{
        userRole,
        userName: userName || "Admin",
        userPrincipal: sidebarPrincipal,
        onDisconnect: () => navigate("/auth"),
      }}
    >
      <header className="h-16 border-b border-border/40 flex items-center justify-between px-6 glass-header">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="mr-4" />
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/20 to-blue-600/20 flex items-center justify-center">
            <Coins className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Economy Settings</h1>
            <p className="text-xs text-muted-foreground">Org: {cid}</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <WalletCopyBadge />
          <ThemeToggle />
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <Card className="glass-card border border-border/70">
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Payment rails & thresholds</h2>
                  <p className="text-sm text-muted-foreground">
                    Enable payout rails and define minimum treasury balances required to trigger payouts.
                  </p>
                </div>
                <Badge variant={config.rails.btc || config.rails.icp || config.rails.eth ? "default" : "secondary"}>
                  {Object.values(config.rails).filter(Boolean).length} / 3 rails active
                </Badge>
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {(["btc", "icp", "eth"] as (keyof RailToggle)[]).map((rail) => (
                  <div key={rail} className="rounded-xl border border-border/50 p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-wide">{rail}</p>
                        <p className="text-xs text-muted-foreground">Toggle {rail.toUpperCase()} payouts</p>
                      </div>
                      <Switch checked={config.rails[rail]} onCheckedChange={(v) => handleRailToggle(rail, v)} />
                    </div>
                    <Label className="text-xs text-muted-foreground">Minimum treasury balance</Label>
                    <Input
                      value={config.thresholds[`${rail}Min` as keyof Thresholds]}
                      onChange={(e) => handleThresholdChange(`${rail}Min` as keyof Thresholds, e.target.value)}
                      placeholder="0"
                      inputMode="numeric"
                    />
                  </div>
                ))}
              </div>
            </div>
          </Card>

          <Card className="glass-card border border-border/70">
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Micro-tips</h2>
                  <p className="text-sm text-muted-foreground">
                    Event-driven tips triggered when reputation is awarded. Use per-rail caps to control spend.
                  </p>
                </div>
                <Switch
                  checked={config.microTips.enabled}
                  onCheckedChange={(v) => handleMicroTipChange("enabled", v)}
                />
              </div>

              <div className="grid md:grid-cols-3 gap-6">
                {(["btc", "icp", "eth"] as const).map((rail) => (
                  <div key={rail} className="space-y-2">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      {rail.toUpperCase()} tip amount
                    </Label>
                    <Input
                      value={config.microTips[`${rail}TipAmount` as keyof MicroTipsConfig] as string}
                      onChange={(e) => handleMicroTipChange(`${rail}TipAmount` as keyof MicroTipsConfig, e.target.value)}
                      inputMode="numeric"
                      placeholder="0"
                    />
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Max {rail.toUpperCase()} per period
                    </Label>
                    <Input
                      value={config.microTips[`max${rail.charAt(0).toUpperCase()}${rail.slice(1)}PerPeriod` as keyof MicroTipsConfig] as string}
                      onChange={(e) =>
                        handleMicroTipChange(
                          `max${rail.charAt(0).toUpperCase()}${rail.slice(1)}PerPeriod` as keyof MicroTipsConfig,
                          e.target.value
                        )
                      }
                      inputMode="numeric"
                      placeholder="0"
                    />
                  </div>
                ))}
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                    Max tip events per window
                  </Label>
                  <Input
                    value={config.microTips.maxEventsPerWindow}
                    onChange={(e) => handleMicroTipChange("maxEventsPerWindow", e.target.value)}
                    inputMode="numeric"
                    placeholder="0"
                  />
                </div>
              </div>
            </div>
          </Card>

          <Card className="glass-card border border-border/70">
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Scheduled payouts</h2>
                  <p className="text-sm text-muted-foreground">
                    Automate cycle-based rewards tied to reputation tiers. Tiers editor coming soon.
                  </p>
                </div>
                <Switch
                  checked={config.scheduled.enabled}
                  onCheckedChange={(v) => handleScheduledChange("enabled", v)}
                />
              </div>

              <div className="grid md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-xs uppercase tracking-wide text-muted-foreground">Frequency</Label>
                  <Select value={config.scheduled.frequency} onValueChange={(v) => handleScheduledChange("frequency", v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select frequency" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Monthly">Monthly</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(["btc", "icp", "eth"] as const).map((rail) => (
                  <div key={rail} className="space-y-2">
                    <Label className="text-xs uppercase tracking-wide text-muted-foreground">
                      Max {rail.toUpperCase()} per cycle
                    </Label>
                    <Input
                      value={config.scheduled[`max${rail.charAt(0).toUpperCase()}${rail.slice(1)}PerCycle` as keyof ScheduledConfig] as string}
                      onChange={(e) =>
                        handleScheduledChange(
                          `max${rail.charAt(0).toUpperCase()}${rail.slice(1)}PerCycle` as keyof ScheduledConfig,
                          e.target.value
                        )
                      }
                      inputMode="numeric"
                      placeholder="0"
                    />
                  </div>
                ))}
              </div>

              <div className="rounded-xl border border-dashed border-border/50 p-4 text-sm text-muted-foreground">
                Tier-based payout tables are coming soon. For now, scheduled payouts distribute proportionally across
                active members.
              </div>
            </div>
          </Card>

          <Card className="glass-card border border-border/70">
            <div className="p-6 space-y-6">
              <div className="flex items-start justify-between flex-wrap gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-foreground">Compliance & controls</h2>
                  <p className="text-sm text-muted-foreground">
                    Add lightweight guardrails for payouts. Tag whitelist is comma-separated.
                  </p>
                </div>
                <Switch
                  checked={config.compliance.kycRequired}
                  onCheckedChange={(v) => handleComplianceChange("kycRequired", v)}
                />
              </div>

              <div className="space-y-2">
                <Label className="text-xs uppercase tracking-wide text-muted-foreground">Allowed tags</Label>
                <Input
                  value={tagValue}
                  onChange={(e) =>
                    handleComplianceChange(
                      "tagWhitelist",
                      e.target.value
                        .split(",")
                        .map((t) => t.trim())
                        .filter(Boolean)
                    )
                  }
                  placeholder="core, builder, council"
                />
                <p className="text-xs text-muted-foreground">
                  Users must match at least one tag to receive payouts when compliance is enabled.
                </p>
              </div>
            </div>
          </Card>

          <div className="flex flex-wrap items-center gap-3">
            <Button
              onClick={onSave}
              disabled={!dirty || saving || submitting}
              className={cn("gap-2", (!dirty || saving || submitting) && "opacity-80")}
            >
              {saving || submitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Saving…
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  Save changes
                </>
              )}
            </Button>
            <Button variant="ghost" onClick={reset} disabled={!dirty}>
              Reset
            </Button>
            {!dirty && (
              <span className="text-xs text-muted-foreground">All changes saved</span>
            )}
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
