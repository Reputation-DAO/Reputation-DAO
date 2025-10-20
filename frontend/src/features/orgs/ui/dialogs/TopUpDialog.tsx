import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OrgRecord } from "../../model/org.types";

type TopUpDialogProps = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  target: OrgRecord | null;
  onTopUp: (amount: bigint) => Promise<void>;
};

export function TopUpDialog({ open, onOpenChange, target, onTopUp }: TopUpDialogProps) {
  const [amount, setAmount] = useState("0");
  const isPending = target?.plan === "BasicPending";

  useEffect(() => {
    if (open) setAmount("0");
  }, [open]);

  const submit = async () => {
    const amt = BigInt((amount || "0").replace(/[^\d]/g, "") || "0");
    if (amt <= 0n) return;
    await onTopUp(amt);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Top up cycles</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="text-xs text-muted-foreground break-all">
            Target: <span className="font-mono">{target?.id}</span>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Amount (cycles, nat)</label>
            <Input
              value={amount}
              onChange={(e) => setAmount(e.target.value.replace(/[^\d]/g, ""))}
              inputMode="numeric"
              autoFocus
              placeholder="100000000000"
              disabled={isPending}
            />
            <p className="text-[11px] text-muted-foreground mt-1">
              {isPending
                ? "Top-ups are disabled until payment activation is complete."
                : "Daily cap applies for Basic plan (1T per day, enforced by the Factory)."}
            </p>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={submit} disabled={isPending}>Top up</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
