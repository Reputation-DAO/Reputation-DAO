// OrgSelector.tsx - shadcn UI + full ReputationFactory logic (Owned + Public) with uniform solid design

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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

// icons
import {
  Building,
  Users,
  Star,
  Crown,
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
  Sparkles,
  Globe,
  RefreshCw,
  LayoutGrid,
  List,
  Search,
  ShieldAlert,
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

const MAX_FACTORY_CYCLES = 1_500_000_000_000n; // 1.5T
const MIN_FACTORY_CYCLES = 900_000_000_000n; // 0.9T

const toStatus = (statusVariant: FactoryChild["status"]): OrgStatus =>
  "Archived" in statusVariant ? "Archived" : "Active";

const parseCycles = (value?: string | bigint) => {
  try {
    if (typeof value === "bigint") return value;
    if (!value) return 0n;
    return BigInt(value);
  } catch {
    return 0n;
  }
};

const compactNumber = new Intl.NumberFormat("en-US", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const decimalNumber = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
});

const formatCycles = (value?: string | bigint) => {
  const cycles = parseCycles(value);
  if (cycles === 0n) return "-";

  const thresholds: Array<{ value: bigint; label: string }> = [
    { value: 1_000_000_000_000_000_000n, label: "E" },
    { value: 1_000_000_000_000_000n, label: "P" },
    { value: 1_000_000_000_000n, label: "T" },
    { value: 1_000_000_000n, label: "B" },
    { value: 1_000_000n, label: "M" },
    { value: 1_000n, label: "K" },
  ];

  for (const { value: threshold, label } of thresholds) {
    if (cycles >= threshold) {
      const pretty = Number(cycles) / Number(threshold);
      return `${decimalNumber.format(pretty)} ${label}`;
    }
  }

  return Number(cycles).toLocaleString();
};

const formatNumericString = (value?: string) => {
  if (!value) return "-";
  const num = Number(value);
  if (!Number.isFinite(num)) return value;
  return compactNumber.format(num);
};

const normalizeTimestamp = (value?: number) => {
  if (!value) return null;
  if (value > 1e15) return Math.floor(value / 1_000_000); // ns -> ms
  if (value > 1e12) return Math.floor(value / 1_000); // us -> ms
  if (value > 1e11) return Math.floor(value); // already ms
  return value * 1000; // assume seconds
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

const formatTimestamp = (value?: number) => {
  const normalized = normalizeTimestamp(value);
  if (!normalized) return null;
  return dateFormatter.format(new Date(normalized));
};

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
  const idShort = `${org.id.slice(0, 6)}...${org.id.slice(-6)}`;
  const cycles = parseCycles(org.cycles);
  const cyclePercent = cycles > 0n ? Math.min(100, Number((cycles * 100n) / MAX_FACTORY_CYCLES)) : 0;
  const cycleLabel = formatCycles(org.cycles);
  const userLabel = formatNumericString(org.users);
  const txLabel = formatNumericString(org.txCount);
  const createdLabel = formatTimestamp(org.createdAt);
  const isArchived = org.status === "Archived";
  const isStopped = Boolean(org.isStopped);
  const paused = Boolean(org.paused);
  const lowReserve = cycles > 0n && cycles < MIN_FACTORY_CYCLES;
  const statusLabel = isArchived ? "Archived" : isStopped ? "Stopped" : "Active";
  const statusClasses = cn(
    "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-wide",
    isArchived && "border-slate-700/80 bg-slate-900/80 text-slate-300",
    !isArchived && isStopped && "border-amber-500/50 bg-amber-500/10 text-amber-200",
    !isArchived && !isStopped && "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
  );

  return (
    <Card className="group relative overflow-hidden border border-slate-800/70 bg-slate-950/80 shadow-[0_20px_45px_-28px_rgba(15,23,42,0.9)] transition-all duration-500 hover:-translate-y-1 hover:border-primary/60 hover:shadow-[0_35px_65px_-35px_rgba(14,165,233,0.45)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(120% 120% at 0% 0%, rgba(14,165,233,0.18), transparent 60%)",
        }}
      />
      <div className="relative space-y-6 p-6">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/30 backdrop-blur-sm">
              <Building className="h-6 w-6" />
            </div>
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-lg font-semibold tracking-tight text-foreground md:text-xl">
                  {org.name}
                </h3>
                <span className={statusClasses}>
                  <StatusDot ok={!isArchived && !isStopped} />
                  {statusLabel}
                </span>
                <Badge
                  variant="outline"
                  className={cn(
                    "border-slate-700/80 bg-slate-900/60 text-[11px]",
                    org.publicVisibility
                      ? "border-emerald-500/40 text-emerald-200"
                      : "border-slate-700/80 text-slate-300"
                  )}
                >
                  {org.publicVisibility ? "Public" : "Private"}
                </Badge>
                {org.plan && (
                  <Badge
                    variant="outline"
                    className="border-slate-700/80 bg-slate-900/60 text-[11px] uppercase tracking-wide"
                  >
                    {org.plan}
                  </Badge>
                )}
                {paused && (
                  <Badge
                    variant="outline"
                    className="border-amber-400/40 bg-amber-500/10 text-[11px] text-amber-200"
                  >
                    Paused
                  </Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[12px] text-muted-foreground/80">
                <span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wide text-muted-foreground/70">
                  <Cpu className="h-3.5 w-3.5" />
                  {idShort}
                </span>
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 rounded-full border border-transparent text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                        onClick={() => {
                          navigator.clipboard
                            .writeText(org.id)
                            .then(() => toast.success("Canister ID copied"))
                            .catch(() => toast.error("Failed to copy canister ID"));
                        }}
                        aria-label="Copy canister id"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">Copy canister ID</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
                {createdLabel && (
                  <span className="inline-flex items-center gap-1 text-muted-foreground/70">
                    <Sparkles className="h-3.5 w-3.5 text-primary/80" />
                    {createdLabel}
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant="outline"
              className="inline-flex items-center gap-1 border-amber-500/30 bg-amber-500/10 text-[11px] uppercase tracking-wide text-amber-200"
            >
              <Crown className="h-3.5 w-3.5" />
              Owner
            </Badge>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
              Cycle Reserve
            </div>
            <div className="mt-2 flex items-baseline gap-1 text-2xl font-semibold text-foreground">
              {cycleLabel}
              <span className="text-xs font-medium uppercase text-muted-foreground">cycles</span>
            </div>
            <div className="mt-4 space-y-2">
              <Progress value={cyclePercent} className="h-1.5 bg-slate-800/90" />
              {lowReserve && (
                <div className="inline-flex items-center gap-1 rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-200">
                  <ShieldAlert className="h-3.5 w-3.5" />
                  Low reserve - top up recommended
                </div>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
              Members
            </div>
            <div className="mt-2 flex items-baseline gap-2 text-2xl font-semibold text-foreground">
              {userLabel}
              <Users className="h-4 w-4 text-primary/70" />
            </div>
            <p className="mt-3 text-[12px] text-muted-foreground/80">
              Active identities connected to this organization.
            </p>
          </div>

          <div className="rounded-xl border border-slate-800/80 bg-slate-900/60 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground/70">
              Transactions
            </div>
            <div className="mt-2 flex items-baseline gap-2 text-2xl font-semibold text-foreground">
              {txLabel}
              <Star className="h-4 w-4 text-primary/70" />
            </div>
            <p className="mt-3 text-[12px] text-muted-foreground/80">
              Reputation and governance activity processed by the canister.
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <Button
            size="lg"
            onClick={onManage}
            className="h-11 min-w-[180px] rounded-xl bg-primary text-primary-foreground shadow-[0_18px_25px_-18px_rgba(14,165,233,0.65)] transition-transform hover:-translate-y-[1px]"
          >
            <Settings className="mr-2 h-4 w-4" />
            Open Workspace
          </Button>

          <div className="flex flex-wrap items-center gap-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full border-slate-800/70 bg-slate-950/60 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                    onClick={onTopUp}
                  >
                    <Coins className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Top up cycles</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full border-slate-800/70 bg-slate-950/60 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                    onClick={onTogglePower}
                  >
                    <Power className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">
                  {isStopped || isArchived ? "Start canister" : "Stop canister"}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full border-slate-800/70 bg-slate-950/60 text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                    onClick={onEdit}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Edit display settings</TooltipContent>
              </Tooltip>
            </TooltipProvider>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    className="h-10 w-10 rounded-full border-rose-500/30 bg-rose-500/10 text-rose-200 transition-colors hover:border-rose-400 hover:bg-rose-500/20 hover:text-rose-50"
                    onClick={onDelete}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent className="text-xs">Archive or remove</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        </div>
      </div>
    </Card>
  );
};

// ---------------- Card (Public) ----------------
const PublicCard = ({ org, onJoin }: { org: OrgRecord; onJoin: () => void }) => {
  const idShort = `${org.id.slice(0, 6)}...${org.id.slice(-6)}`;
  const cycleLabel = formatCycles(org.cycles);
  const userLabel = formatNumericString(org.users);
  const planLabel = org.plan || "Free";

  return (
    <Card className="group relative overflow-hidden border border-slate-800/60 bg-slate-950/60 backdrop-blur transition-all duration-500 hover:-translate-y-1 hover:border-primary/50 hover:shadow-[0_28px_45px_-32px_rgba(14,165,233,0.6)]">
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(100% 120% at 100% 0%, rgba(59,130,246,0.15), transparent 65%)",
        }}
      />
      <div className="relative space-y-5 p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/30">
                <Building className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-foreground md:text-base">{org.name}</h3>
                <p className="text-xs text-muted-foreground/75">
                  Open reputation workspace - {planLabel} plan
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-3 text-[12px] text-muted-foreground/70">
              <span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wide">
                <Cpu className="h-3.5 w-3.5" />
                {idShort}
              </span>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 rounded-full border border-transparent text-muted-foreground transition-all hover:border-primary/30 hover:bg-primary/10 hover:text-primary"
                      onClick={() => {
                        navigator.clipboard
                          .writeText(org.id)
                          .then(() => toast.success("Canister ID copied"))
                          .catch(() => toast.error("Failed to copy canister ID"));
                      }}
                      aria-label="Copy canister id"
                    >
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent className="text-xs">Copy canister ID</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge
              variant="outline"
              className="border-primary/40 bg-primary/10 text-[11px] uppercase tracking-wide text-primary"
            >
              Public
            </Badge>
            <Badge
              variant="outline"
              className="border-slate-700/70 bg-slate-900/70 text-[11px] uppercase tracking-wide text-slate-300"
            >
              {planLabel}
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-sm text-muted-foreground/80">
          <div className="rounded-lg border border-slate-800/70 bg-slate-900/60 px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">Members</div>
            <div className="mt-1 text-lg font-semibold text-foreground">{userLabel}</div>
          </div>
          <div className="rounded-lg border border-slate-800/70 bg-slate-900/60 px-3 py-2">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em]">Cycles</div>
            <div className="mt-1 text-lg font-semibold text-foreground">{cycleLabel}</div>
          </div>
        </div>

        <Button
          className="h-11 w-full rounded-xl bg-gradient-to-r from-primary/90 via-primary to-primary/90 text-primary-foreground shadow-[0_18px_30px_-22px_rgba(59,130,246,0.65)] transition-transform hover:-translate-y-[1px]"
          onClick={onJoin}
        >
          Enter workspace
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  hint,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "accent";
}) => (
  <Card
    className={cn(
      "relative overflow-hidden border border-slate-800/70 bg-slate-950/70 p-5 shadow-[0_18px_35px_-28px_rgba(15,23,42,0.8)] transition-all duration-500 hover:-translate-y-[1px]",
      tone === "accent" && "border-primary/50 bg-primary/10 hover:border-primary/70"
    )}
  >
    <div className="flex items-center justify-between gap-6">
      <div>
        <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
          {label}
        </span>
        <div className="mt-3 text-2xl font-semibold text-foreground">{value}</div>
        {hint && <p className="mt-2 text-xs text-muted-foreground/80">{hint}</p>}
      </div>
      <div
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-xl border border-slate-800/80 bg-slate-900/70 text-muted-foreground",
          tone === "accent" && "border-primary/50 bg-primary/20 text-primary"
        )}
      >
        <Icon className="h-5 w-5" />
      </div>
    </div>
  </Card>
);

const LoadingCards = ({
  count = 3,
  variant = "owned",
}: {
  count?: number;
  variant?: "owned" | "compact";
}) => (
  <div
    className={cn(
      "grid gap-6",
      variant === "compact" ? "grid-cols-1 md:grid-cols-2 xl:grid-cols-3" : "grid-cols-1"
    )}
  >
    {Array.from({ length: count }).map((_, idx) => (
      <Card
        key={idx}
        className="border border-slate-800/70 bg-slate-950/70 p-6 shadow-[0_18px_35px_-28px_rgba(15,23,42,0.8)]"
      >
        <div className="space-y-5">
          <div className="flex items-start gap-3">
            <Skeleton className="h-12 w-12 rounded-xl bg-slate-800/70" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3 bg-slate-800/70" />
              <Skeleton className="h-3 w-1/2 bg-slate-800/60" />
            </div>
          </div>
          <Skeleton className="h-24 w-full rounded-xl bg-slate-800/60" />
          <div className="grid grid-cols-3 gap-3">
            <Skeleton className="h-14 rounded-lg bg-slate-800/60" />
            <Skeleton className="h-14 rounded-lg bg-slate-800/60" />
            <Skeleton className="h-14 rounded-lg bg-slate-800/60" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg bg-slate-800/60" />
        </div>
      </Card>
    ))}
  </div>
);

const EmptyState = ({
  title,
  description,
  action,
  icon: Icon = Sparkles,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: LucideIcon;
}) => (
  <Card className="border border-slate-800/70 bg-slate-950/70 p-12 text-center shadow-[0_22px_48px_-30px_rgba(15,23,42,0.85)]">
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-slate-800/70 bg-slate-900/70 text-muted-foreground">
      <Icon className="h-7 w-7" />
    </div>
    <h3 className="mt-6 text-xl font-semibold text-foreground">{title}</h3>
    <p className="mt-3 text-sm text-muted-foreground/80">{description}</p>
    {action && <div className="mt-6 flex justify-center">{action}</div>}
  </Card>
);

// ---------------- Dialogs ----------------
const CreateOrgDialog: React.FC<{
  onCreateOrg: (name: string, cycles: string, plan: Plan, isPublic: boolean) => Promise<void>;
  creating: boolean;
  triggerClassName?: string;
  triggerVariant?: "default" | "outline" | "secondary";
  triggerLabel?: string;
}> = ({
  onCreateOrg,
  creating,
  triggerClassName,
  triggerVariant = "default",
  triggerLabel = "Create organization",
}) => {
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
        <Button
          variant={triggerVariant === "default" ? "outline" : triggerVariant}
          size="lg"
          className={cn(
            "flex items-center gap-2 rounded-xl px-5 py-2.5 font-medium shadow-[0_18px_30px_-25px_rgba(59,130,246,0.75)] transition-transform hover:-translate-y-[1px]",
            triggerVariant === "default" && "border-transparent bg-gradient-to-r from-primary/90 via-primary to-primary/90 text-primary-foreground",
            triggerVariant === "outline" && "border-slate-700/80 bg-slate-950/70 text-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary",
            triggerVariant === "secondary" && "border-transparent bg-slate-900/70 text-foreground hover:border-primary/40 hover:bg-primary/10 hover:text-primary",
            triggerClassName
          )}
        >
          <Sparkles className="h-4 w-4" />
          {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-foreground">
            Launch a new organization
          </DialogTitle>
          <p className="text-sm text-muted-foreground/80">
            Provision a managed reputation canister under the factory. Ensure the factory wallet has
            enough cycles before launching.
          </p>
        </DialogHeader>

        <div className="space-y-6">
          <div className="rounded-xl border border-slate-800/70 bg-slate-950/70 p-4 text-xs text-muted-foreground/80">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>Deployment typically completes in under 15 seconds.</span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                  Minimum
                </div>
                <div className="mt-1 text-sm font-semibold text-foreground">0.9T cycles</div>
              </div>
              <div className="rounded-lg border border-slate-800/70 bg-slate-900/70 px-3 py-2">
                <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-muted-foreground/60">
                  Maximum
                </div>
                <div className="mt-1 text-sm font-semibold text-foreground">1.5T cycles</div>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Organization name</label>
            <Input
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Example: Orbit Labs"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Initial cycles (nat)</label>
            <Input
              value={cycles}
              onChange={(event) => setCycles(event.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              placeholder="900000000000"
            />
            <p className="text-[11px] text-muted-foreground/75">
              Numbers only. Cycles are drawn directly from the Reputation Factory balance.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">Plan (UI only)</label>
              <Select value={plan} onValueChange={(value) => setPlan(value as Plan)}>
                <SelectTrigger className="border-slate-800/70 bg-slate-950/60">
                  <SelectValue placeholder="Choose plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Free">Free</SelectItem>
                  <SelectItem value="Basic">Basic</SelectItem>
                  <SelectItem value="Pro">Pro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-xl border border-slate-800/70 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Public visibility</span>
                <Switch checked={isPublic} onCheckedChange={setIsPublic} />
              </div>
              <p className="mt-2 text-[11px] text-muted-foreground/75">
                If enabled, the organization appears in the public discovery feed.
              </p>
            </div>
          </div>

          <Button
            onClick={handleCreate}
            disabled={!name.trim() || creating}
            className="h-11 w-full rounded-xl bg-gradient-to-r from-primary/90 via-primary to-primary/90 text-primary-foreground shadow-[0_20px_32px_-24px_rgba(59,130,246,0.7)]"
          >
            {creating ? (
              <span className="inline-flex items-center gap-2">
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground/80 border-r-transparent" />
                Provisioning...
              </span>
            ) : (
              <span className="inline-flex items-center gap-2">
                <Sparkles className="h-4 w-4" />
                Launch organization
              </span>
            )}
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
            {org?.name} - <span className="font-mono break-all">{org?.id}</span>
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
const OrgSelectorPage: React.FC = () => {
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

  // Selection + filters
  const [ownershipView, setOwnershipView] = useState<"overview" | "owned" | "discover">("overview");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived" | "stopped">("all");
  const [planFilter, setPlanFilter] = useState<Plan | "all">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortOrder, setSortOrder] = useState<"recent" | "name" | "usage">("recent");

  // Dialog state
  const [editOpen, setEditOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<OrgRecord | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteOrg, setDeleteOrg] = useState<OrgRecord | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpOrg, setTopUpOrg] = useState<OrgRecord | null>(null);

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

      if (cycles > MAX_FACTORY_CYCLES) {
        toast.error("Only canisters <= 1.5T cycles can be created.");
        throw new Error("Cycles above maximum threshold");
      }
      if (cycles < MIN_FACTORY_CYCLES) {
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

  const ownedIds = useMemo(() => new Set(owned.map((org) => org.id)), [owned]);
  const ownedMap = useMemo(() => new Map(owned.map((org) => [org.id, org])), [owned]);

  const discoverRecords = useMemo(
    () => publicOrgs.filter((org) => !ownedIds.has(org.id)),
    [publicOrgs, ownedIds]
  );

  const overviewRecords = useMemo(
    () => [...owned, ...discoverRecords],
    [owned, discoverRecords]
  );

  const baseRecords = useMemo(() => {
    switch (ownershipView) {
      case "owned":
        return owned;
      case "discover":
        return discoverRecords;
      default:
        return overviewRecords;
    }
  }, [ownershipView, owned, discoverRecords, overviewRecords]);

  const filteredRecords = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return baseRecords.filter((org) => {
      const idMatch = org.id.toLowerCase().includes(search);
      const nameMatch = org.name.toLowerCase().includes(search);
      const matchesSearch = !search || idMatch || nameMatch;

      const status = org.status;
      const stopped = Boolean(org.isStopped);
      const planValue = org.plan ?? "Free";

      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && status === "Active" && !stopped) ||
        (statusFilter === "archived" && status === "Archived") ||
        (statusFilter === "stopped" && stopped);

      const matchesPlan = planFilter === "all" || planValue === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [baseRecords, searchTerm, statusFilter, planFilter]);

  const processedRecords = useMemo(() => {
    const records = [...filteredRecords];

    switch (sortOrder) {
      case "name":
        records.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "usage":
        records.sort((a, b) => {
          const txA = Number(a.txCount ?? "0");
          const txB = Number(b.txCount ?? "0");
          return txB - txA;
        });
        break;
      default:
        records.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    }

    return records;
  }, [filteredRecords, sortOrder]);

  const totalActiveOwned = useMemo(
    () => owned.filter((org) => org.status === "Active" && !org.isStopped).length,
    [owned]
  );

  const totalCycles = useMemo(
    () => owned.reduce((acc, org) => acc + parseCycles(org.cycles), 0n),
    [owned]
  );

  const totalMembers = useMemo(
    () => owned.reduce((acc, org) => acc + Number(org.users ?? "0"), 0),
    [owned]
  );

  const totalTransactions = useMemo(
    () => owned.reduce((acc, org) => acc + Number(org.txCount ?? "0"), 0),
    [owned]
  );

  const lowReserveCount = useMemo(
    () =>
      owned.filter((org) => {
        const cycleValue = parseCycles(org.cycles);
        return cycleValue > 0n && cycleValue < MIN_FACTORY_CYCLES;
      }).length,
    [owned]
  );

  const highlightOrg = useMemo(() => {
    if (!owned.length) return null;

    return owned.reduce<{ org: OrgRecord; cycles: bigint } | null>((acc, org) => {
      const cycles = parseCycles(org.cycles);
      if (!acc) return { org, cycles };
      return cycles < acc.cycles ? { org, cycles } : acc;
    }, null);
  }, [owned]);

  const overviewCount = overviewRecords.length;
  const discoverCount = discoverRecords.length;
  const processedCount = processedRecords.length;
  const highlight = highlightOrg?.org ?? null;
  const highlightCycles = highlightOrg?.cycles ?? 0n;

  const renderList = (
    records: OrgRecord[],
    options: {
      compact?: boolean;
      loading: boolean;
      emptyTitle: string;
      emptyDescription: string;
      emptyAction?: ReactNode;
      emptyIcon?: LucideIcon;
    }
  ) => {
    if (options.loading) {
      return (
        <LoadingCards
          variant={options.compact ? "compact" : "owned"}
          count={options.compact ? 6 : 3}
        />
      );
    }

    if (!records.length) {
      return (
        <EmptyState
          title={options.emptyTitle}
          description={options.emptyDescription}
          action={options.emptyAction}
          icon={options.emptyIcon}
        />
      );
    }

    const containerClass =
      viewMode === "grid"
        ? options.compact
          ? "grid gap-6 md:grid-cols-2 xl:grid-cols-3"
          : "grid grid-cols-1 gap-6"
        : "flex flex-col gap-6";

    return (
      <div className={containerClass}>
        {records.map((org) => {
          const isOwnedOrg = ownedIds.has(org.id);

          if (isOwnedOrg) {
            const ownedRecord = ownedMap.get(org.id) ?? org;
            return (
              <OwnedCard
                key={ownedRecord.id}
                org={ownedRecord}
                onManage={() => navigate(`/dashboard/home/${ownedRecord.canisterId}`)}
                onTopUp={() => {
                  setTopUpOrg(ownedRecord);
                  setTopUpOpen(true);
                }}
                onTogglePower={() => togglePower(ownedRecord)}
                onEdit={() => {
                  setEditOrg(ownedRecord);
                  setEditOpen(true);
                }}
                onDelete={() => {
                  setDeleteOrg(ownedRecord);
                  setDeleteOpen(true);
                }}
              />
            );
          }

          return (
            <PublicCard
              key={org.id}
              org={org}
              onJoin={() => {
                localStorage.setItem("selectedOrgId", org.canisterId);
                navigate(`/dashboard/home/${org.canisterId}`);
              }}
            />
          );
        })}
      </div>
    );
  };

  const handleRefresh = () => {
    void fetchOwned();
    void fetchPublic();
  };

  if (connecting) {
    return (
      <div className="relative min-h-screen bg-slate-950 text-foreground">
        <Navigation />
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-slate-800/70 bg-slate-900/70">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-r-transparent" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold text-foreground">Connecting wallet</h2>
            <p className="mt-2 text-sm text-muted-foreground/80">
              Waiting for Plug to confirm your session...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!principalText) {
    return (
      <div className="relative min-h-screen bg-slate-950 text-foreground">
        <Navigation />
        <div className="flex min-h-screen flex-col items-center justify-center px-6">
          <Card className="max-w-lg border border-slate-800/70 bg-slate-950/80 p-10 text-center shadow-[0_24px_48px_-32px_rgba(15,23,42,0.85)]">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-slate-800/70 bg-slate-900/70 text-muted-foreground">
              <Power className="h-7 w-7" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold text-foreground">Connect your Plug wallet</h2>
            <p className="mt-3 text-sm text-muted-foreground/80">
              Authenticate with Plug to view and manage your Reputation DAO organizations.
            </p>
            <div className="mt-6 flex flex-col gap-3">
              <Button
                className="h-11 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90"
                onClick={() => window.open("https://plugwallet.ooo/", "_blank")}
              >
                Install Plug
              </Button>
              <p className="text-[11px] text-muted-foreground/70">
                Once installed, return to this page and connect from the browser extension.
              </p>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.12),_transparent_55%)]" />
      <Navigation />
      <div className="relative z-10">
        <header className="mx-auto max-w-7xl px-6 pb-12 pt-28">
          <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <Card className="relative overflow-hidden border border-slate-800/70 bg-slate-950/80 p-8 shadow-[0_30px_60px_-40px_rgba(15,23,42,0.9)]">
              <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent" />
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.3em] text-primary">
                      Reputation Factory
                    </span>
                    <h1 className="mt-4 text-3xl font-semibold leading-tight text-foreground md:text-4xl">
                      Command your Reputation DAO organizations
                    </h1>
                    <p className="mt-3 max-w-xl text-sm text-muted-foreground/80">
                      Create dedicated canisters, monitor their health, and jump into dashboards in one control plane.
                    </p>
                  </div>
                  <WalletDisplay />
                </div>

                {highlight && (
                  <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 shadow-[0_20px_40px_-30px_rgba(245,158,11,0.45)]">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-amber-200">
                        <ShieldAlert className="h-4 w-4" />
                        Low reserve alert
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-8 rounded-full border-amber-400/60 bg-amber-500/10 px-3 text-xs text-amber-100 hover:border-amber-300 hover:text-amber-50"
                        onClick={() => {
                          setTopUpOrg(highlight);
                          setTopUpOpen(true);
                          setOwnershipView("owned");
                        }}
                      >
                        Top up now
                      </Button>
                    </div>
                    <p className="mt-2 text-xs text-amber-100/80">
                      {highlight.name} is running at {formatCycles(highlightCycles)} cycles.
                    </p>
                  </div>
                )}

                <div className="flex flex-wrap items-center gap-3">
                  <CreateOrgDialog
                    onCreateOrg={handleCreateOrg}
                    creating={creatingOrg}
                    triggerClassName="px-6"
                  />
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-xl border-slate-800/70 bg-slate-950/70 px-5 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary/10 hover:text-primary"
                    onClick={handleRefresh}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh data
                  </Button>
                  <Badge
                    variant="outline"
                    className="rounded-full border-slate-800/70 bg-slate-950/70 px-3 py-1 text-xs text-muted-foreground"
                  >
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    {overviewCount} indexed
                  </Badge>
                </div>
              </div>
            </Card>

            <div className="grid gap-4">
              <StatCard
                icon={Building}
                label="Owned organizations"
                value={owned.length.toString()}
                hint={`${totalActiveOwned} active right now`}
                tone="accent"
              />
              <StatCard
                icon={Users}
                label="Members"
                value={compactNumber.format(totalMembers)}
                hint="Across owned instances"
              />
              <StatCard
                icon={Coins}
                label="Cycle reserve"
                value={formatCycles(totalCycles)}
                hint={lowReserveCount ? `${lowReserveCount} below 0.9T cycles` : "All reserves healthy"}
              />
              <StatCard
                icon={Globe}
                label="Discoverable"
                value={discoverCount.toString()}
                hint="Public organizations ready to join"
              />
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-6 pb-24">
          <Tabs
            value={ownershipView}
            onValueChange={(value) => setOwnershipView(value as typeof ownershipView)}
            className="w-full"
          >
            <div className="rounded-3xl border border-slate-800/70 bg-slate-950/70 p-6 shadow-[0_26px_52px_-36px_rgba(15,23,42,0.85)]">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <TabsList className="flex w-full gap-2 rounded-full border border-slate-800/70 bg-slate-900/60 p-1 lg:w-auto">
                  <TabsTrigger
                    value="overview"
                    className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="owned"
                    className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
                  >
                    Owned
                  </TabsTrigger>
                  <TabsTrigger
                    value="discover"
                    className="rounded-full px-4 py-2 text-sm font-medium text-muted-foreground data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
                  >
                    Discover
                  </TabsTrigger>
                </TabsList>

                <div className="flex flex-1 flex-wrap items-center gap-3">
                  <div className="relative min-w-[220px] flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                    <Input
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                      placeholder="Search by organization or canister ID"
                      className="h-11 rounded-full border-slate-800/70 bg-slate-950/70 pl-9 pr-4 text-sm"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
                    <SelectTrigger className="h-11 w-[150px] rounded-full border-slate-800/70 bg-slate-950/70 text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="stopped">Stopped</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={planFilter} onValueChange={(value) => setPlanFilter(value as Plan | "all")}>
                    <SelectTrigger className="h-11 w-[140px] rounded-full border-slate-800/70 bg-slate-950/70 text-sm">
                      <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Any plan</SelectItem>
                      <SelectItem value="Free">Free</SelectItem>
                      <SelectItem value="Basic">Basic</SelectItem>
                      <SelectItem value="Pro">Pro</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as typeof sortOrder)}>
                    <SelectTrigger className="h-11 w-[150px] rounded-full border-slate-800/70 bg-slate-950/70 text-sm">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Newest</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="usage">Usage</SelectItem>
                    </SelectContent>
                  </Select>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn(
                            "h-10 w-10 rounded-full border-slate-800/70 bg-slate-950/70 text-muted-foreground transition-colors",
                            viewMode === "grid" && "border-primary/40 bg-primary/10 text-primary"
                          )}
                          onClick={() => setViewMode("grid")}
                        >
                          <LayoutGrid className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">Grid view</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className={cn(
                            "h-10 w-10 rounded-full border-slate-800/70 bg-slate-950/70 text-muted-foreground transition-colors",
                            viewMode === "list" && "border-primary/40 bg-primary/10 text-primary"
                          )}
                          onClick={() => setViewMode("list")}
                        >
                          <List className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent className="text-xs">List view</TooltipContent>
                    </Tooltip>
                  </TooltipProvider>

                  <Badge
                    variant="outline"
                    className="rounded-full border-slate-800/70 bg-slate-950/70 px-3 py-1 text-xs text-muted-foreground"
                  >
                    {processedCount} results
                  </Badge>
                </div>
              </div>
            </div>

            <TabsContent value="overview" className="mt-8">
              {renderList(
                ownershipView === "overview" ? processedRecords : overviewRecords,
                {
                  loading: loadingOwned || loadingPublic,
                  emptyTitle: "No organizations yet",
                  emptyDescription:
                    "Create your first organization or switch to the discovery tab to explore public deployments.",
                  emptyAction: (
                    <CreateOrgDialog
                      onCreateOrg={handleCreateOrg}
                      creating={creatingOrg}
                      triggerVariant="outline"
                      triggerClassName="px-5"
                      triggerLabel="Launch an organization"
                    />
                  ),
                  emptyIcon: Building,
                }
              )}
            </TabsContent>

            <TabsContent value="owned" className="mt-8">
              {renderList(
                ownershipView === "owned" ? processedRecords : owned,
                {
                  loading: loadingOwned,
                  emptyTitle: "You do not own any organizations yet",
                  emptyDescription: "Spin up a new canister to start orchestrating reputation flows.",
                  emptyAction: (
                    <CreateOrgDialog
                      onCreateOrg={handleCreateOrg}
                      creating={creatingOrg}
                      triggerVariant="outline"
                      triggerClassName="px-5"
                      triggerLabel="Create organization"
                    />
                  ),
                  emptyIcon: Building,
                }
              )}
            </TabsContent>

            <TabsContent value="discover" className="mt-8">
              {renderList(
                ownershipView === "discover" ? processedRecords : discoverRecords,
                {
                  compact: true,
                  loading: loadingPublic,
                  emptyTitle: "No public organizations available",
                  emptyDescription: "Check back soon or create a new organization and expose it publicly.",
                  emptyIcon: Globe,
                }
              )}
            </TabsContent>
          </Tabs>
        </main>
      </div>

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

export default OrgSelectorPage;
