import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { LayoutGrid, List, RefreshCw, Search, Building, Users, Coins, Globe, Settings, CheckCircle2, Copy } from "lucide-react";

import { useFactoria } from "./hooks/useFactoria";
import { useOrgData } from "./hooks/useOrgData";

import { OwnedCard } from "./ui/OwnedCard";
import { PublicCard } from "./ui/PublicCard";
import { LowReservePanel } from "./ui/LowReservePanel";
import { StatCard } from "./ui/StatCard";
import { LoadingCards } from "./ui/LoadingCards";
import { EmptyState } from "./ui/EmptyState";
import { CreateOrgDialog } from "./ui/dialogs/CreateOrgDialog";
import { EditOrgDialog } from "./ui/dialogs/EditOrgDialog";
import { ConfirmDialog } from "./ui/dialogs/ConfirmDialog";
import { TopUpDialog } from "./ui/dialogs/TopUpDialog";

import { MIN_FACTORY_CYCLES } from "./model/org.constants";
import { parseCycles, formatCycles } from "./model/org.selectors";
import type { OrgRecord } from "./model/org.types";

// optional site nav if you have it
import Navigation from "@/components/ui/navigation";
import { Card } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { principalToAccountIdentifier } from "@/utils/accountIdentifier";

// ---------------- Wallet Badge (tiny) ----------------
const WalletDisplay = () => {
  const { isAuthenticated, principal, authMethod, btcAddress, ethAddress } = useAuth();
  if (!isAuthenticated || !principal) return null;
  const text = principal.toText();
  const short = `${text.slice(0, 8)}...${text.slice(-8)}`;
  const btcShort = btcAddress ? `${btcAddress.slice(0, 6)}...${btcAddress.slice(-4)}` : null;
  const ethShort = ethAddress ? `${ethAddress.slice(0, 6)}...${ethAddress.slice(-4)}` : null;
  const label =
    authMethod === "internetIdentity" ? "II" : authMethod === "siwb" ? "BTC" : authMethod === "siwe" ? "ETH" : "Plug";

  const handleCopy = async () => {
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard) {
        throw new Error("Clipboard API unavailable");
      }
      const { clipboard } = navigator;
      if (typeof clipboard.writeText !== "function") {
        throw new Error("Clipboard API unavailable");
      }
      await clipboard.writeText(text);
      toast.success("Wallet principal copied to clipboard");
    } catch (err) {
      console.error("Failed to copy principal", err);
      toast.error("Unable to copy. Try again.");
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-lg px-3 py-2 border border-border bg-card">
      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
      <div className="flex flex-col text-sm font-mono text-muted-foreground">
        <span>
          {label} · {short}
        </span>
        {authMethod === "siwb" && btcShort && (
          <span className="text-xs text-muted-foreground/80">BTC · {btcShort}</span>
        )}
        {authMethod === "siwe" && ethShort && (
          <span className="text-xs text-muted-foreground/80">ETH · {ethShort}</span>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        onClick={handleCopy}
        aria-label="Copy wallet principal"
      >
        <Copy className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

type PaymentDetails = {
  accountOwner: string;
  subaccountHex: string;
  amountE8s: bigint;
  accountIdentifier: string;
  memo?: string;
};

const formatIcp = (amount: bigint): string => {
  const whole = amount / 100_000_000n;
  const frac = amount % 100_000_000n;
  if (frac === 0n) return `${whole.toString()} ICP`;
  const fracStr = frac.toString().padStart(8, "0").replace(/0+$/, "");
  return `${whole.toString()}.${fracStr} ICP`;
};

// ---------------- Page ----------------
const OrgSelectorPage: React.FC = () => {
  const navigate = useNavigate();

  // Actor + principal
  const { factoria, principal, connecting } = useFactoria();

  // Data + mutations
  const {
    owned,
    publicOrgs,
    loadingOwned,
    loadingPublic,
    creating,
    working,

    fetchOwned,
    fetchPublic,
    refreshAll,

    createTrialForSelf,
    createBasicForSelf,
    createOrReuseChildFor,
    topUp,
    togglePower,
    archive,
    toggleVisibility,

    getPaymentInfo,     // exported in case you later add a "Pay" dialog
    activateAfterPayment,
  } = useOrgData({ factoria, principal });

  // ---------------- UI State ----------------
  const [ownershipView, setOwnershipView] = useState<"overview" | "owned" | "discover">("owned");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived" | "stopped">("all");
  const [planFilter, setPlanFilter] = useState<"all" | "Trial" | "Basic" | "BasicPending">("all");
  const [sortOrder, setSortOrder] = useState<"recent" | "name" | "usage">("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");

  // dialogs
  const [editOpen, setEditOpen] = useState(false);
  const [editOrg, setEditOrg] = useState<OrgRecord | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteOrg, setDeleteOrg] = useState<OrgRecord | null>(null);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpOrg, setTopUpOrg] = useState<OrgRecord | null>(null);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [paymentTarget, setPaymentTarget] = useState<OrgRecord | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [finalizingPayment, setFinalizingPayment] = useState(false);

  // ---------------- Derived data ----------------
  const ownedIds = useMemo(() => new Set(owned.map((o) => o.id)), [owned]);
  const discoverRecords = useMemo(
    () => publicOrgs.filter((org) => !ownedIds.has(org.id)),
    [publicOrgs, ownedIds]
  );
  const overviewRecords = useMemo(() => [...owned, ...discoverRecords], [owned, discoverRecords]);

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
    const q = searchTerm.trim().toLowerCase();
    return baseRecords.filter((org) => {
      const matchesSearch =
        !q || org.name.toLowerCase().includes(q) || org.id.toLowerCase().includes(q);

      const stopped = Boolean(org.isStopped);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && org.status === "Active" && !stopped) ||
        (statusFilter === "archived" && org.status === "Archived") ||
        (statusFilter === "stopped" && stopped);

      const matchesPlan = planFilter === "all" || (org.plan ?? "Basic") === planFilter;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [baseRecords, searchTerm, statusFilter, planFilter]);

  const processedRecords = useMemo(() => {
    const r = [...filteredRecords];
    switch (sortOrder) {
      case "name":
        r.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "usage":
        r.sort((a, b) => Number(b.txCount ?? "0") - Number(a.txCount ?? "0"));
        break;
      default:
        r.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    }
    return r;
  }, [filteredRecords, sortOrder]);

  const lowReserveOrgs = useMemo(
    () =>
      owned.filter((org) => {
        const v = parseCycles(org.cycles);
        return v > 0n && v < MIN_FACTORY_CYCLES;
      }),
    [owned]
  );

  const totalActiveOwned = useMemo(
    () => owned.filter((o) => o.status === "Active" && !o.isStopped).length,
    [owned]
  );
  const totalCycles = useMemo(
    () => owned.reduce((acc, o) => acc + parseCycles(o.cycles), 0n),
    [owned]
  );
  const totalMembers = useMemo(
    () => owned.reduce((acc, o) => acc + Number(o.users ?? "0"), 0),
    [owned]
  );
  const totalTransactions = useMemo(
    () => owned.reduce((acc, o) => acc + Number(o.txCount ?? "0"), 0),
    [owned]
  );
  const discoverCount = discoverRecords.length;
  const overviewCount = overviewRecords.length;
  const processedCount = processedRecords.length;

  // ---------------- Lifecycle ----------------
  useEffect(() => {
    // first load once actor/principal are ready
    if (factoria && principal) void refreshAll();
  }, [factoria, principal, refreshAll]);

  // ---------------- Actions ----------------
  const handleOpen = (org: OrgRecord) => navigate(`/dashboard/home/${org.canisterId}`);

  const onTopUpOpen = (org: OrgRecord) => {
    setTopUpOrg(org);
    setTopUpOpen(true);
  };

  const onTopUp = async (amount: bigint) => {
    if (!topUpOrg) return;
    await topUp(topUpOrg.id, amount);
  };

  const onDelete = async () => {
    if (!deleteOrg) return;
    await archive(deleteOrg.id);
  };

  const onToggleVisibility = async (id: string) => {
    await toggleVisibility(id);
    setEditOpen(false);
  };

  const fetchPaymentDetails = async (org: OrgRecord) => {
    if (!factoria) return false;
    setPaymentLoading(true);
    try {
      const info = await getPaymentInfo(org.id);
      setPaymentDetails({
        accountOwner: info.account_owner,
        subaccountHex: info.subaccount_hex,
        amountE8s: info.amount_e8s,
        accountIdentifier: principalToAccountIdentifier(info.account_owner, info.subaccount_hex),
        memo: info.memo ?? "Basic plan deposit",
      });
      return true;
    } catch (e: any) {
      toast.error(e?.message || "Failed to load payment info");
      return false;
    } finally {
      setPaymentLoading(false);
    }
  };

  const openPaymentDialog = async (org: OrgRecord) => {
    setPaymentTarget(org);
    const ok = await fetchPaymentDetails(org);
    if (ok) {
      setPaymentOpen(true);
    } else {
      setPaymentTarget(null);
      setPaymentDetails(null);
    }
  };

  const refreshPayment = async () => {
    if (paymentTarget) {
      await fetchPaymentDetails(paymentTarget);
    }
  };

  const closePaymentDialog = () => {
    setPaymentOpen(false);
    setPaymentTarget(null);
    setPaymentDetails(null);
  };

  const finalizePayment = async () => {
    if (!paymentTarget) return;
    setFinalizingPayment(true);
    try {
      const res = await activateAfterPayment(paymentTarget.id);
      if (res.ok) {
        toast.success(res.ok || "Payment processed");
        closePaymentDialog();
        await refreshAll();
      } else {
        toast.error(res.err || "Unable to finalize payment");
      }
    } catch (e: any) {
      toast.error(e?.message || "Unable to finalize payment");
    } finally {
      setFinalizingPayment(false);
    }
  };

  const handleCopy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.message(`${label} copied`);
    } catch (e: any) {
      toast.error(e?.message || `Failed to copy ${label.toLowerCase()}`);
    }
  };

  const renderList = (
    records: OrgRecord[],
    options: {
      compact?: boolean;
      loading: boolean;
      emptyTitle: string;
      emptyDescription: string;
      emptyAction?: React.ReactNode;
      emptyIcon?: React.ComponentType<any>;
    }
  ) => {
    if (options.loading) {
      return <LoadingCards variant={options.compact ? "compact" : "owned"} count={options.compact ? 6 : 3} />;
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

    const gridLayout = options.compact
      ? "grid gap-6 md:grid-cols-2 xl:grid-cols-3"
      : "grid gap-6 md:grid-cols-2 xl:grid-cols-3";

    const container =
      viewMode === "grid" ? gridLayout : "flex flex-col gap-6";

    return (
      <div className={container}>
        {records.map((org) =>
          ownedIds.has(org.id) ? (
            <OwnedCard
              key={org.id}
              org={org}
              onTopUp={() => onTopUpOpen(org)}
              onTogglePower={(o) => togglePower(o)}
              onDelete={(id) => {
                setDeleteOrg({ ...org, id });
                setDeleteOpen(true);
              }}
              onVisibility={(id) => {
                setEditOrg(org);
                setEditOpen(true);
              }}
              onManage={(id) => navigate(`/dashboard/home/${id}`)}
              onViewPayment={openPaymentDialog}
            />
          ) : (
            <PublicCard
              key={org.id}
              org={org}
              onSelect={() => {
                // selecting public → jump in
                navigate(`/dashboard/home/${org.canisterId}`);
              }}
              onJoin={(id) => navigate(`/dashboard/home/${id}`)}
            />
          )
        )}
      </div>
    );
  };

  // ---------------- Render ----------------
  if (connecting) {
    return (
      <div className="relative min-h-screen bg-background text-foreground">
        <Navigation />
        <div className="flex min-h-screen flex-col items-center justify-center gap-6 px-6">
          <div className="flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted/80">
            <div className="h-7 w-7 animate-spin rounded-full border-2 border-primary border-r-transparent" />
          </div>
          <div className="text-center">
            <h2 className="text-lg font-semibold">Connecting wallet</h2>
            <p className="mt-2 text-sm text-muted-foreground">Waiting for Plug to confirm your session…</p>
          </div>
        </div>
      </div>
    );
  }

  if (!principal) {
    return (
      <div className="relative min-h-screen bg-background text-foreground">
        <Navigation />
        <div className="flex min-h-screen flex-col items-center justify-center px-6">
          <Card className="max-w-lg border border-border bg-card p-10 text-center shadow-lg">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
              <Settings className="h-7 w-7" />
            </div>
            <h2 className="mt-6 text-2xl font-semibold">Connect your Plug wallet</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Authenticate with Plug to view and manage your Reputation DAO organizations.
            </p>
            <div className="mt-6">
              <Button className="h-11 rounded-xl" onClick={() => window.open("https://plugwallet.ooo/", "_blank")}>
                Get Plug
              </Button>
            </div>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-background text-foreground">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.10),_transparent_65%)]" />
      <Navigation />

      <div className="relative z-10">
        {/* Header / Hero */}
        <header className="mx-auto max-w-7xl px-6 pb-12 pt-28">
          <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
            <Card className="relative overflow-hidden border border-border bg-card p-8 shadow-lg">
              <div className="space-y-6">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    <span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.3em] text-primary">
                      Reputation Factory
                    </span>
                    <h1 className="mt-4 text-3xl font-semibold md:text-4xl">
                      Command your Reputation DAO organizations
                    </h1>
                    <p className="mt-3 max-w-xl text-sm text-muted-foreground">
                      Create canisters, monitor their health, and jump into dashboards in one control plane.
                    </p>
                  </div>
                  <WalletDisplay />
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <CreateOrgDialog
                    creating={creating}
                    triggerLabel="Create organization"
                    onCreateTrial={async (note) => {
                      await createTrialForSelf(note);
                    }}
                    onCreateBasic={async (note) => {
                      await createBasicForSelf(note);
                    }}
                    onCreateAdvanced={async (cycles, note) => {
                      // owner = current principal (inside hook)
                      await createOrReuseChildFor(cycles, [], note);
                    }}
                  />
                  <Button
                    variant="outline"
                    size="lg"
                    className="rounded-xl"
                    onClick={() => void refreshAll()}
                    disabled={loadingOwned || loadingPublic || working}
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Refresh data
                  </Button>
                  <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    {overviewCount} indexed
                  </Badge>
                </div>

                {/* Quick callouts */}
                <div className="grid gap-3 rounded-2xl border border-border bg-muted/60 p-4 sm:grid-cols-3">
                  <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                      <Settings className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Operational workspaces</p>
                      <p className="text-xs text-muted-foreground">
                        {owned.length ? `${owned.length} owned` : "No organizations yet"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                      <Coins className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Cycle coverage</p>
                      <p className="text-xs text-muted-foreground">{formatCycles(totalCycles)} pooled</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg border border-primary/30 bg-primary/10 text-primary">
                      <Globe className="h-4 w-4" />
                    </div>
                    <div className="space-y-1">
                      <p className="text-sm font-semibold">Discovery feed</p>
                      <p className="text-xs text-muted-foreground">
                        {discoverCount} public org{discoverCount === 1 ? "" : "s"}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            <div className="grid gap-4">
              <StatCard icon={Building} label="Owned organizations" value={owned.length.toString()} hint={`${totalActiveOwned} active`} tone="accent" />
              <StatCard icon={Users} label="Members" value={new Intl.NumberFormat().format(totalMembers)} hint="Across owned instances" />
              <StatCard icon={Coins} label="Cycle reserve" value={formatCycles(totalCycles)} hint={`${lowReserveOrgs.length} below threshold`} />
              <StatCard icon={Globe} label="Discoverable" value={discoverCount.toString()} hint="Public orgs" />
            </div>
          </div>
        </header>

        {/* Reserve panel */}
        <LowReservePanel
          alerts={lowReserveOrgs}
          onTopUp={(org) => onTopUpOpen(org)}
          onOpenWorkspace={(org) => handleOpen(org)}
        />

        {/* Main */}
        <main className="mx-auto max-w-7xl px-6 pb-24">
          <Tabs
            value={ownershipView}
            onValueChange={(v) => setOwnershipView(v as typeof ownershipView)}
            className="w-full"
          >
            {/* Controls */}
            <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <TabsList className="flex w-full gap-2 rounded-full border border-border bg-muted/70 p-1 lg:w-auto">
                  <TabsTrigger
                    value="overview"
                    className="rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="owned"
                    className="rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
                  >
                    Owned
                  </TabsTrigger>
                  <TabsTrigger
                    value="discover"
                    className="rounded-full px-4 py-2 text-sm font-medium data-[state=active]:bg-primary/15 data-[state=active]:text-primary"
                  >
                    Discover
                  </TabsTrigger>
                </TabsList>

                <div className="flex flex-1 flex-wrap items-center gap-3">
                  <div className="relative min-w-[220px] flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/70" />
                    <Input
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search by name or canister ID"
                      className="h-11 rounded-full pl-9 pr-4 text-sm"
                    />
                  </div>

                  <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                    <SelectTrigger className="h-11 w-[150px] rounded-full text-sm">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All statuses</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="stopped">Stopped</SelectItem>
                      <SelectItem value="archived">Archived</SelectItem>
                    </SelectContent>
                  </Select>

                  <Select value={planFilter} onValueChange={(v) => setPlanFilter(v as typeof planFilter)}>
                    <SelectTrigger className="h-11 w-[140px] rounded-full text-sm">
                      <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any plan</SelectItem>
                    <SelectItem value="Trial">Trial</SelectItem>
                    <SelectItem value="Basic">Basic</SelectItem>
                    <SelectItem value="BasicPending">Basic (pending)</SelectItem>
                  </SelectContent>
                </Select>

                  <Select value={sortOrder} onValueChange={(v) => setSortOrder(v as typeof sortOrder)}>
                    <SelectTrigger className="h-11 w-[150px] rounded-full text-sm">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="recent">Newest</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                      <SelectItem value="usage">Usage</SelectItem>
                    </SelectContent>
                  </Select>

                  <Button
                    variant={viewMode === "grid" ? "default" : "outline"}
                    size="icon"
                    className="h-10 w-10 rounded-full"
                    onClick={() => setViewMode("grid")}
                    title="Grid view"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "list" ? "default" : "outline"}
                    size="icon"
                    className="h-10 w-10 rounded-full"
                    onClick={() => setViewMode("list")}
                    title="List view"
                  >
                    <List className="h-4 w-4" />
                  </Button>

                  <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                    {processedCount} results
                  </Badge>
                </div>
              </div>
            </div>

            {/* Lists */}
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
                      creating={creating}
                      triggerLabel="Launch an organization"
                      triggerVariant="outline"
                      onCreateTrial={async (note) => createTrialForSelf(note)}
                      onCreateBasic={async (note) => createBasicForSelf(note)}
                      onCreateAdvanced={async (cycles, note) => createOrReuseChildFor(cycles, [], note)}
                    />
                  ),
                  emptyIcon: Building,
                }
              )}
            </TabsContent>

            <TabsContent value="owned" className="mt-8">
              {renderList(ownershipView === "owned" ? processedRecords : owned, {
                loading: loadingOwned,
                emptyTitle: "You do not own any organizations yet",
                emptyDescription: "Spin up a new canister to start orchestrating reputation flows.",
                emptyAction: (
                  <CreateOrgDialog
                    creating={creating}
                    triggerLabel="Create organization"
                    triggerVariant="outline"
                    onCreateTrial={async (note) => createTrialForSelf(note)}
                    onCreateBasic={async (note) => createBasicForSelf(note)}
                    onCreateAdvanced={async (cycles, note) => createOrReuseChildFor(cycles, [], note)}
                  />
                ),
                emptyIcon: Building,
              })}
            </TabsContent>

            <TabsContent value="discover" className="mt-8">
              {renderList(ownershipView === "discover" ? processedRecords : discoverRecords, {
                compact: true,
                loading: loadingPublic,
                emptyTitle: "No public organizations available",
                emptyDescription: "Check back soon or create a new organization and expose it publicly.",
                emptyIcon: Globe,
              })}
            </TabsContent>
          </Tabs>
        </main>
      </div>

      {/* dialogs */}
      <EditOrgDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        org={editOrg}
        onToggleVisibility={onToggleVisibility}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Archive Organization"
        message={`Archive ${deleteOrg?.name}? The canister will be parked in the factory pool and controllers handed back to the factory.`}
        confirmLabel="Archive"
        destructive
        onConfirm={onDelete}
      />

      <TopUpDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        target={topUpOrg}
        onTopUp={onTopUp}
      />

      <Dialog open={paymentOpen} onOpenChange={(open) => (open ? setPaymentOpen(true) : closePaymentDialog())}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Payment instructions</DialogTitle>
          </DialogHeader>

          {paymentTarget && (
            <div className="space-y-3">
              <div>
                <p className="text-sm font-semibold text-foreground">{paymentTarget.name}</p>
                <p className="text-xs font-mono text-muted-foreground break-all">
                  {paymentTarget.id}
                </p>
              </div>

              {paymentLoading && (
                <div className="flex items-center justify-center gap-2 py-4 text-sm text-muted-foreground">
                  <RefreshCw className="h-4 w-4 animate-spin" /> Loading payment details…
                </div>
              )}

              {!paymentLoading && paymentDetails && (
                <div className="space-y-4">
                  {paymentDetails.memo && (
                    <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
                      {paymentDetails.memo}
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-xs uppercase text-muted-foreground">Account identifier (Plug)</span>
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] break-all flex-1">{paymentDetails.accountIdentifier}</code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(paymentDetails.accountIdentifier, "Account identifier")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs uppercase text-muted-foreground">Account owner (principal)</span>
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] break-all flex-1">{paymentDetails.accountOwner}</code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(paymentDetails.accountOwner, "Account owner")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <span className="text-xs uppercase text-muted-foreground">Subaccount (hex)</span>
                    <div className="flex items-center gap-2">
                      <code className="text-[11px] break-all flex-1">{paymentDetails.subaccountHex}</code>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => handleCopy(paymentDetails.subaccountHex, "Subaccount")}
                      >
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Amount</span>
                    <span className="font-semibold text-foreground">
                      {formatIcp(paymentDetails.amountE8s)} ({paymentDetails.amountE8s.toString()} e8s)
                    </span>
                  </div>

                  {paymentTarget.plan === "BasicPending" ? (
                    <p className="text-xs text-amber-500">
                      Send the payment above, then mark it received to activate your Basic plan.
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      After sending renewal funds, sweep them into the treasury to extend your plan.
                    </p>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={refreshPayment}
                      disabled={paymentLoading}
                    >
                      <RefreshCw className="mr-2 h-3 w-3" /> Refresh
                    </Button>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={closePaymentDialog}>
                        Close
                      </Button>
                      <Button
                        onClick={finalizePayment}
                        disabled={paymentLoading || finalizingPayment}
                      >
                        {finalizingPayment
                          ? "Processing…"
                          : paymentTarget.plan === "BasicPending"
                            ? "Mark payment received"
                            : "Sweep payment"}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgSelectorPage;
