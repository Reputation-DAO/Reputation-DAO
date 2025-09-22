// OrgSelector.tsx — shadcn UI + full ReputationFactory logic (Owned + Public) with uniform solid design
// @ts-nocheck

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { usePlugConnection } from "@/hooks/usePlugConnection";
import { Principal } from "@dfinity/principal";
import { toast } from "sonner";

// shadcn/ui
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import Navigation from "@/components/ui/navigation";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

// icons
import {
  Building,
  Users,
  Star,
  User,
  Shield,
  Crown,
  Filter,
  Plus,
  ArrowRight,
  Copy,
  CheckCircle2,
  Settings,
  Power,
  Coins,
  Trash2,
  Pencil,
  Check,
  Cpu,
} from "lucide-react";

// Factory actor helpers (Plug-first)
import {
  makeFactoriaWithPlug,
  getFactoriaCanisterId,
} from "@/components/canister/factoria";

// ---------------- Types ----------------
type Plan = "Free" | "Basic" | "Pro";
type Status = "Active" | "Archived";

type OrgRecord = {
  id: string;
  name: string;
  canisterId: string;
  plan?: Plan;
  status: Status;
  publicVisibility?: boolean;
  createdAt?: number;
  users?: string;
  cycles?: string;
  txCount?: string;
  paused?: boolean;
  isStopped?: boolean;
};

const toStatus = (s: any): Status =>
  s && typeof s === "object" && "Archived" in s ? "Archived" : "Active";

const natToStr = (n?: bigint) =>
  typeof n === "bigint" ? n.toString() : undefined;

// ---------------- Wallet Badge ----------------
const WalletDisplay = () => {
  const { isConnected, principal } = usePlugConnection({ autoCheck: true });
  if (!isConnected || !principal) return null;

  const principalStr = principal.toString();
  const shortPrincipal = `${principalStr.slice(0, 8)}...${principalStr.slice(-8)}`;

  return (
    <div className="flex items-center gap-2 rounded-lg px-3 py-2 border border-border bg-card">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      <span className="text-sm font-mono text-muted-foreground">{shortPrincipal}</span>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                navigator.clipboard.writeText(principalStr);
                toast.success("Principal copied");
              }}
              className="h-6 w-6 p-0"
            >
              <Copy className="w-3 h-3" />
            </Button>
          </TooltipTrigger>
          <TooltipContent className="text-xs">Copy principal</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  );
};

// ---------------- Role Badge ----------------
const RoleIcon = ({ role }: { role: string }) => {
  switch (role) {
    case "admin":
      return <Crown className="w-3.5 h-3.5 text-yellow-500" />;
    case "moderator":
      return <Shield className="w-3.5 h-3.5 text-blue-500" />;
    case "member":
      return <User className="w-3.5 h-3.5 text-green-500" />;
    default:
      return <User className="w-3.5 h-3.5 text-green-500" />;
  }
};

// -------------- Small helper components --------------
const Metric = ({ icon: Icon, label }: { icon: any; label: React.ReactNode }) => (
  <div className="inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs text-muted-foreground bg-background">
    <Icon className="w-3.5 h-3.5" />
    <span className="truncate">{label}</span>
  </div>
);

const StatusDot = ({ ok }: { ok: boolean }) => (
  <span
    className={`inline-block w-2 h-2 rounded-full ${ok ? "bg-emerald-500" : "bg-amber-500"} shadow-[0_0_0_3px_rgba(0,0,0,0.08)]`}
  />
);

// ---------------- Card (Owned) ----------------
const OwnedCard = ({
  org,
  onManage,
  onTopUp,
  onTogglePower,
  onEdit,
  onDelete,
}: {
  org: OrgRecord;
  onManage: () => void;
  onTopUp: () => void;
  onTogglePower: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) => {
  const idShort = `${org.id.slice(0, 10)}…${org.id.slice(-6)}`;

  return (
    <Card className="w-full relative overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      {/* status ribbon */}
      {org.isStopped && (
        <div className="absolute top-0 right-0 text-[10px] tracking-wide bg-amber-500 text-white px-3 py-1 rounded-bl-md">
          STOPPED
        </div>
      )}
      {org.status === "Archived" && !org.isStopped && (
        <div className="absolute top-0 right-0 text-[10px] tracking-wide bg-slate-500 text-white px-3 py-1 rounded-bl-md">
          ARCHIVED
        </div>
      )}

      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
          <div className="flex items-start gap-4 min-w-0">
            <div className="shrink-0 w-12 h-12 rounded-lg bg-muted grid place-items-center border border-border">
              <Building className="w-6 h-6 text-primary" />
            </div>

            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[17px] font-semibold text-foreground leading-snug break-words line-clamp-3">
                  {org.name}
                </h3>

                <Badge
                  variant={org.status === "Active" && !org.isStopped ? "default" : "outline"}
                  className="h-5 px-1.5 text-[10px]"
                >
                  <StatusDot ok={org.status === "Active" && !org.isStopped} />
                  <span className="ml-1">{org.status}</span>
                </Badge>

                <Badge variant="secondary" className="h-5 px-1.5 text-[10px]">
                  <RoleIcon role="admin" />
                  <span className="ml-1">admin</span>
                </Badge>

                <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                  {org.plan || "Free"}
                </Badge>

                <Badge variant="outline" className="h-5 px-1.5 text-[10px]">
                  {org.publicVisibility ? "Public" : "Private"}
                </Badge>
              </div>

              {/* ID row */}
              <div className="mt-2 flex items-center gap-2 text-[11px] text-muted-foreground">
                <Cpu className="w-3.5 h-3.5 shrink-0" />
                <code className="font-mono truncate max-w-[320px] sm:max-w-[380px]">{idShort}</code>

                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(org.id);
                          toast.success("Canister ID copied");
                        }}
                        className="opacity-70 hover:opacity-100 transition-opacity"
                        aria-label="Copy canister id"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">Copy ID</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>

          {/* Quick metrics (right column) */}
          <div className="flex lg:flex-col flex-wrap items-start lg:items-end gap-2 text-xs text-muted-foreground">
            {org.cycles && (
              <div className="flex items-center gap-1.5">
                <Coins className="w-3.5 h-3.5" />
                <span className="truncate max-w-[220px]">{org.cycles} cycles</span>
              </div>
            )}
            {org.users && (
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                <span className="truncate max-w-[220px]">{org.users} users</span>
              </div>
            )}
            {org.txCount && (
              <div className="flex items-center gap-1.5">
                <Star className="w-3.5 h-3.5" />
                <span className="truncate max-w-[220px]">{org.txCount} tx</span>
              </div>
            )}
          </div>
        </div>

        {/* Metrics row (chips) */}
        <div className="flex flex-wrap gap-2 sm:gap-3">
          {org.cycles && <Metric icon={Coins} label={`${org.cycles} cycles`} />}
          {org.users && <Metric icon={Users} label={`${org.users} users`} />}
          {org.txCount && <Metric icon={Star} label={`${org.txCount} tx`} />}
        </div>

        {/* Actions — auto-fit wide buttons, never wrap text */}
        <div className="grid [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))] gap-3">
          <Button
            size="lg"
            onClick={onManage}
            className="w-full min-h-11 whitespace-nowrap leading-none justify-center"
          >
            <Settings className="w-4 h-4 mr-2 shrink-0" />
            Manage
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={onTopUp}
            className="w-full min-h-11 whitespace-nowrap leading-none justify-center"
          >
            <Coins className="w-4 h-4 mr-2 shrink-0" />
            Top Up
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={onTogglePower}
            className="w-full min-h-11 whitespace-nowrap leading-none justify-center"
          >
            <Power className="w-4 h-4 mr-2 shrink-0" />
            {org.isStopped || org.status === "Archived" ? "Start" : "Stop"}
          </Button>

          <Button
            size="lg"
            variant="outline"
            onClick={onEdit}
            className="w-full min-h-11 whitespace-nowrap leading-none justify-center"
          >
            <Pencil className="w-4 h-4 mr-2 shrink-0" />
            Edit
          </Button>

          <Button
            size="lg"
            variant="destructive"
            onClick={onDelete}
            className="w-full min-h-11 whitespace-nowrap leading-none justify-center"
          >
            <Trash2 className="w-4 h-4 mr-2 shrink-0" />
            Delete
          </Button>
        </div>
      </div>
    </Card>
  );
};

// ---------------- Card (Public) ----------------
const PublicCard = ({ org, onJoin }: { org: OrgRecord; onJoin: () => void }) => {
  const idShort = `${org.id.slice(0, 10)}…${org.id.slice(-6)}`;

  return (
    <Card className="relative overflow-hidden rounded-xl border border-border bg-card shadow-sm hover:shadow-md transition-shadow">
      <div className="p-6 space-y-4">
        {/* header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-12 h-12 rounded-lg bg-muted grid place-items-center border border-border">
              <Building className="w-6 h-6 text-primary" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-[15px] font-semibold text-foreground leading-tight break-words line-clamp-2">
                  {org.name}
                </h3>
                <Badge className="h-5 px-1.5 text-[10px]">Active</Badge>
                <Badge variant="outline" className="h-5 px-1.5 text-[10px]">Public</Badge>
                <Badge variant="outline" className="h-5 px-1.5 text-[10px]">{org.plan || "Free"}</Badge>
              </div>

              <div className="mt-1 flex items-center gap-2 text-[11px] text-muted-foreground">
                <Cpu className="w-3.5 h-3.5" />
                <code className="font-mono truncate max-w-[220px]">{idShort}</code>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(org.id);
                          toast.success("Canister ID copied");
                        }}
                        className="opacity-70 hover:opacity-100"
                        aria-label="Copy canister id"
                      >
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">Copy ID</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            </div>
          </div>
        </div>

        {/* actions */}
        <Button className="w-full justify-center" onClick={onJoin}>
          Join
          <ArrowRight className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </Card>
  );
};

// ---------------- Dialogs ----------------
const CreateOrgDialog = ({
  onCreateOrg,
  creating,
}: {
  onCreateOrg: (name: string, cycles: string, plan: Plan, isPublic: boolean) => Promise<void>;
  creating: boolean;
}) => {
  const [name, setName] = useState("");
  const [cycles, setCycles] = useState("0");
  const [plan, setPlan] = useState<Plan>("Free");
  const [isPublic, setIsPublic] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const handleCreate = async () => {
    if (name.trim()) {
      await onCreateOrg(name.trim(), cycles, plan, isPublic);
      setName("");
      setCycles("0");
      setPlan("Free");
      setIsPublic(true);
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Create Organization
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Organization (Factory Child)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Organization Name / Note</label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., Tech Innovators Inc." />
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Initial Cycles (nat)</label>
            <Input
              value={cycles}
              onChange={(e) => setCycles(e.target.value.replace(/[^\d]/g, ""))}
              placeholder="0"
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              Optional. Factory must have enough cycles to fund creation/top-up.
            </p>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Plan (UI only)</label>
            <Select value={plan} onValueChange={setPlan}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Free">Free</SelectItem>
                <SelectItem value="Basic">Basic</SelectItem>
                <SelectItem value="Pro">Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Public Visibility (UI only)</span>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
          <Button onClick={handleCreate} disabled={!name.trim() || creating} className="w-full">
            {creating ? "Creating..." : "Create"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const EditOrgDialog = ({
  open,
  onOpenChange,
  org,
  onSave,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  org: OrgRecord | null;
  onSave: (plan: Plan, isPublic: boolean) => void;
}) => {
  const [plan, setPlan] = useState<Plan>(org?.plan || "Free");
  const [isPublic, setIsPublic] = useState<boolean>(!!org?.publicVisibility);

  useEffect(() => {
    setPlan(org?.plan || "Free");
    setIsPublic(!!org?.publicVisibility);
  }, [org]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Organization (UI Fields)</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="text-xs text-muted-foreground">
            {org?.name} — <span className="font-mono break-all">{org?.id}</span>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Plan</label>
            <Select value={plan} onValueChange={(v) => setPlan(v as Plan)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Free">Free</SelectItem>
                <SelectItem value="Basic">Basic</SelectItem>
                <SelectItem value="Pro">Pro</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">Public Visibility</span>
            <Switch checked={isPublic} onCheckedChange={setIsPublic} />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => onSave(plan, isPublic)}>
              <Check className="w-4 h-4 mr-1" />
              Save
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

const ConfirmDialog = ({
  open,
  onOpenChange,
  title,
  message,
  onConfirm,
  confirmLabel = "Confirm",
  destructive,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title: string;
  message: string;
  onConfirm: () => void;
  confirmLabel?: string;
  destructive?: boolean;
}) => (
  <Dialog open={open} onOpenChange={onOpenChange}>
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
      </DialogHeader>
      <div className="text-sm text-muted-foreground">{message}</div>
      <div className="flex justify-end gap-2 mt-4">
        <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
        <Button onClick={onConfirm} variant={destructive ? "destructive" : "default"}>
          {confirmLabel}
        </Button>
      </div>
    </DialogContent>
  </Dialog>
);

const TopUpDialog = ({
  open,
  onOpenChange,
  target,
  onTopUp,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target: OrgRecord | null;
  onTopUp: (amount: string) => void;
}) => {
  const [amount, setAmount] = useState("0");
  useEffect(() => setAmount("0"), [open]);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Top Up Cycles</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground">
            Target: <span className="font-mono break-all">{target?.id}</span>
          </div>
          <div>
            <label className="text-sm font-medium mb-2 block">Amount (cycles, nat)</label>
            <Input value={amount} onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))} autoFocus />
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={() => onTopUp(amount)}>Top Up</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

// ---------------- Main ----------------
const OrgSelector: React.FC = () => {
  const navigate = useNavigate();
  const { isConnected, principal } = usePlugConnection({ autoCheck: true });

  // actor + wallet
  const [factoria, setFactoria] = useState<any | null>(null);
  const [principalText, setPrincipalText] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);

  // Owned + Public
  const [owned, setOwned] = useState<OrgRecord[]>([]);
  const [publicOrgs, setPublicOrgs] = useState<OrgRecord[]>([]);
  const [loadingOwned, setLoadingOwned] = useState(false);
  const [loadingPublic, setLoadingPublic] = useState(false);

  // Selection + filters (kept for your UI)
  const [selectedOrg, setSelectedOrg] = useState<OrgRecord | null>(null);
  const [filter, setFilter] = useState("all");

  // Dialog state
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<OrgRecord | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteOrg, setDeleteOrg] = useState<OrgRecord | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpOrg, setTopUpOrg] = useState<OrgRecord | null>(null);

  const MAX_CYCLES = 1_500_000_000_000n; // 1.5T
  const MIN_CYCLES = 900_000_000_000n;   // 0.9T

  useEffect(() => {
    (async () => {
      try {
        setConnecting(true);
        if (!isConnected || !principal) return;
        const actor = await makeFactoriaWithPlug({
          host: "https://icp-api.io",
          canisterId: getFactoriaCanisterId(),
        });
        setFactoria(actor);
        setPrincipalText(principal.toString());
      } catch (e: any) {
        toast.error(e?.message || "Failed to connect Plug / Factoria.");
      } finally {
        setConnecting(false);
      }
    })();
  }, [isConnected, principal]);

  const fetchOwned = async () => {
    if (!factoria || !principalText) return;
    setLoadingOwned(true);
    try {
      const owner = Principal.fromText(principalText);
      const children: Principal[] = await factoria.listByOwner(owner);

      const rows: OrgRecord[] = [];
      for (const child of children) {
        const childIdText = child.toText();
        const c = await factoria.getChild(child);
        if (!Array.isArray(c) || !c.length) continue;
        const rec = c[0];

        let users, cycles, txCount, paused;
        let isStopped = false;
        try {
          const h = await factoria.childHealth(child);
          if (Array.isArray(h) && h.length) {
            users = natToStr(h[0].users);
            cycles = natToStr(h[0].cycles);
            txCount = natToStr(h[0].txCount);
            paused = Boolean(h[0].paused);
          } else {
            isStopped = true;
          }
        } catch {
          isStopped = true;
        }

        rows.push({
          id: childIdText,
          name: rec.note?.trim?.() ? rec.note : childIdText,
          canisterId: childIdText,
          status: toStatus(rec.status),
          createdAt: Number(rec.created_at || 0),
          users,
          cycles,
          txCount,
          paused,
          plan: "Free",
          publicVisibility: true,
          isStopped,
        });
      }
      setOwned(rows);
    } catch (e: any) {
      toast.error(e?.message || "Failed to fetch owned organizations.");
    } finally {
      setLoadingOwned(false);
    }
  };

  const fetchPublic = async () => {
    if (!factoria) return;
    setLoadingPublic(true);
    try {
      const all = await factoria.listChildren();
      const mine = new Set(owned.map((o) => o.id));

      const rows: OrgRecord[] = [];
      for (const rec of all as any[]) {
        const idText =
          typeof rec.id?.toText === "function" ? rec.id.toText() : String(rec.id);
        const status = toStatus(rec.status);
        if (status !== "Active") continue;
        if (mine.has(idText)) continue;

        rows.push({
          id: idText,
          name: rec.note?.trim?.() ? rec.note : idText,
          canisterId: idText,
          status,
          createdAt: Number(rec.created_at || 0),
          publicVisibility: true,
          plan: "Free",
          isStopped: false,
        });
      }
      setPublicOrgs(rows);
    } catch (e: any) {
      toast.error(e?.message || "Failed to fetch public organizations.");
    } finally {
      setLoadingPublic(false);
    }
  };

  useEffect(() => {
    fetchOwned();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factoria, principalText]);

  useEffect(() => {
    fetchPublic();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [factoria, owned.length]);

  const togglePower = async (o: OrgRecord) => {
    if (!factoria) return;
    try {
      const id = Principal.fromText(o.canisterId);
      if (o.isStopped || o.status === "Archived") {
        await factoria.startChild(id);
        toast.success("Canister started.");
      } else {
        await factoria.stopChild(id);
        toast.success("Canister stopped.");
      }
      await fetchOwned();
    } catch (e: any) {
      toast.error(e?.message || "Toggle failed.");
    }
  };

  const handleCreateOrg = async (name: string, cyclesStr: string, _plan: Plan, _isPublic: boolean) => {
    if (!factoria || !principalText) return;
    try {
      const owner = Principal.fromText(principalText);
      const cycles = BigInt(cyclesStr || "0");

      if (cycles > 1_500_000_000_000n) {
        toast.error("Only canisters ≤ 1.5T cycles can be created.");
        return;
      } else if (cycles < 900_000_000_000n) {
        toast.error("Need at least more than 0.9T cycles.");
        return;
      }

      const controllers: Principal[] = [];
      const newId = await factoria.createOrReuseChildFor(owner, cycles, controllers, name.trim());
      toast.success(`Organization created: ${newId.toText()}`);
      setCreateOpen(false);
      await fetchOwned();
      await fetchPublic();
    } catch (e: any) {
      toast.error(e?.message || "Create failed.");
    }
  };

  const handleSaveEdit = (plan: Plan, isPublic: boolean) => {
    if (!editOrg) return;
    setOwned((prev) =>
      prev.map((o) => (o.id === editOrg.id ? { ...o, plan, publicVisibility: isPublic } : o))
    );
    toast.success(`Saved local settings for ${editOrg.name}.`);
    setEditOpen(false);
    setEditOrg(null);
  };

  const handleConfirmDelete = async () => {
    if (!factoria || !deleteOrg) return;
    try {
      const id = Principal.fromText(deleteOrg.canisterId);
      try {
        await factoria.archiveChild(id);
      } catch {
        await factoria.deleteChild(id);
      }
      toast.success(`Removed ${deleteOrg.name}.`);
      setDeleteOpen(false);
      setDeleteOrg(null);
      await fetchOwned();
      await fetchPublic();
    } catch (e: any) {
      toast.error(e?.message || "Delete failed.");
    }
  };

  const handleTopUp = async (amount: string) => {
    if (!factoria || !topUpOrg) return;
    try {
      const amt = BigInt(amount || "0");
      const res = await factoria.topUpChild(Principal.fromText(topUpOrg.canisterId), amt);
      if ("ok" in res) toast.success(`Top up OK: +${res.ok.toString()} cycles`);
      else toast.error(res.err);
      setTopUpOpen(false);
      setTopUpOrg(null);
      await fetchOwned();
    } catch (e: any) {
      toast.error(e?.message || "Top up failed.");
    }
  };

  const handleContinue = () => {
    if (!selectedOrg) return;
    localStorage.setItem("selectedOrgId", selectedOrg.id);
    localStorage.setItem("selectedOrgName", selectedOrg.name);
    navigate(`/dashboard/home/${selectedOrg.id}`);
  };

  const combined = useMemo(() => [...owned, ...publicOrgs], [owned, publicOrgs]);
  const filtered = combined.filter(
    (org) =>
      filter === "all" ||
      (filter === "admin" && owned.find((o) => o.id === org.id)) ||
      (filter === "member" && publicOrgs.find((p) => p.id === org.id)) ||
      (filter === "owned" && owned.find((o) => o.id === org.id))
  );

  if (connecting) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="inline-flex items-center gap-2 text-muted-foreground">
          <div className="w-5 h-5 border-2 border-primary border-r-transparent rounded-full animate-spin" />
          Connecting wallet…
        </div>
      </div>
    );
  }

  if (!principalText) {
    return (
      <div className="min-h-screen grid place-items-center px-6">
        <Card className="max-w-md w-full p-6">
          <h2 className="text-xl font-bold text-foreground mb-1">Connect Your Wallet</h2>
          <p className="text-sm text-muted-foreground mb-4">
            Please connect your Plug wallet to manage organizations.
          </p>
          <Button onClick={() => window.open("https://plugwallet.ooo/", "_blank")}>
            Install Plug
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Solid Header */}
      <div className="fixed top-0 left-0 right-0 z-50 bg-background border-b border-border mt-16">
        <div className="max-w-6xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-muted grid place-items-center border border-border">
                <Building className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-foreground">Organization Manager</h1>
                <p className="text-sm text-muted-foreground">Create, manage, or join organizations</p>
              </div>
            </div>
            <WalletDisplay />
          </div>
        </div>
      </div>

      <div className="relative pt-32">
        <div className="max-w-6xl mx-auto px-6 py-10">
          {/* Top actions row */}
          <div className="flex flex-col sm:flex-row gap-4 mb-10 justify-between items-start sm:items-center">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-muted-foreground" />
                <Select value={filter} onValueChange={setFilter}>
                  <SelectTrigger className="w-36">
                    <SelectValue placeholder="Filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="member">Member</SelectItem>
                    <SelectItem value="owned">Owned</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Badge variant="outline" className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {filtered.length} organizations
              </Badge>
            </div>

            <div className="flex items-center gap-3">
              <CreateOrgDialog
                onCreateOrg={async (name, cycles, plan, isPublic) => {
                  await handleCreateOrg(name, cycles, plan, isPublic);
                }}
                creating={false}
              />
            </div>
          </div>

          {/* OWNED SECTION */}
          <div className="mb-12">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Your Organizations</h2>
              {!!owned.length && (
                <span className="text-xs text-muted-foreground">{owned.length} total</span>
              )}
            </div>
            {loadingOwned ? (
              <div className="text-center py-10 text-muted-foreground">
                <div className="inline-flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-r-transparent rounded-full animate-spin" />
                  Loading your organizations…
                </div>
              </div>
            ) : owned.length ? (
              <div className="grid grid-cols-1 gap-6">
                {owned.map((o) => (
                  <OwnedCard
                    key={o.id}
                    org={o}
                    onManage={() => navigate(`/dashboard/home/${o.canisterId}`)}
                    onTopUp={() => {
                      setTopUpOrg(o);
                      setTopUpOpen(true);
                    }}
                    onTogglePower={() => togglePower(o)}
                    onEdit={() => {
                      setEditOrg(o);
                      setEditOpen(true);
                    }}
                    onDelete={() => {
                      setDeleteOrg(o);
                      setDeleteOpen(true);
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No organizations found.</p>
            )}
          </div>

          {/* PUBLIC SECTION */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold">Public Organizations</h2>
              {!!publicOrgs.length && (
                <span className="text-xs text-muted-foreground">{publicOrgs.length} available</span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-4">
              Browse active organizations. Click <span className="font-semibold">Join</span> to go to its dashboard.
            </p>
            {loadingPublic ? (
              <div className="text-center py-10 text-muted-foreground">
                <div className="inline-flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-r-transparent rounded-full animate-spin" />
                  Loading public organizations…
                </div>
              </div>
            ) : publicOrgs.length ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {publicOrgs.map((o) => (
                  <PublicCard
                    key={o.id}
                    org={o}
                    onJoin={() => {
                      localStorage.setItem("selectedOrgId", o.canisterId);
                      navigate(`/dashboard/home/${o.canisterId}`);
                    }}
                  />
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No public organizations available right now.</p>
            )}
          </div>

          {/* CONTINUE (optional old flow) */}
          {selectedOrg && (
            <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
              <Button
                onClick={handleContinue}
                size="lg"
                className="shadow-lg hover:shadow-xl transition-all duration-300 px-8"
              >
                Continue to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Dialogs */}
      <EditOrgDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        org={editOrg}
        onSave={handleSaveEdit}
      />
      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Remove Organization"
        message={`Are you sure you want to remove ${deleteOrg?.name || deleteOrg?.id}? We will try to archive first, then delete.`}
        onConfirm={handleConfirmDelete}
        confirmLabel="Remove"
        destructive
      />
      <TopUpDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        target={topUpOrg}
        onTopUp={handleTopUp}
      />
    </div>
  );
};

export default OrgSelector;
