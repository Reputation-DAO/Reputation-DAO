// src/features/dashboard/pages/MyEarningsPage.tsx
import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import { useAuth } from "@/contexts/AuthContext";
import { useRole } from "@/contexts/RoleContext";
import { DashboardLayout, SidebarTrigger } from "@/components/layout/DashboardLayout";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ui/theme-toggle";
import WalletCopyBadge from "../components/WalletCopyBadge";
import { AlertTriangle, Coins, Wallet, ArrowDownToLine } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export type RailSymbol = "BTC" | "ICP" | "ETH";

export type MyRailEarnings = {
  symbol: RailSymbol;
  available: string;
  pending: string;
};

export type MyEarningsEvent = {
  id: string;
  ts: number;
  reason: string;
  rail: RailSymbol;
  amount: string;
  status: "pending" | "paid";
};

export type MyEarningsSummary = {
  rails: MyRailEarnings[];
  history: MyEarningsEvent[];
};

function useMyEarnings(cid?: string) {
  const [summary, setSummary] = useState<MyEarningsSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    // TODO: replace with Treasury canister query scoped to the caller + org.
    const timer = setTimeout(() => {
      setSummary({
        rails: [
          { symbol: "BTC", available: "0.0012", pending: "0.0003" },
          { symbol: "ICP", available: "54.2", pending: "12.0" },
          { symbol: "ETH", available: "0.085", pending: "0.010" },
        ],
        history: [
          {
            id: "evt-001",
            ts: Date.now() - 1000 * 60 * 60,
            reason: "Awarded for proposal review",
            rail: "BTC",
            amount: "0.0002",
            status: "paid",
          },
          {
            id: "evt-002",
            ts: Date.now() - 1000 * 60 * 120,
            reason: "Contributor payout",
            rail: "ICP",
            amount: "10",
            status: "pending",
          },
          {
            id: "evt-003",
            ts: Date.now() - 1000 * 60 * 200,
            reason: "Cycle bonus",
            rail: "ETH",
            amount: "0.02",
            status: "paid",
          },
        ],
      });
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [cid]);

  const withdraw = async (rail: RailSymbol) => {
    // TODO: wire to treasury withdraw endpoint.
    console.log(`Withdraw from ${rail}`);
  };

  return { summary, loading, withdraw };
}

export default function MyEarningsPage() {
  const navigate = useNavigate();
  const { cid } = useParams<{ cid: string }>();
  const { isAuthenticated, principal } = useAuth();
  const { userRole, loading: roleLoading, currentPrincipal, userName } = useRole();
  const sidebarPrincipal = currentPrincipal?.toText() || principal?.toText() || "";
  const { summary, loading, withdraw } = useMyEarnings(cid);

  if (!cid || !isAuthenticated) {
    return (
      <div className="min-h-screen grid place-items-center">
        <Card className="glass-card p-6 text-center">
          <AlertTriangle className="w-10 h-10 text-orange-500 mx-auto mb-3" />
          <p className="text-muted-foreground">Connect a wallet and select an organization to view earnings.</p>
          <Button className="mt-4" onClick={() => navigate("/org-selector")}>
            Choose Organization
          </Button>
        </Card>
      </div>
    );
  }

  if (roleLoading || loading || !summary) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="inline-flex items-center gap-2 text-muted-foreground text-sm">
          <div className="w-4 h-4 border-2 border-primary border-r-transparent rounded-full animate-spin" />
          Loading earnings…
        </div>
      </div>
    );
  }

  const normalizedRole = (userRole || "").toLowerCase();
  const sidebarRole: "admin" | "awarder" | "member" =
    normalizedRole === "admin"
      ? "admin"
      : normalizedRole === "awarder"
      ? "awarder"
      : "member";

  return (
    <DashboardLayout
      sidebar={{
        userRole: sidebarRole,
        userName: userName || "Member",
        userPrincipal: sidebarPrincipal,
        onDisconnect: () => navigate("/auth"),
      }}
    >
      <header className="h-16 border-b border-border/40 flex items-center justify-between px-6 glass-header">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="mr-4" />
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-green-500/20 to-green-600/20 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <h1 className="text-lg font-semibold text-foreground">My Earnings</h1>
            <p className="text-xs text-muted-foreground">Org: {cid}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <WalletCopyBadge />
          <ThemeToggle />
        </div>
      </header>

      <main className="p-6">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="grid gap-4 md:grid-cols-3">
            {summary.rails.map((rail) => (
              <Card key={rail.symbol} className="glass-card border border-border/60 p-5 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">Rail</p>
                    <p className="text-lg font-semibold">{rail.symbol}</p>
                  </div>
                  <Badge variant="outline">{rail.pending !== "0" ? "Pending" : "Ready"}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Available</p>
                  <p className="text-2xl font-bold text-foreground">{rail.available}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-lg text-muted-foreground">{rail.pending}</p>
                </div>
                <Button className="w-full gap-2" onClick={() => withdraw(rail.symbol)}>
                  <ArrowDownToLine className="w-4 h-4" />
                  Withdraw
                </Button>
              </Card>
            ))}
          </div>

          <Card className="glass-card border border-border/60">
            <div className="flex items-center justify-between border-b border-border/40 px-6 py-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Recent rewards</h2>
                <p className="text-sm text-muted-foreground">History of payouts and pending releases</p>
              </div>
              <Badge variant="secondary">{summary.history.length} entries</Badge>
            </div>
            <div className="divide-y divide-border/60">
              {summary.history.map((event) => (
                <div key={event.id} className="grid sm:grid-cols-[1fr,auto,auto,auto] gap-4 px-6 py-4 items-center">
                  <div>
                    <p className="text-sm font-medium text-foreground">{event.reason}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(event.ts).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Rail</p>
                    <p className="font-medium">{event.rail}</p>
                  </div>
                  <div className="text-sm">
                    <p className="text-muted-foreground">Amount</p>
                    <p className="font-semibold">{event.amount}</p>
                  </div>
                  <div className="text-right">
                    <Badge
                      className={cn(
                        "text-xs",
                        event.status === "paid" ? "bg-green-500/10 text-green-600" : "bg-amber-500/10 text-amber-600"
                      )}
                    >
                      {event.status}
                    </Badge>
                  </div>
                </div>
              ))}

              {!summary.history.length && (
                <div className="text-center text-muted-foreground py-10">No reward events yet.</div>
              )}
            </div>
          </Card>
        </div>
      </main>
    </DashboardLayout>
  );
}
