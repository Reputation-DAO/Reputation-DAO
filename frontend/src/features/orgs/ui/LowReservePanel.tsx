import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ShieldAlert, Coins, Settings, Cpu } from "lucide-react";

import type { OrgRecord } from "../model/org.types";
import {
  formatCycles,
  parseCycles,
  percentOfMaxCycles,
} from "../model/org.selectors";
import { MIN_FACTORY_CYCLES } from "../model/org.constants";

type LowReservePanelProps = {
  alerts: OrgRecord[];                         // orgs below MIN_FACTORY_CYCLES
  onTopUp: (org: OrgRecord) => void;           // open top-up dialog
  onOpenWorkspace: (org: OrgRecord) => void;   // navigate to dashboard
};

export function LowReservePanel({ alerts, onTopUp, onOpenWorkspace }: LowReservePanelProps) {
  if (!alerts?.length) return null;

  const sorted = [...alerts].sort(
    (a, b) => Number(parseCycles(a.cycles) - parseCycles(b.cycles))
  );
  const total = sorted.reduce((acc, o) => acc + parseCycles(o.cycles), 0n);
  const avg = sorted.length ? total / BigInt(sorted.length) : 0n;
  const lowest = sorted[0];
  const highest = sorted[sorted.length - 1];

  return (
    <section className="mx-auto max-w-7xl px-6 pb-12">
      <Card className="overflow-hidden border border-border/70 bg-card shadow-sm">
        <div className="border-b border-border/60 bg-muted/60 px-6 py-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.28em] text-primary">
                Reserve monitor
              </div>
              <h3 className="text-xl font-semibold text-foreground">
                Cycle coverage flagged for intervention
              </h3>
              <p className="text-sm text-muted-foreground">
                {sorted.length} organization{sorted.length > 1 ? "s" : ""} are below the{" "}
                {formatCycles(MIN_FACTORY_CYCLES)} buffer. Refill to keep workflows responsive.
              </p>
            </div>
            <Badge
              variant="outline"
              className="rounded-full border-primary/30 bg-primary/10 px-4 py-1.5 text-xs font-medium text-primary"
            >
              <ShieldAlert className="mr-1 h-3.5 w-3.5" />
              Active alerts
            </Badge>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-lg border border-border/60 bg-muted/50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/70">
                Count
              </p>
              <div className="mt-2 text-2xl font-semibold text-foreground">{sorted.length}</div>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/70">
                Lowest reserve
              </p>
              <div className="mt-2 text-2xl font-semibold text-foreground">
                {formatCycles(lowest.cycles)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground/70">{lowest.name}</p>
            </div>
            <div className="rounded-lg border border-border/60 bg-muted/50 p-4">
              <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-muted-foreground/70">
                Average reserve
              </p>
              <div className="mt-2 text-2xl font-semibold text-foreground">
                {formatCycles(avg)}
              </div>
              <p className="mt-1 text-xs text-muted-foreground/70">
                Highest flagged: {formatCycles(highest.cycles)}
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 py-6">
          <ScrollArea className="max-h-[340px] rounded-2xl border border-border/60 bg-card/60">
            <div className="divide-y divide-border/70">
              {sorted.map((org) => {
                const idShort = `${org.id.slice(0, 6)}...${org.id.slice(-6)}`;
                const pct = percentOfMaxCycles(org.cycles);
                const raw = parseCycles(org.cycles);

                return (
                  <div
                    key={org.id}
                    className="grid gap-4 px-5 py-5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)_minmax(0,1fr)] md:items-center"
                  >
                    {/* Left: identity + progress */}
                    <div className="space-y-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-foreground md:text-base">
                            {org.name}
                          </p>
                          <p className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground/65 flex items-center gap-1">
                            <Cpu className="h-3.5 w-3.5" />
                            {idShort}
                          </p>
                        </div>
                        <Badge
                          variant="outline"
                          className="rounded-full bg-muted px-3 py-1 text-[11px] uppercase tracking-wide"
                        >
                          {formatCycles(org.cycles)} cycles
                        </Badge>
                      </div>

                      <div className="space-y-2 rounded-xl border border-sky-500/25 bg-sky-500/5 p-3">
                        <div className="flex items-center justify-between text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-100/70">
                          <span>Reserve capacity</span>
                          <span>{pct}%</span>
                        </div>
                        <Progress value={pct} className="h-1.5 bg-sky-500/20" />
                        <p className="text-xs text-sky-100/60">
                          {raw.toString()} / {formatCycles.rawMax ?? "1.5T"} cycles
                        </p>
                      </div>
                    </div>

                    {/* Middle: status blocks */}
                    <div className="space-y-2 text-xs text-muted-foreground/80">
                      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted px-3 py-2">
                        <span className="uppercase tracking-[0.22em] text-[10px] text-muted-foreground/60">
                          Status
                        </span>
                        <span className="font-medium text-foreground">
                          {org.status === "Active" && !org.isStopped ? "Active" : "Unavailable"}
                        </span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted px-3 py-2">
                        <span className="uppercase tracking-[0.22em] text-[10px] text-muted-foreground/60">
                          Plan
                        </span>
                        <span className="font-medium text-foreground">{org.plan ?? "Basic"}</span>
                      </div>
                      <div className="flex items-center justify-between rounded-lg border border-border/60 bg-muted px-3 py-2">
                        <span className="uppercase tracking-[0.22em] text-[10px] text-muted-foreground/60">
                          Visibility
                        </span>
                        <span className="font-medium text-foreground">{org.visibility ?? "-"}</span>
                      </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <Button
                        variant="default"
                        className="h-10 rounded-xl text-sm font-semibold"
                        onClick={() => onTopUp(org)}
                      >
                        <Coins className="h-4 w-4 mr-2" />
                        Top up
                      </Button>
                      <Button
                        variant="outline"
                        className="h-10 rounded-xl text-sm font-semibold"
                        onClick={() => onOpenWorkspace(org)}
                      >
                        <Settings className="h-4 w-4 mr-2" />
                        Open
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </div>
      </Card>
    </section>
  );
}
