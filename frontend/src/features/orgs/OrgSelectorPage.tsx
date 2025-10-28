import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

import { 
  LayoutGrid, List, RefreshCw, Search, Building, Users, Coins, Globe, Settings, 
  CheckCircle2, Copy, Shield, Award, TrendingUp, Lock, Zap, Star 
} from "lucide-react";

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

import Navigation from "@/components/ui/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { principalToAccountIdentifier } from "@/utils/accountIdentifier";

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

// Professional Header Component
const ProfessionalHeader = () => {
  const { isAuthenticated, principal, authMethod } = useAuth();
  
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-background via-background to-muted/20 border-b">
      <div className="absolute inset-0 bg-grid-white/[0.02] bg-[size:60px_60px]" />
      <div className="relative max-w-7xl mx-auto px-6 py-12">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20">
                <Building className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Organization Hub</h1>
                <p className="text-muted-foreground">Secure, decentralized reputation management</p>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
                <Shield className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700 dark:text-green-400">Blockchain Secured</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
                <Lock className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-medium text-blue-700 dark:text-blue-400">Soulbound Tokens</span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
                <Zap className="w-4 h-4 text-purple-600" />
                <span className="text-sm font-medium text-purple-700 dark:text-purple-400">Internet Computer</span>
              </div>
            </div>
          </div>

          {isAuthenticated && principal && <WalletDisplay />}
        </div>
      </div>
    </div>
  );
};

// Enhanced Stats Overview
const StatsOverview = ({ owned, publicOrgs }: { owned: OrgRecord[], publicOrgs: OrgRecord[] }) => {
  const totalUsers = useMemo(() => 
    owned.reduce((sum, org) => sum + (parseInt(org.userCount || '0')), 0), [owned]
  );
  
  const totalTransactions = useMemo(() => 
    owned.reduce((sum, org) => sum + (parseInt(org.txCount || '0')), 0), [owned]
  );

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950/50 dark:to-blue-900/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Your Organizations</p>
              <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{owned.length}</p>
            </div>
            <Building className="w-8 h-8 text-blue-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-gradient-to-br from-slate-50 to-slate-100/50 dark:from-slate-950/50 dark:to-slate-900/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-300">Total Members</p>
              <p className="text-2xl font-bold text-slate-900 dark:text-slate-100">{totalUsers.toLocaleString()}</p>
            </div>
            <Users className="w-8 h-8 text-slate-600" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-gradient-to-br from-blue-100 to-blue-200/50 dark:from-blue-900/50 dark:to-blue-800/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Transactions</p>
              <p className="text-2xl font-bold text-blue-950 dark:text-blue-50">{totalTransactions.toLocaleString()}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-blue-700" />
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-sm bg-gradient-to-br from-gray-50 to-gray-100/50 dark:from-gray-950/50 dark:to-gray-900/30">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Public Orgs</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{publicOrgs.length}</p>
            </div>
            <Globe className="w-8 h-8 text-gray-600" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

// Enhanced Wallet Display
const WalletDisplay = () => {
  const { isAuthenticated, principal, authMethod } = useAuth();
  if (!isAuthenticated || !principal) return null;
  
  const text = principal.toText();
  const short = `${text.slice(0, 8)}...${text.slice(-8)}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Wallet principal copied to clipboard");
    } catch (err) {
      console.error("Failed to copy principal", err);
      toast.error("Unable to copy. Try again.");
    }
  };

  return (
    <Card className="border-0 shadow-lg bg-card/80 backdrop-blur-sm">
      <CardContent className="p-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30">
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-foreground">Connected Wallet</p>
            <p className="text-xs text-muted-foreground font-mono truncate">
              {authMethod === 'internetIdentity' ? 'Internet Identity' : 'Plug Wallet'} · {short}
            </p>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            onClick={handleCopy}
            aria-label="Copy wallet principal"
          >
            <Copy className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

const OrgSelectorPage: React.FC = () => {
  const navigate = useNavigate();
  const { factoria, principal, connecting } = useFactoria();

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
    getPaymentInfo,
    activateAfterPayment,
  } = useOrgData({ factoria, principal });

  // UI State
  const [ownershipView, setOwnershipView] = useState<"overview" | "owned" | "discover">("owned");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "archived" | "stopped">("all");
  const [planFilter, setPlanFilter] = useState<"all" | "Trial" | "Basic" | "BasicPending">("all");
  const [sortOrder, setSortOrder] = useState<"recent" | "name" | "usage">("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
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

  // Derived data
  const ownedIds = useMemo(() => new Set(owned.map((o) => o.id)), [owned]);
  const discoverRecords = useMemo(
    () => publicOrgs.filter((org) => !ownedIds.has(org.id)),
    [publicOrgs, ownedIds]
  );
  const overviewRecords = useMemo(() => [...owned, ...discoverRecords], [owned, discoverRecords]);

  const baseRecords = useMemo(() => {
    switch (ownershipView) {
      case "owned": return owned;
      case "discover": return discoverRecords;
      default: return overviewRecords;
    }
  }, [ownershipView, owned, discoverRecords, overviewRecords]);

  const filteredRecords = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return baseRecords.filter((org) => {
      const matchesSearch = !q || org.name.toLowerCase().includes(q) || org.id.toLowerCase().includes(q);
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
      case "name": r.sort((a, b) => a.name.localeCompare(b.name)); break;
      case "usage": r.sort((a, b) => Number(b.txCount ?? "0") - Number(a.txCount ?? "0")); break;
      default: r.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    }
    return r;
  }, [filteredRecords, sortOrder]);

  const lowReserveOrgs = useMemo(
    () => owned.filter((org) => {
      const v = parseCycles(org.cycles);
      return v > 0n && v < MIN_FACTORY_CYCLES;
    }),
    [owned]
  );

  const discoverCount = discoverRecords.length;
  const overviewCount = overviewRecords.length;

  // Lifecycle
  useEffect(() => {
    if (factoria && principal) void refreshAll();
  }, [factoria, principal, refreshAll]);

  // Actions
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
    const success = await fetchPaymentDetails(org);
    if (success) setPaymentOpen(true);
  };

  const closePaymentDialog = () => {
    setPaymentOpen(false);
    setPaymentTarget(null);
    setPaymentDetails(null);
  };

  const refreshPayment = async () => {
    if (!paymentTarget) return;
    await fetchPaymentDetails(paymentTarget);
  };

  const finalizePayment = async () => {
    if (!paymentTarget) return;
    setFinalizingPayment(true);
    try {
      await activateAfterPayment(paymentTarget.id);
      closePaymentDialog();
    } finally {
      setFinalizingPayment(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`);
    } catch (e: any) {
      toast.error(e?.message || `Failed to copy ${label.toLowerCase()}`);
    }
  };

  const renderList = (
    records: OrgRecord[],
    options: {
      loading: boolean;
      emptyTitle: string;
      emptyDescription: string;
      emptyAction?: React.ReactNode;
      emptyIcon?: React.ComponentType<any>;
    }
  ) => {
    if (options.loading) {
      return <LoadingCards variant="owned" count={3} />;
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

    const container = viewMode === "grid" 
      ? "grid gap-6 md:grid-cols-2 xl:grid-cols-3" 
      : "flex flex-col gap-6";

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
              onSelect={() => navigate(`/dashboard/home/${org.canisterId}`)}
              onJoin={(id) => navigate(`/dashboard/home/${id}`)}
            />
          )
        )}
      </div>
    );
  };

  // Professional loading state
  if (connecting) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <ProfessionalHeader />
        <div className="max-w-7xl mx-auto px-6 py-16">
          <Card className="max-w-md mx-auto border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-primary/10 border border-primary/20">
                <div className="w-8 h-8 animate-spin rounded-full border-2 border-primary border-r-transparent" />
              </div>
              <h2 className="text-xl font-semibold mb-2">Connecting Wallet</h2>
              <p className="text-muted-foreground">Establishing secure connection to your wallet...</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!principal) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <ProfessionalHeader />
        <div className="max-w-7xl mx-auto px-6 py-16">
          <Card className="max-w-lg mx-auto border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <div className="flex items-center justify-center w-16 h-16 mx-auto mb-6 rounded-full bg-orange-100 dark:bg-orange-900/30 border border-orange-200 dark:border-orange-800">
                <Shield className="w-8 h-8 text-orange-600" />
              </div>
              <h2 className="text-2xl font-semibold mb-3">Wallet Authentication Required</h2>
              <p className="text-muted-foreground mb-6">
                Connect your wallet to access and manage your reputation organizations securely on the Internet Computer.
              </p>
              <Button 
                className="w-full h-12 rounded-xl" 
                onClick={() => window.open("https://plugwallet.ooo/", "_blank")}
              >
                <Zap className="w-4 h-4 mr-2" />
                Get Plug Wallet
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <ProfessionalHeader />
      
      <div className="max-w-7xl mx-auto px-6 py-8">
        <StatsOverview owned={owned} publicOrgs={publicOrgs} />
        
        {lowReserveOrgs.length > 0 && (
          <div className="mb-8">
            <LowReservePanel orgs={lowReserveOrgs} onTopUp={onTopUpOpen} />
          </div>
        )}

        <Tabs value={ownershipView} onValueChange={(v) => setOwnershipView(v as typeof ownershipView)}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6 mb-8">
            <TabsList className="grid w-full lg:w-auto grid-cols-3 h-12 p-1 bg-muted/50">
              <TabsTrigger value="owned" className="h-10 px-6">
                <Building className="w-4 h-4 mr-2" />
                My Organizations
                <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">{owned.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="discover" className="h-10 px-6">
                <Globe className="w-4 h-4 mr-2" />
                Discover
                <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">{discoverCount}</Badge>
              </TabsTrigger>
              <TabsTrigger value="overview" className="h-10 px-6">
                <Star className="w-4 h-4 mr-2" />
                All
                <Badge variant="secondary" className="ml-2 h-5 px-2 text-xs">{overviewCount}</Badge>
              </TabsTrigger>
            </TabsList>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search organizations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="h-11 w-64 pl-10 rounded-full"
                />
              </div>

              <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as typeof statusFilter)}>
                <SelectTrigger className="h-11 w-32 rounded-full">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="stopped">Stopped</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-1 rounded-full border p-1">
                <Button
                  variant={viewMode === "grid" ? "default" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => setViewMode("grid")}
                >
                  <LayoutGrid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === "list" ? "default" : "ghost"}
                  size="icon"
                  className="h-9 w-9 rounded-full"
                  onClick={() => setViewMode("list")}
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="icon"
                className="h-11 w-11 rounded-full"
                onClick={() => void refreshAll()}
                disabled={loadingOwned || loadingPublic || working}
              >
                <RefreshCw className={`h-4 w-4 ${(loadingOwned || loadingPublic || working) ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>

          <TabsContent value="owned">
            {renderList(ownershipView === "owned" ? processedRecords : owned, {
              loading: loadingOwned,
              emptyTitle: "No organizations yet",
              emptyDescription: "Create your first organization to start building reputation systems.",
              emptyAction: (
                <CreateOrgDialog
                  creating={creating}
                  triggerLabel="Create Organization"
                  onCreateTrial={async (note) => createTrialForSelf(note)}
                  onCreateBasic={async (note) => createBasicForSelf(note)}
                  onCreateAdvanced={async (cycles, note) => createOrReuseChildFor(cycles, [], note)}
                />
              ),
              emptyIcon: Building,
            })}
          </TabsContent>

          <TabsContent value="discover">
            {renderList(ownershipView === "discover" ? processedRecords : discoverRecords, {
              loading: loadingPublic,
              emptyTitle: "No public organizations found",
              emptyDescription: "Check back later or create your own organization.",
              emptyIcon: Globe,
            })}
          </TabsContent>

          <TabsContent value="overview">
            {renderList(ownershipView === "overview" ? processedRecords : overviewRecords, {
              loading: loadingOwned || loadingPublic,
              emptyTitle: "No organizations available",
              emptyDescription: "Create your first organization or wait for public ones to appear.",
              emptyAction: (
                <CreateOrgDialog
                  creating={creating}
                  triggerLabel="Get Started"
                  onCreateTrial={async (note) => createTrialForSelf(note)}
                  onCreateBasic={async (note) => createBasicForSelf(note)}
                  onCreateAdvanced={async (cycles, note) => createOrReuseChildFor(cycles, [], note)}
                />
              ),
              emptyIcon: Building,
            })}
          </TabsContent>
        </Tabs>
      </div>

      <EditOrgDialog
        open={editOpen}
        onOpenChange={setEditOpen}
        org={editOrg}
        onToggleVisibility={onToggleVisibility}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Archive organization"
        description={`Are you sure you want to archive "${deleteOrg?.name}"?`}
        onConfirm={onDelete}
        working={working}
      />

      <TopUpDialog
        open={topUpOpen}
        onOpenChange={setTopUpOpen}
        org={topUpOrg}
        onTopUp={onTopUp}
        working={working}
      />

      <Dialog open={paymentOpen} onOpenChange={setPaymentOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Payment Required</DialogTitle>
          </DialogHeader>
          {paymentDetails && (
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Send {formatIcp(paymentDetails.amountE8s)} to activate your Basic plan:
              </p>
              <div className="space-y-2 rounded-lg bg-muted p-3 font-mono text-xs">
                <div><strong>Account:</strong> {paymentDetails.accountIdentifier}</div>
                {paymentDetails.memo && <div><strong>Memo:</strong> {paymentDetails.memo}</div>}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(paymentDetails.accountIdentifier, "Account ID")}
                >
                  <Copy className="mr-1 h-3 w-3" />
                  Copy Account
                </Button>
                <Button size="sm" onClick={finalizePayment} disabled={finalizingPayment}>
                  {finalizingPayment ? "Checking..." : "I've Sent Payment"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OrgSelectorPage;
