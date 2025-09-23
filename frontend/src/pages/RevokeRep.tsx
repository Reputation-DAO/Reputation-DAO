// src/pages/RevokeRep.tsx
// @ts-nocheck
import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Principal } from "@dfinity/principal";
import { makeChildWithPlug } from "@/components/canister/child";

import { useRole } from "@/contexts/RoleContext";
import { getUserDisplayData } from "@/utils/userUtils";
import { formatDateForDisplay } from "@/utils/transactionUtils";

import { SidebarProvider, SidebarTrigger, useSidebar } from "@/components/ui/sidebar";
import { DashboardSidebar } from "@/components/layout/DashboardSidebar";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";

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

const RevokeRep: React.FC = () => {
  const navigate = useNavigate();
  const { cid } = useParams<{ cid: string }>();

  // permissions
  const { userRole, isAdmin, currentPrincipal, loading: roleLoading } = useRole();
  const userDisplayData = getUserDisplayData(currentPrincipal || null);

  // child canister actor
  const [child, setChild] = useState<any>(null);
  const [connecting, setConnecting] = useState(true);
  const [connectError, setConnectError] = useState<string | null>(null);

  // ui state
  const [formData, setFormData] = useState<RevokeFormData>({
    recipientAddress: "",
    reputationAmount: "",
    category: "",
    reason: ""
  });
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [recentRevocations, setRecentRevocations] = useState<RecentRevocation[]>([]);
  const [loading, setLoading] = useState(false);

  const [stats, setStats] = useState({
    totalRevocations: 0,
    totalREPRevoked: 0,
    monthlyRevocations: 0
  });

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

  // ---- Load recent revocations + stats directly from child ----
  const loadRevocations = async () => {
    if (!child) return;
    try {
      // Get all org transactions from child
      const txs = await (child.getTransactionHistory?.() ?? child.get_transaction_history?.());
      const arr = Array.isArray(txs) ? txs : [];

      const toNum = (v: number | bigint) => (typeof v === "bigint" ? Number(v) : v);

      const revokeTx = arr.filter((tx) => tx?.transactionType && "Revoke" in tx.transactionType);

      const totalRevocations = revokeTx.length;
      const totalREPRevoked = revokeTx.reduce((sum, tx) => sum + toNum(tx.amount || 0), 0);

      const now = new Date();
      const monthlyRevocations = revokeTx.filter((tx) => {
        const ts = toNum(tx.timestamp || 0);
        if (!ts) return false;
        const d = new Date(ts * 1000);
        return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
      }).length;

      setStats({ totalRevocations, totalREPRevoked, monthlyRevocations });

      // Recent list (latest 5)
      const recent = revokeTx
        .slice(0, 5)
        .map((tx: any, i: number) => {
          const ts = toNum(tx.timestamp || 0);
          return {
            id: tx.id?.toString?.() ?? `rev-${i}`,
            recipientName: `User ${tx.to?.toString?.().slice(0, 8)}`,
            recipientAddress: tx.to?.toString?.() ?? "",
            amount: toNum(tx.amount || 0),
            category: "General",
            reason: (Array.isArray(tx.reason) ? tx.reason[0] : tx.reason) || "No reason provided",
            timestamp: ts ? new Date(ts * 1000) : new Date(),
            revokedBy: `User ${tx.from?.toString?.().slice(0, 8)}`
          } as RecentRevocation;
        });

      setRecentRevocations(recent);
    } catch (error) {
      console.error("Failed to load revocation data:", error);
      setRecentRevocations([]);
      setStats({ totalRevocations: 0, totalREPRevoked: 0, monthlyRevocations: 0 });
      toast.error("Failed to load revocation data from blockchain.");
    }
  };

  useEffect(() => {
    if (child) loadRevocations();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child]);

  const handleInputChange = (field: keyof RevokeFormData, value: string) => {
    setFormData((p) => ({ ...p, [field]: value }));
  };

  const validateForm = () => {
    const { recipientAddress, reputationAmount, category, reason } = formData;
    if (!recipientAddress || !reputationAmount || !category || !reason) {
      toast.error("Please fill in all required fields");
      return false;
    }
    try {
      Principal.fromText(recipientAddress);
    } catch {
      toast.error("Invalid recipient address. Please check the principal format.");
      return false;
    }
    const amt = Number(reputationAmount);
    if (!Number.isFinite(amt) || amt <= 0) {
      toast.error("Amount must be greater than 0.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    if (!showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    try {
      setLoading(true);
      if (!child) throw new Error("Not connected to the organization canister");

      const recipientPrincipal = Principal.fromText(formData.recipientAddress.trim());
      const amountBig = BigInt(Number(formData.reputationAmount));

      // Backend expects: revokeRep(principal, amount, [reason])
      const res: string =
        (await child.revokeRep?.(recipientPrincipal, amountBig, [formData.reason.trim()])) ??
        (await child.revoke_rep?.(recipientPrincipal, amountBig, [formData.reason.trim()]));

      if (typeof res === "string" && res.toLowerCase().startsWith("error")) {
        throw new Error(res);
      }

      toast.success(`Successfully revoked ${formData.reputationAmount} REP from ${formData.recipientAddress}`);

      // Reset form + UI
      setFormData({ recipientAddress: "", reputationAmount: "", category: "", reason: "" });
      setShowConfirmation(false);

      // Reload list
      await loadRevocations();
    } catch (error: any) {
      console.error("Revoke error:", error);
      const msg = error?.message || "Failed to revoke reputation. Please try again.";
      if (msg.includes("Only owner")) toast.error("Only the organization admin can revoke reputation.");
      else toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleDisconnect = () => navigate("/auth");

  // --- connection gate ---
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
          <p className="text-sm text-muted-foreground">{connectError || "No organization selected."}</p>
          <div className="mt-3">
            <Button onClick={() => navigate("/org-selector")} variant="outline">
              Choose Org
            </Button>
          </div>
        </Card>
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
            You don't have permission to revoke reputation points. Only admins can revoke reputation.
          </p>
          <Button onClick={() => navigate(`/dashboard/home/${cid}`)}>Return to Dashboard</Button>
        </Card>
      </div>
    );
  }

  // === Same fixed-sidebar alignment pattern as other pages ===
  return (
    <SidebarProvider>
      <InnerRevokeRep
        cid={cid}
        userRole={userRole}
        userDisplayData={userDisplayData}
        handleDisconnect={handleDisconnect}
        stats={stats}
        recentRevocations={recentRevocations}
        formData={formData}
        setFormData={setFormData}
        handleInputChange={handleInputChange}
        handleSubmit={handleSubmit}
        showConfirmation={showConfirmation}
        setShowConfirmation={setShowConfirmation}
        loading={loading}
      />
    </SidebarProvider>
  );
};

function InnerRevokeRep(props: any) {
  const {
    cid,
    userRole,
    userDisplayData,
    handleDisconnect,
    stats,
    recentRevocations,
    formData,
    setFormData,
    handleInputChange,
    handleSubmit,
    showConfirmation,
    setShowConfirmation,
    loading,
  } = props;

  const navigate = useNavigate();

  // Read sidebar state and shift content (collapsed: 72px, expanded: 280px)
  const { state } = useSidebar();
  const collapsed = state === "collapsed";

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-background via-background/95 to-muted/20">
      <DashboardSidebar
        userRole={userRole?.toLowerCase() as "admin" | "awarder" | "member"}
        userName={userDisplayData.userName}
        userPrincipal={userDisplayData.userPrincipal}
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
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500/20 to-red-600/20 flex items-center justify-center">
              <UserMinus className="w-4 h-4 text-red-600" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground">Revoke Reputation</h1>
              <p className="text-xs text-muted-foreground">Org: {cid}</p>
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
              {/* Form */}
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
                          <UserMinus className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <Input
                            id="reputationAmount"
                            type="number"
                            placeholder="Enter amount to revoke"
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
                      <Label className="text-sm font-medium text-foreground">Revocation Category *</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => handleInputChange("category", value)}
                      >
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
                        onChange={(e) => handleInputChange("reason", e.target.value)}
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
                {/* Summary */}
                <Card className="glass-card p-6 animate-fade-in" style={{ animationDelay: "0.1s" }}>
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
                <Card className="glass-card p-6 animate-fade-in" style={{ animationDelay: "0.2s" }}>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-foreground">Recent Revocations</h3>
                    <Button variant="ghost" size="sm" onClick={() => navigate(`/transaction-log/${cid}`)}>
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
                        <div
                          key={revocation.id}
                          className="p-3 glass-card rounded-lg hover:shadow-md transition-all duration-200 border-l-2 border-red-500/30"
                        >
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-foreground text-sm">{revocation.recipientName}</span>
                            <Badge variant="destructive" className="text-xs">
                              -{revocation.amount} REP
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2 line-clamp-2">{revocation.reason}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="outline" className="text-xs border-red-500/20 text-red-600">
                              {revocation.category}
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {formatDateForDisplay(revocation.timestamp)}
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

export default RevokeRep;
