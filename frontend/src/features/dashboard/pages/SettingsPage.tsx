// src/features/dashboard/pages/SettingsAdminPage.tsx
import { useEffect, useMemo, useState } from "react";
import type { FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Principal } from "@dfinity/principal";

import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { useFactoria } from "@/features/orgs/hooks/useFactoria";
import type { ChildActor } from "@/lib/canisters";

import { DashboardLayout, SidebarTrigger } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import WalletCopyBadge from "../components/WalletCopyBadge";
import { toast } from "sonner";

import { ShieldCheck, UserCog, AlertTriangle, CheckCircle2, RefreshCw, Loader2 } from "lucide-react";

/**
 * ChangeAdminPage — NO-CONTROLLER, NO-REINSTALL flow
 * Sequence:
 *   1) child.transferOwnership(newOwner)   // must be called by current owner
 *   2) factory.reassignOwner(cid, newOwner) // sync registry for UI/queries
 */

export default function SettingsAdminPage() {
  const navigate = useNavigate();
  const { cid } = useParams<{ cid: string }>();

  const { isAuthenticated, authMethod, principal, getChildActor } = useAuth();
  const { isAdmin, loading: roleLoading } = useRole();
  const {
    factoria,
    isConnected: factoriaConnected,
    connecting: factoriaConnecting,
    refresh: refreshFactoria,
  } = useFactoria();

  const [child, setChild] = useState<ChildActor | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [connectError, setConnectError] = useState<string | null>(null);

  // form
  const [newOwnerText, setNewOwnerText] = useState("");
  const [busy, setBusy] = useState<false | "child" | "registry" | "all">(false);
  const [lastStep, setLastStep] = useState<string>("idle");

  const currentPrincipalText = useMemo(() => principal?.toText() ?? "", [principal]);

  // Build child actor from :cid
  useEffect(() => {
    (async () => {
      try {
        if (!cid) throw new Error("No organization selected");
        if (!isAuthenticated) throw new Error("Please authenticate first");
        const actor = await getChildActor(cid);
        setChild(actor);
      } catch (e: any) {
        setConnectError(e?.message || "Failed to connect to child canister");
      } finally {
        setConnecting(false);
      }
    })();
  }, [cid, isAuthenticated, getChildActor]);

  // ---------- helpers ----------
  const parsePrincipal = (txt: string): Principal | null => {
    try {
      return Principal.fromText(txt.trim());
    } catch {
      return null;
    }
  };

  // (1) change owner in child (must be called by current owner)
  const transferOnChild = async (childId: Principal, newOwner: Principal) => {
    if (!child) throw new Error("Child actor not connected");
    setBusy("child");
    setLastStep("Calling child.transferOwnership…");
    const res = await child.transferOwnership(newOwner); // returns Text
    if (typeof res === "string" && res.toLowerCase().startsWith("error")) {
      throw new Error(res);
    }
    setBusy(false);
    setLastStep("Child owner flipped");
  };

  // (2) sync Factory registry (so UI/queries stay consistent)
  const reassignInRegistry = async (childId: Principal, newOwner: Principal) => {
    if (!factoria) throw new Error("Factoria not connected");
    setBusy("registry");
    setLastStep("Updating Factory registry…");
    const res = await factoria.reassignOwner(childId, newOwner);
    if (!(typeof res === "string" && res.toLowerCase().startsWith("success"))) {
      throw new Error(res || "Registry update failed");
    }
    setBusy(false);
    setLastStep("Factory registry updated");
  };

  // One-click flow (2 steps only)
  const runAll = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!cid) return toast.error("Missing child canister id");

    const childId = parsePrincipal(cid);
    const newOwner = parsePrincipal(newOwnerText);

    if (!childId) return toast.error("Invalid child canister id");
    if (!newOwner) return toast.error("Invalid new owner principal");

    try {
      setBusy("all");
      await transferOnChild(childId, newOwner); // requires caller to be CURRENT owner
      toast.success("Child owner updated");

      await reassignInRegistry(childId, newOwner);
      toast.success("Factory registry synced");

      setLastStep("Done");
    } catch (err: any) {
      console.error(err);
      toast.error(err?.message || "Admin change failed");
    } finally {
      setBusy(false);
    }
  };

  // Optional single-step buttons
  const doChildOnly = async () => {
    const childId = parsePrincipal(cid || "");
    const newOwner = parsePrincipal(newOwnerText);
    if (!childId || !newOwner) return toast.error("Invalid inputs");
    try {
      await transferOnChild(childId, newOwner);
      toast.success("Child owner updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed updating child owner");
    }
  };

  const doRegistryOnly = async () => {
    const childId = parsePrincipal(cid || "");
    const newOwner = parsePrincipal(newOwnerText);
    if (!childId || !newOwner) return toast.error("Invalid inputs");
    try {
      await reassignInRegistry(childId, newOwner);
      toast.success("Factory registry updated");
    } catch (e: any) {
      toast.error(e?.message || "Failed updating registry");
    }
  };

  // ---------- gates ----------
  if (connecting || roleLoading || factoriaConnecting) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
          <div className="w-4 h-4 border-2 border-primary border-r-transparent rounded-full animate-spin" />
          Connecting…
        </div>
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

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background/95 to-muted/20 flex items-center justify-center">
        <Card className="glass-card p-8 max-w-md mx-auto text-center">
          <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-foreground mb-2">Admin Only</h2>
          <p className="text-sm text-muted-foreground">
            You need admin privileges to change the organization owner.
          </p>
        </Card>
      </div>
    );
  }

  return (
    <DashboardLayout
      sidebar={{
        userRole: "admin",
        userName: currentPrincipalText.slice(0, 8),
        userPrincipal: currentPrincipalText,
        onDisconnect: () => navigate("/auth"),
      }}
    >
      <header className="h-16 border-b border-border/40 flex items-center justify-between px-6 glass-header">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="mr-4" />
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500/20 to-violet-600/20 flex items-center justify-center">
            <ShieldCheck className="w-4 h-4 text-violet-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">Change Organization Admin</h1>
            <p className="text-xs text-muted-foreground">Owner-only handover (no controller change)</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <WalletCopyBadge />
          <ThemeToggle />
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-6xl mx-auto grid gap-6 lg:grid-cols-3">
          {/* Left: form & action buttons */}
          <Card className="glass-card p-6 lg:col-span-2">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-600/20 flex items-center justify-center">
                <UserCog className="w-5 h-5 text-violet-600" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-foreground">Owner Handover</h2>
                <p className="text-sm text-muted-foreground">
                  Execute the 2-step transfer: child → registry
                </p>
              </div>
            </div>

            <form onSubmit={runAll} className="space-y-6">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="childId">Child Canister ID</Label>
                  <Input id="childId" value={cid} disabled className="font-mono" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newOwner">New Owner Principal</Label>
                  <Input
                    id="newOwner"
                    placeholder="eg. rdmx6-jaaaa-aaa…"
                    value={newOwnerText}
                    onChange={(e) => setNewOwnerText(e.target.value)}
                    className="font-mono"
                  />
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={doChildOnly}
                  disabled={!newOwnerText || (busy !== false && busy !== "child")}
                >
                  {busy === "child" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <UserCog className="w-4 h-4 mr-2" />
                  )}
                  Child Owner
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={doRegistryOnly}
                  disabled={!newOwnerText || !factoriaConnected || (busy !== false && busy !== "registry")}
                >
                  {busy === "registry" ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <RefreshCw className="w-4 h-4 mr-2" />
                  )}
                  Registry
                </Button>
              </div>

              <Button
                type="submit"
                variant="hero"
                size="lg"
                className="w-full"
                disabled={!newOwnerText || (busy !== false && busy !== "all")}
              >
                {busy === "all" ? (
                  <>
                    <div className="w-5 h-5 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Run Transfer (2 Steps)
                  </>
                ) : (
                  <>
                    <ShieldCheck className="w-5 h-5 mr-2" />
                    Run Transfer (2 Steps)
                  </>
                )}
              </Button>

              <div className="text-xs text-muted-foreground">
                Tip: This flow only changes the child’s internal <code>owner</code> and then updates the Factory
                registry. It does <i>not</i> grant or modify canister controllers.
              </div>
            </form>
          </Card>

          {/* Right: status & readiness */}
          <div className="space-y-6">
            <Card className="glass-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Connection Status</h3>
                <Badge variant={factoriaConnected ? "secondary" : "outline"}>
                  {factoriaConnected ? "Connected" : "Disconnected"}
                </Badge>
              </div>
              <ul className="text-sm space-y-2">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" /> Auth: {authMethod || "unknown"}
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" /> Principal:{" "}
                  <span className="font-mono">{currentPrincipalText || "-"}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" /> Child:{" "}
                  <span className="font-mono">{cid}</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-600" /> Factoria:{" "}
                  <Button size="sm" variant="ghost" onClick={() => refreshFactoria()}>
                    Refresh
                  </Button>
                </li>
              </ul>
            </Card>

            <Card className="glass-card p-6">
              <h3 className="font-semibold text-foreground mb-2">Last Step</h3>
              <p className="text-sm text-muted-foreground min-h-[1.5rem]">{lastStep}</p>
            </Card>
          </div>
        </div>
      </main>
    </DashboardLayout>
  );
}
