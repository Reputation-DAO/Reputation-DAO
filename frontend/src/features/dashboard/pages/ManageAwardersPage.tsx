// src/pages/ManageAwarders.tsx
import React, { useState, useEffect } from "react";
import type { Dispatch, FormEvent, SetStateAction } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Principal } from "@dfinity/principal";
import { type ChildActor } from "@/lib/canisters";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DashboardLayout, SidebarTrigger } from "@/components/layout/DashboardLayout";
import WalletCopyBadge from "../components/WalletCopyBadge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
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

import { formatDateForDisplay } from "@/utils/transactionUtils";
import { useRole } from "@/contexts/RoleContext";
import { useAuth } from "@/contexts/AuthContext";
import { getUserDisplayData } from "@/utils/userUtils";
import type { Awarder as BackendAwarder, Transaction } from "@/declarations/reputation_dao/reputation_dao.did";

interface Awarder {
  id: string;
  name: string;
  principal: string;
  role: "admin" | "awarder";
  reputation: number;
  joinDate: Date;
  lastActive: Date;
  awardsGiven: number;
  status: "active" | "inactive";
}

interface NewAwarderForm {
  name: string;
  principal: string;
  role: "admin" | "awarder";
}

interface ManageAwarderStats {
  totalAwarders: number;
  activeAwarders: number;
  totalAwards: number;
  admins: number;
}

const RoleIcon = ({ role }: { role: string }) => {
  switch (role) {
    case "admin":
      return <Crown className="w-4 h-4 text-yellow-500" />;
    case "awarder":
      return <Shield className="w-4 h-4 text-blue-500" />;
    default:
      return <User className="w-4 h-4 text-green-500" />;
  }
};

const ManageAwardersPage: React.FC = () => {
  const navigate = useNavigate();
  const { cid } = useParams<{ cid: string }>();
  const { getChildActor, isAuthenticated } = useAuth();

  // Use your role context to gate access + show user in sidebar
  const { isAdmin, currentPrincipal, loading: roleLoading } = useRole();
  const userDisplayData = getUserDisplayData(currentPrincipal || null);

  // Child actor state
  const [child, setChild] = useState<ChildActor | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [connectError, setConnectError] = useState<string | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [awarders, setAwarders] = useState<Awarder[]>([]);
  const [isAddingAwarder, setIsAddingAwarder] = useState(false);
  const [newAwarder, setNewAwarder] = useState<NewAwarderForm>({
    name: "",
    principal: "",
    role: "awarder",
  });

  // --- Build child actor from :cid (no localStorage) ---
  useEffect(() => {
    (async () => {
      try {
        if (!cid) throw new Error("No organization selected.");
        setConnecting(true);
        if (!isAuthenticated) {
          throw new Error("Please connect a wallet to manage awarders.");
        }
        const actor = await getChildActor(cid);
        setChild(actor);
      } catch (e: any) {
        setConnectError(e?.message || "Failed to connect to org canister");
      } finally {
        setConnecting(false);
      }
    })();
  }, [cid, getChildActor, isAuthenticated]);

  // --- Load awarders + lightweight stats from child ---
  const loadAwarders = async () => {
    if (!child) return;
    setLoading(true);
    try {
      const backendAwarders = await child.getTrustedAwarders();
      const enriched: Awarder[] = await Promise.all(
        backendAwarders.map(async (awarder, index) => {
          const principalText = awarder.id.toString();
          let awardsGiven = 0;
          let lastActive = new Date(0);

          try {
            const transactions = await child.getTransactionsByUser(awarder.id);
            for (const tx of transactions) {
              if ("Award" in tx.transactionType && tx.from.toString() === principalText) {
                awardsGiven += 1;
              }

              const timestampMs = Number(tx.timestamp ?? 0n) * 1000;
              if (timestampMs > lastActive.getTime()) {
                lastActive = new Date(timestampMs);
              }
            }
          } catch (err) {
            console.warn("Failed to load transactions for awarder", principalText, err);
          }

          return {
            id: String(index),
            name: awarder.name || `User ${principalText.slice(0, 8)}`,
            principal: principalText,
            role: "awarder",
            reputation: 0,
            joinDate: new Date(),
            lastActive: lastActive.getTime() ? lastActive : new Date(),
            awardsGiven,
            status: awardsGiven > 0 ? "active" : "inactive",
          } satisfies Awarder;
        })
      );

      setAwarders(enriched);
      toast.success("Awarders loaded");
    } catch (error: any) {
      console.error("Error loading awarders:", error);
      toast.error("Failed to load awarders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (child) loadAwarders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [child]);

  // --- Add awarder on child ---
  const handleAddAwarder = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!child) {
      toast.error("Not connected to the organization canister.");
      return;
    }

    if (!newAwarder.name.trim() || !newAwarder.principal.trim()) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      setLoading(true);
      const p = Principal.fromText(newAwarder.principal.trim());
      const res = await child.addTrustedAwarder(p, newAwarder.name.trim());

      if (res.toLowerCase().includes("success")) {
        toast.success(`Added ${newAwarder.name} as ${newAwarder.role}`);
        setNewAwarder({ name: "", principal: "", role: "awarder" });
        setIsAddingAwarder(false);
        await loadAwarders();
      } else {
        throw new Error(res || "Failed to add awarder");
      }
    } catch (error: any) {
      toast.error(error?.message?.includes("Invalid principal") ? "Invalid Principal ID format" : "Failed to add awarder");
    } finally {
      setLoading(false);
    }
  };

  // --- Remove awarder on child ---
  const handleRemoveAwarder = async (id: string, name: string) => {
    if (!child) {
      toast.error("Not connected to the organization canister.");
      return;
    }
    try {
      const target = awarders.find((a) => a.id === id);
      if (!target) return toast.error("Awarder not found");

      const p = Principal.fromText(target.principal);
      const res = await child.removeTrustedAwarder(p);

      if (res.toLowerCase().includes("success")) {
        toast.success(`Removed ${name}`);
        setAwarders((prev) => prev.filter((a) => a.id !== id));
      } else {
        throw new Error(res || "Failed to remove awarder");
      }
    } catch (error: any) {
      console.error("Error removing awarder:", error);
      toast.error("Failed to remove awarder");
    }
  };

  // --- Local-only role toggle (no on-chain role in sample) ---
  const handleRoleChange = async (id: string, newRole: "admin" | "awarder") => {
    setAwarders((prev) => prev.map((a) => (a.id === id ? { ...a, role: newRole } : a)));
    toast.success("Role updated");
  };

  const handleDisconnect = () => navigate("/auth");

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
            <Button onClick={() => navigate("/org-selector")} variant="outline">Choose Org</Button>
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
          <p className="text-muted-foreground mb-4">Only administrators can manage awarders.</p>
          <Button onClick={() => navigate(`/dashboard/home/${cid}`)}>Return to Dashboard</Button>
        </Card>
      </div>
    );
  }

  const stats: ManageAwarderStats = {
    totalAwarders: awarders.length,
    activeAwarders: awarders.filter((a) => a.status === "active").length,
    totalAwards: awarders.reduce((sum, a) => sum + a.awardsGiven, 0),
    admins: awarders.filter((a) => a.role === "admin").length,
  };

  return (
    <InnerManageAwarders
      cid={cid}
      userDisplayData={userDisplayData}
      handleDisconnect={handleDisconnect}
      isAddingAwarder={isAddingAwarder}
      setIsAddingAwarder={setIsAddingAwarder}
      newAwarder={newAwarder}
      setNewAwarder={setNewAwarder}
      loading={loading}
      stats={stats}
      awarders={awarders}
      handleAddAwarder={handleAddAwarder}
      handleRemoveAwarder={handleRemoveAwarder}
      handleRoleChange={handleRoleChange}
    />
  );
};

interface InnerManageAwardersProps {
  cid: string | undefined;
  userDisplayData: ReturnType<typeof getUserDisplayData>;
  handleDisconnect: () => void;
  isAddingAwarder: boolean;
  setIsAddingAwarder: Dispatch<SetStateAction<boolean>>;
  newAwarder: NewAwarderForm;
  setNewAwarder: Dispatch<SetStateAction<NewAwarderForm>>;
  loading: boolean;
  stats: ManageAwarderStats;
  awarders: Awarder[];
  handleAddAwarder: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleRemoveAwarder: (id: string, name: string) => Promise<void>;
  handleRoleChange: (id: string, newRole: "admin" | "awarder") => void;
}

function InnerManageAwarders(props: InnerManageAwardersProps) {
  const {
    cid,
    userDisplayData,
    handleDisconnect,
    isAddingAwarder,
    setIsAddingAwarder,
    newAwarder,
    setNewAwarder,
    loading,
    stats,
    awarders,
    handleAddAwarder,
    handleRemoveAwarder,
    handleRoleChange,
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
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500/20 to-purple-600/20 flex items-center justify-center">
                <Users className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-foreground">Manage Awarders</h1>
                <p className="text-xs text-muted-foreground">Org: {cid}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <WalletCopyBadge />
              <Dialog open={isAddingAwarder} onOpenChange={setIsAddingAwarder}>
                <DialogTrigger asChild>
                  <Button variant="hero" className="group">
                    <UserPlus className="w-4 h-4 mr-2" />
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
                      onChange={(e) => setNewAwarder((prev) => ({ ...prev, name: e.target.value }))}
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
                      onChange={(e) => setNewAwarder((prev) => ({ ...prev, principal: e.target.value }))}
                      className="glass-input"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Role *</Label>
                    <Select
                      value={newAwarder.role}
                      onValueChange={(value: "admin" | "awarder") =>
                        setNewAwarder((prev) => ({ ...prev, role: value }))
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
                    <Button type="button" variant="outline" onClick={() => setIsAddingAwarder(false)} disabled={loading}>
                      Cancel
                    </Button>
                  </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="p-6">
          <div className="max-w-7xl mx-auto space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Awarders</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalAwarders}</p>
                  </div>
                  <Users className="w-8 h-8 text-primary" />
                </div>
              </Card>

              <Card className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Members</p>
                    <p className="text-2xl font-bold text-foreground">{stats.activeAwarders}</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
              </Card>

              <Card className="glass-card p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Awards</p>
                    <p className="text-2xl font-bold text-foreground">{stats.totalAwards}</p>
                  </div>
                  <Activity className="w-8 h-8 text-blue-500" />
                </div>
              </Card>

              <Card className="glass-card p-4">
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
            <Card className="glass-card p-6">
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
                    className="flex items-center justify-between p-4 glass-card rounded-lg hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary-glow/20 text-primary font-medium">
                          {awarder.name.split(" ").map((n) => n[0]).join("").toUpperCase()}
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
                            variant={awarder.status === "active" ? "default" : "secondary"}
                            className={awarder.status === "active" ? "bg-green-500/10 text-green-600" : ""}
                          >
                            {awarder.status}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-mono">{awarder.principal.slice(0, 25)}...</p>
                        <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Joined {formatDateForDisplay(awarder.joinDate)}
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
                          Active {formatDateForDisplay(awarder.lastActive)}
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
                            onClick={() => handleRoleChange(awarder.id, awarder.role === "admin" ? "awarder" : "admin")}
                            className="flex items-center gap-2"
                          >
                            <Settings className="w-4 h-4" />
                            Change to {awarder.role === "admin" ? "Awarder" : "Admin"}
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleRemoveAwarder(awarder.id, awarder.name)}
                            className="flex items-center gap-2 text-red-600"
                          >
                            <Trash2 className="w-4 h-4" />
                            Remove Awarder
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </main>
    </DashboardLayout>
  );
}

export default ManageAwardersPage;
