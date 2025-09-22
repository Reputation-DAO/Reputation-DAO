// src/pages/AwardRep.tsx
// @ts-nocheck
import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Principal } from "@dfinity/principal";
import { makeChildWithPlug } from "@/components/canister/child";

import { useRole } from "@/contexts/RoleContext";
import { getUserDisplayData } from "@/utils/userUtils";
import { formatDateForDisplay } from "@/utils/transactionUtils";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { toast } from "sonner";

import {
  Award,
  Star,
  TrendingUp,
  User,
  AlertTriangle,
  Info,
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
  "Other",
];

const AwardRep = () => {
  const navigate = useNavigate();
  const { cid } = useParams<{ cid: string }>();
  const { userRole, currentPrincipal } = useRole();

  // child canister actor (built from :cid like your MUI example)
  const [child, setChild] = useState<any>(null);
  const [connecting, setConnecting] = useState(true);
  const [connectError, setConnectError] = useState<string | null>(null);

  // form + ui
  const [isAwarding, setIsAwarding] = useState(false);
  const [formData, setFormData] = useState<AwardFormData>({
    recipientAddress: "",
    reputationAmount: "",
    category: "",
    reason: "",
  });

  // stats + recent awards (computed from child.getTransactionHistory)
  const [recentAwards, setRecentAwards] = useState<RecentAward[]>([]);
  const [stats, setStats] = useState({
    totalAwards: 0,
    totalREPAwarded: 0,
    monthlyAwards: 0,
  });

  const handleDisconnect = () => navigate("/auth");

  // ---- Build child actor from :cid (no localStorage / no plug hook) ----
  useEffect(() => {
    (async () => {
      try {
        if (!cid) throw new Error("No organization selected.");
        const actor = await makeChildWithPlug({ canisterId: cid, host: "https://icp-api.io" });
        setChild(actor);
      } catch (e: any) {
        setConnectError(e?.message || "Failed to connect to org canister");
      } finally {
        setConnecting(false);
      }
    })();
  }, [cid]);

  // ---- Load recent awards + summary directly from child (logic mirrors your MUI example) ----
  const loadAwards = async () => {
    if (!child) return;
    try {
      const txs =
        (await child.getTransactionHistory?.()) ??
        (await child.get_transaction_history?.());
      const arr: any[] = Array.isArray(txs) ? txs : [];

      const toNum = (v: number | bigint) => (typeof v === "bigint" ? Number(v) : v);

      // filter Award transactions
      const awards = arr.filter((tx) => tx?.transactionType && "Award" in tx.transactionType);

      const totalREPAwarded = awards.reduce((sum, tx) => sum + toNum(tx.amount || 0), 0);
      const totalAwards = awards.length;

      const now = new Date();
      const monthlyAwards = awards.filter((tx) => {
        const ts = toNum(tx.timestamp || 0);
        if (!ts) return false;
        const d = new Date(ts * 1000);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length;

      setStats({ totalAwards, totalREPAwarded, monthlyAwards });

      // newest-first assumed; take first 5
      const lastFive = awards.slice(0, 5).map((tx: any, index: number) => {
        const ts = toNum(tx.timestamp || 0);
        const reason =
          (Array.isArray(tx.reason) && tx.reason.length ? tx.reason[0] : tx.reason) ||
          "No reason provided";
        const toStr = tx.to?.toString?.() ?? "";
        const fromStr = tx.from?.toString?.() ?? "";
        return {
          id: tx.id?.toString?.() ?? `award-${index}`,
          recipientName: `User ${toStr.slice(0, 8)}`,
          recipientAddress: toStr,
          amount: toNum(tx.amount || 0),
          category: "General",
          reason,
          timestamp: ts ? new Date(ts * 1000) : new Date(),
          awardedBy: `User ${fromStr.slice(0, 8)}`,
        } as RecentAward;
      });

      setRecentAwards(lastFive);
    } catch (error) {
      console.error("Failed to load recent awards:", error);
      setRecentAwards([]);
      setStats({ totalAwards: 0, totalREPAwarded: 0, monthlyAwards: 0 });
      toast.warning("Failed to load recent awards from the canister.");
    }
  };

  useEffect(() => {
    if (child) loadAwards();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child]);

  // ---- Form helpers ----
  const handleInputChange = (field: keyof AwardFormData, value: string) => {
    setFormData((p) => ({ ...p, [field]: value }));
  };

  // ---- Submit award (principal validation, self-award prevention, BigInt amount, optional reason) ----
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const { recipientAddress, reputationAmount, reason } = formData;

    if (!recipientAddress || !reputationAmount || !reason) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Principal validation
    let toPrincipal: Principal;
    try {
      toPrincipal = Principal.fromText(recipientAddress.trim());
    } catch {
      toast.error("Invalid recipient address. Please check the principal format.");
      return;
    }

    // Prevent self-award (UI-side)
    try {
      if (currentPrincipal && toPrincipal?.toString() === currentPrincipal.toString()) {
        toast.error("You cannot award reputation to yourself.");
        return;
      }
    } catch {
      // ignore
    }

    // Amount as bigint
    let amt: bigint;
    try {
      amt = BigInt(reputationAmount);
    } catch {
      toast.error("Amount must be a valid integer.");
      return;
    }
    if (amt <= 0n) {
      toast.error("Amount must be greater than 0.");
      return;
    }

    // Role gate (mirrors your previous check)
    if (userRole !== "Admin" && userRole !== "Awarder") {
      toast.error("Only Admins and Awarders can award reputation");
      return;
    }

    setIsAwarding(true);
    try {
      const optReason = reason.trim() ? [reason.trim()] : [];
      const res: string =
        (await child.awardRep?.(toPrincipal, amt, optReason)) ??
        (await child.award_rep?.(toPrincipal, amt, optReason));

      if (typeof res === "string" && res.toLowerCase().startsWith("error")) {
        // surface canister error string
        toast.error(res);
        return;
      }

      toast.success(`Successfully awarded ${reputationAmount} REP to ${recipientAddress}.`);

      // reset form
      setFormData({
        recipientAddress: "",
        reputationAmount: "",
        category: "",
        reason: "",
      });

      // refresh recent/summary
      await loadAwards();
    } catch (error: any) {
      console.error("Award error:", error);
      const msg = error?.message || "";

      if (/Not a trusted awarder/i.test(msg)) toast.error("You are not authorized to award reputation.");
      else if (/Daily mint cap exceeded/i.test(msg)) toast.error("Daily mint limit exceeded. Try again tomorrow.");
      else if (/Cannot self-award/i.test(msg)) toast.error("You cannot award reputation to yourself.");
      else if (/Paused/i.test(msg)) toast.error("The reputation system is currently paused.");
      else if (/Invalid principal/i.test(msg)) toast.error("Invalid recipient address. Please check the principal format.");
      else if (/Organization does not exist/i.test(msg)) toast.error("Organization not found. Please check your organization selection.");
      else toast.error(msg || "Failed to award reputation. Please try again.");
    } finally {
      setIsAwarding(false);
    }
  };

  // --- connection gates similar to your revoke page ---
  if (connecting) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="text-sm text-muted-foreground">Connecting to organization…</div>
      </div>
    );
  }
  if (!cid || connectError) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Card className="glass-card p-6">
          <AlertTriangle className="w-6 h-6 text-orange-500 mb-2" />
          <p className="text-sm text-muted-foreground">
            {connectError || "No organization selected."}
          </p>
          <div className="mt-3">
            <Button onClick={() => navigate("/org-selector")} variant="outline">
              Choose Org
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  if (userRole !== "Admin" && userRole !== "Awarder") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center">
        <Card className="glass-card p-8 max-w-md mx-auto text-center">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Access Denied</h2>
        </Card>
      </div>
    );
  }

  // === Fixed-sidebar alignment pattern (same as RevokeRep) ===
  return (
    <SidebarProvider>
      <InnerAwardRep
        userRole={userRole}
        principal={currentPrincipal}
        handleDisconnect={handleDisconnect}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        isAwarding={isAwarding}
        stats={stats}
        recentAwards={recentAwards}
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
    handleInputChange,
    handleSubmit,
    isAwarding,
    stats,
    recentAwards,
  } = props;

  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const userDisplay = getUserDisplayData(principal || null);

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background/95 to-muted/20">
      <DashboardSidebar
        userRole={(userRole?.toLowerCase() as "admin" | "awarder" | "member") || "member"}
        userName={userDisplay.userName}
        userPrincipal={userDisplay.userPrincipal}
        onDisconnect={handleDisconnect}
      />

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
                            placeholder="Enter Principal ID (e.g. rdmx6-jaaaa-aaaah-qcaiq-cai)"
                            value={formData.recipientAddress}
                            onChange={(e) => handleInputChange("recipientAddress", e.target.value)}
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
                            onChange={(e) => handleInputChange("reputationAmount", e.target.value)}
                            className="pl-10 glass-input"
                            min="1"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium text-foreground">Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => handleInputChange("category", value)}
                      >
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
                        onChange={(e) => handleInputChange("reason", e.target.value)}
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
                <Card className="glass-card p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
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
                <Card className="glass-card p-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Recent Awards</h3>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/transaction-log/${cid}`)}>
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
