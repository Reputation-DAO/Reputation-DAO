import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatTimestamp, daysUntil } from "../model/org.selectors";
import type { OrgRecord } from "../model/org.types";
import { Users, Globe, Lock } from "lucide-react";

type PublicCardProps = {
  org: OrgRecord;
  onSelect?: (id: string) => void;
  onJoin?: (id: string) => void;
};

export const PublicCard = ({ org, onSelect, onJoin }: PublicCardProps) => {
  const expDays = daysUntil(org.expiresAt);
  const expired = expDays !== null && expDays <= 0;

  return (
    <Card
      onClick={() => onSelect?.(org.id)}
      className="cursor-pointer hover:shadow-md transition-all duration-200 p-4 flex flex-col gap-2"
    >
      <CardHeader className="pb-1">
        <div className="flex justify-between items-center">
          <CardTitle className="text-base font-medium truncate">{org.name}</CardTitle>
          <Badge
            variant={org.plan === "Trial" ? "secondary" : "default"}
            className="text-xs capitalize"
          >
            {org.plan}
          </Badge>
        </div>
        <div className="text-xs text-muted-foreground">
          {expired ? <span className="text-destructive">Expired</span> : formatTimestamp(org.expiresAt)}
        </div>
      </CardHeader>

      <CardContent className="flex items-center justify-between text-sm mt-2">
        <div className="flex items-center gap-1 text-muted-foreground">
          <Users className="h-4 w-4" />
          {org.users ?? "-"}
        </div>
        <div className="flex items-center gap-1 text-muted-foreground">
          {org.visibility === "Public" ? (
            <Globe className="h-4 w-4" />
          ) : (
            <Lock className="h-4 w-4" />
          )}
          {org.visibility}
        </div>
      </CardContent>
      <CardFooter className="mt-auto flex justify-end">
        <Button
          variant="default"
          className="h-9 rounded-xl px-4 text-sm font-semibold"
          onClick={(e) => {
            e.stopPropagation();
            onJoin?.(org.id);
          }}
        >
          Join
        </Button>
      </CardFooter>
    </Card>
  );
};
