import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { formatCycles, formatTimestamp, daysUntil, percentOfMaxCycles } from "../model/org.selectors";
import type { OrgRecord } from "../model/org.types";
import { Eye, EyeOff, Power, Database, Trash2 } from "lucide-react";

type OwnedCardProps = {
  org: OrgRecord;
  onTogglePower?: (org: OrgRecord) => void;
  onDelete?: (id: string) => void;
  onVisibility?: (id: string) => void;
  onTopUp?: (id: string) => void;
  onManage?: (id: string) => void;
  onViewPayment?: (org: OrgRecord) => void;
};

export const OwnedCard = ({
  org,
  onTogglePower,
  onDelete,
  onVisibility,
  onTopUp,
  onManage,
  onViewPayment,
}: OwnedCardProps) => {
  const pct = percentOfMaxCycles(org.cycles);
  const expDays = daysUntil(org.expiresAt);
  const expired = expDays !== null && expDays <= 0;
  const isTrial = org.plan === "Trial";
  const isPending = org.plan === "BasicPending";
  const canTogglePower = !isPending;
  const planLabel =
    org.plan === "BasicPending" ? "Pending payment" : org.plan ?? "Basic";
  const badgeVariant =
    org.plan === "Trial" ? "secondary" : isPending ? "outline" : "default";

  return (
    <Card className="p-4 flex flex-col gap-2 hover:shadow-md transition-all duration-200">
      <CardHeader className="pb-1">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-medium truncate">{org.name}</CardTitle>
          <Badge
            variant={badgeVariant}
            className="text-xs capitalize"
          >
            {planLabel}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          Created {formatTimestamp(org.createdAt)}
          {" — "}
          {isPending ? (
            <span className="text-amber-500">Awaiting payment</span>
          ) : expired ? (
            <span className="text-destructive">Expired</span>
          ) : (
            formatTimestamp(org.expiresAt)
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span>Cycles</span>
          <span>{formatCycles(org.cycles)}</span>
        </div>
        <Progress value={pct} className="h-2" />
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>Users: {org.users ?? "-"}</span>
          <span>Tx: {org.txCount ?? "-"}</span>
        </div>
        {isPending && (
          <p className="text-[11px] text-amber-500">
            Deposit the Basic subscription payment to activate this organization.
          </p>
        )}
      </CardContent>

      <CardFooter className="flex justify-between items-center gap-2 mt-auto">
        <div className="flex gap-1">
          {!isTrial && !isPending && (
            <Button size="icon" variant="outline" onClick={() => onTopUp?.(org.id)} title="Top up">
              <Database className="h-4 w-4" />
            </Button>
          )}
          <Button size="icon" variant="outline" onClick={() => onVisibility?.(org.id)} title="Toggle visibility">
            {org.visibility === "Public" ? (
              <Eye className="h-4 w-4" />
            ) : (
              <EyeOff className="h-4 w-4" />
            )}
          </Button>
          <Button
            size="icon"
            variant="outline"
            onClick={() => onTogglePower?.(org)}
            disabled={!canTogglePower}
            title={org.isStopped ? "Start" : "Stop"}
          >
            <Power className={`h-4 w-4 ${org.isStopped ? "text-success" : "text-destructive"}`} />
          </Button>
        </div>

        <div className="flex gap-1">
          <Button size="icon" variant="ghost" onClick={() => onDelete?.(org.id)} title="Delete">
            <Trash2 className="h-4 w-4" />
          </Button>
          {isPending ? (
            <Button
              variant="default"
              className="h-9 rounded-xl px-4 text-sm font-semibold"
              onClick={() => onViewPayment?.(org)}
            >
              Pay & Activate
            </Button>
          ) : (
            <Button
              variant="default"
              className="h-9 rounded-xl px-4 text-sm font-semibold"
              onClick={() => onManage?.(org.id)}
            >
              Manage
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
};
