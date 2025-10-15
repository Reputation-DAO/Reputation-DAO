import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import type { OrgRecord } from "../../model/org.types";

type EditOrgDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  org: OrgRecord | null;
  onToggleVisibility: (childId: string) => Promise<void> | void;
};

export function EditOrgDialog({ open, onOpenChange, org, onToggleVisibility }: EditOrgDialogProps) {
  if (!org) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit organization</DialogTitle>
          <p className="text-xs text-muted-foreground mt-1 break-all">{org.id}</p>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Name</Label>
            <div className="text-sm">{org.name}</div>
          </div>

          <div className="flex items-center gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Status</Label>
              <div className="text-sm">{org.status}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Plan</Label>
              <div className="text-sm">{org.plan ?? "Basic"}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Visibility</Label>
              <div className="text-sm">
                <Badge variant="outline" className="capitalize">{org.visibility ?? "-"}</Badge>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Close</Button>
            <Button onClick={() => onToggleVisibility(org.id)}>
              Toggle visibility
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
