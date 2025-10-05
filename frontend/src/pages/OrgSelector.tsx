// OrgSelector.tsx — shadcn UI + full ReputationFactory logic (Owned + Public) with uniform solid design

import React, { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
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
import { makeFactoriaWithPlug, getFactoriaCanisterId } from "@/lib/canisters";
import type {
  Child as FactoryChild,
  _SERVICE as FactoriaActor,
} from "@/declarations/factoria/factoria.did";

// ---------------- Types ----------------
type Plan = "Free" | "Basic" | "Pro";
type OrgStatus = "Active" | "Archived";
type FilterOption = "all" | "admin" | "member" | "owned";

type OrgRecord = {
  id: string;
  name: string;
  canisterId: string;
  plan?: Plan;
  status: OrgStatus;
  publicVisibility?: boolean;
  createdAt?: number;
  users?: string;
  cycles?: string;
  txCount?: string;
  paused?: boolean;
  isStopped?: boolean;
};

const toStatus = (statusVariant: FactoryChild["status"]): OrgStatus =>
  "Archived" in statusVariant ? "Archived" : "Active";

const natToStr = (n?: bigint) =>
  typeof n === "bigint" ? n.toString() : undefined;

// ---------------- Wallet Badge ----------------
const WalletDisplay = () => {
  const { isConnected, principal } = usePlugConnection({ autoCheck: true });
  if (!isConnected || !principal) return null;

  const principalStr = principal;
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
    navigator.clipboard.writeText(principalStr).catch(() => {
      toast.error("Failed to copy principal");
    });
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
const Metric = ({ icon: Icon, label }: { icon: LucideIcon; label: ReactNode }) => (
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
const OwnedCard: React.FC<{
  org: OrgRecord;
  onManage: () => void;
  onTopUp: () => void;
  onTogglePower: () => void;
  onEdit: () => void;
  onDelete: () => void;
}> = ({ org, onManage, onTopUp, onTogglePower, onEdit, onDelete }) => {
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
                          navigator.clipboard
                            .writeText(org.id)
                            .then(() => toast.success("Canister ID copied"))
                            .catch(() => toast.error("Failed to copy canister ID"));
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
                          navigator.clipboard
                            .writeText(org.id)
                            .then(() => toast.success("Canister ID copied"))
                            .catch(() => toast.error("Failed to copy canister ID"));
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
const CreateOrgDialog: React.FC<{
  onCreateOrg: (name: string, cycles: string, plan: Plan, isPublic: boolean) => Promise<void>;
  creating: boolean;
}> = ({ onCreateOrg, creating }) => {
  const [name, setName] = useState("");
  const [cycles, setCycles] = useState("0");
  const [plan, setPlan] = useState<Plan>("Free");
  const [isPublic, setIsPublic] = useState(true);
  const [isOpen, setIsOpen] = useState(false);

  const handleCreate = async () => {
    if (!name.trim()) {
      toast.error("Organization name is required");
      return;
    }

    try {
      await onCreateOrg(name.trim(), cycles, plan, isPublic);
      setName("");
      setCycles("0");
      setPlan("Free");
      setIsPublic(true);
      setIsOpen(false);
    } catch (error) {
      console.error("Create organization failed", error);
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
            <Select value={plan} onValueChange={(value) => setPlan(value as Plan)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Free">Free</SelectItem>
                <SelectItem value="Basic">Basic</SelectItem>
                <SelectItem value="Pro">Pro</SelectItem>
              </SelectContent>
            </Select>
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
  onConfirm: () => Promise<void> | void;
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
        <Button onClick={() => void onConfirm()} variant={destructive ? "destructive" : "default"}>
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
  onTopUp: (amount: string) => Promise<void>;
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
            <Button onClick={() => void onTopUp(amount)}>Top Up</Button>
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
  const [factoria, setFactoria] = useState<FactoriaActor | null>(null);
  const [principalText, setPrincipalText] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(true);
  const [creatingOrg, setCreatingOrg] = useState(false);

  // Owned + Public
  const [owned, setOwned] = useState<OrgRecord[]>([]);
  const [publicOrgs, setPublicOrgs] = useState<OrgRecord[]>([]);
  const [loadingOwned, setLoadingOwned] = useState(false);
  const [loadingPublic, setLoadingPublic] = useState(false);

  // Selection + filters (kept for your UI)
  const [filter, setFilter] = useState<FilterOption>("all");

  // Dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<OrgRecord | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteOrg, setDeleteOrg] = useState<OrgRecord | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpOrg, setTopUpOrg] = useState<OrgRecord | null>(null);

  const MAX_CYCLES = 1_500_000_000_000n; // 1.5T
  const MIN_CYCLES = 900_000_000_000n;   // 0.9T

  useEffect(() => {
    let cancelled = false;

    const connect = async () => {
      setConnecting(true);

      if (!isConnected || !principal) {
        if (!cancelled) {
          setFactoria(null);
          setPrincipalText(null);
          setConnecting(false);
        }
        return;
      }

      try {
        const actor = await makeFactoriaWithPlug({
          canisterId: getFactoriaCanisterId(),
        });

        if (!cancelled) {
          setFactoria(actor);
          setPrincipalText(principal);
        }
      } catch (error) {
        if (!cancelled) {
          const message = error instanceof Error ? error.message : "Failed to connect Plug / Factoria.";
          toast.error(message);
          setFactoria(null);
        }
      } finally {
        if (!cancelled) {
          setConnecting(false);
        }
      }
    };

    void connect();

    return () => {
      cancelled = true;
    };
  }, [isConnected, principal]);

  const fetchOwned = async () => {
  if (!factoria || !principalText) return;
  setLoadingOwned(true);
  try {
    const owner = Principal.fromText(principalText);
    const childIds = await factoria.listByOwner(owner); // [Principal]

    // 1) getChild for all IDs concurrently
    const childRecords = await Promise.all(
      childIds.map(async (pid) => {
        const recOpt = await factoria.getChild(pid);
        return recOpt.length ? { pid, rec: recOpt[0] } : null;
      })
    );

    // 2) health only for Active children (concurrent)
    const healthResults = await Promise.all(
      childRecords.map(async (entry) => {
        if (!entry) return null;
        const { pid, rec } = entry;
        const status = toStatus(rec.status);
        if (status !== "Active") return { id: pid.toText(), health: null, isStopped: true };
        try {
          const hOpt = await factoria.childHealth(pid);
          return hOpt.length
            ? { id: pid.toText(), health: hOpt[0], isStopped: false }
            : { id: pid.toText(), health: null, isStopped: true };
        } catch {
          return { id: pid.toText(), health: null, isStopped: true };
        }
      })
    );

    const healthMap = new Map(healthResults.filter(Boolean).map(h => [h!.id, h!]));

    const rows: OrgRecord[] = childRecords
      .filter((e): e is { pid: Principal; rec: FactoryChild } => !!e)
      .map(({ pid, rec }) => {
        const id = pid.toText();
        const status = toStatus(rec.status);

        const hv = healthMap.get(id);
        const users  = hv?.health ? hv.health.users.toString()  : undefined;
        const cycles = hv?.health ? hv.health.cycles.toString() : undefined;
        const tx     = hv?.health ? hv.health.txCount.toString(): undefined;
        const paused = hv?.health ? hv.health.paused : undefined;
        const isStopped = hv?.isStopped ?? (status !== "Active");

        return {
          id,
          name: rec.note?.trim() ? rec.note : id,
          canisterId: id,
          status,
          createdAt: Number(rec.created_at ?? 0n),
          users,
          cycles,
          txCount: tx,
          paused,
          plan: "Free",
          publicVisibility: "Public" in rec.visibility, // reflect backend
          isStopped,
        } satisfies OrgRecord;
      });

    setOwned(rows);
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : "Failed to fetch owned organizations.");
  } finally {
    setLoadingOwned(false);
  }
};

const fetchPublic = async () => {
  if (!factoria) return;
  setLoadingPublic(true);
  try {
    const allChildren = await factoria.listChildren(); // [Child]
    const mine = new Set(owned.map((o) => o.id));

    const rows: OrgRecord[] = allChildren
      .map((child): OrgRecord | null => {
        const idText = child.id.toText();
        const status = toStatus(child.status);
        const isPublic = "Public" in child.visibility;

        // Only Active + Public, and not mine
        if (status !== "Active" || !isPublic || mine.has(idText)) return null;

        return {
          id: idText,
          name: child.note?.trim() ? child.note : idText,
          canisterId: idText,
          status,
          createdAt: Number(child.created_at ?? 0n),
          publicVisibility: true,
          plan: "Free",
          isStopped: false, // not checking health here (faster)
        };
      })
      .filter((org): org is OrgRecord => org !== null);

    setPublicOrgs(rows);
  } catch (e: unknown) {
    toast.error(e instanceof Error ? e.message : "Failed to fetch public organizations.");
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
    if (!factoria || !principalText) {
      toast.error("Connect your wallet before creating an organization.");
      throw new Error("Missing Factoria actor or principal");
    }

    setCreatingOrg(true);
    try {
      const owner = Principal.fromText(principalText);
      const cycles = BigInt(cyclesStr || "0");

      if (cycles > MAX_CYCLES) {
        toast.error("Only canisters ≤ 1.5T cycles can be created.");
        throw new Error("Cycles above maximum threshold");
      }
      if (cycles < MIN_CYCLES) {
        toast.error("Need at least more than 0.9T cycles.");
        throw new Error("Cycles below minimum threshold");
      }

      const controllers: Principal[] = [];
      const newId = await factoria.createOrReuseChildFor(owner, cycles, controllers, name.trim());
      toast.success(`Organization created: ${newId.toText()}`);
      await fetchOwned();
      await fetchPublic();
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      if (!err.message.includes("threshold")) {
        const message = err.message || "Create failed.";
        toast.error(message);
      }
      throw err;
    } finally {
      setCreatingOrg(false);
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
        toast.error("canister already deleted")
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
      if (amt <= 0n) {
        toast.error("Enter a positive cycle amount");
        return;
      }
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
                <Select value={filter} onValueChange={(value) => setFilter(value as FilterOption)}>
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
                onCreateOrg={handleCreateOrg}
                creating={creatingOrg}
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
