import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Sparkles, Copy } from "lucide-react";
import { toast } from "sonner";
import { principalToAccountIdentifier } from "@/utils/accountIdentifier";

type CreateOrgDialogProps = {
  creating: boolean;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary";
  triggerClassName?: string;

  onCreateTrial: (note: string) => Promise<void>;
  onCreateBasic: (note: string) => Promise<BasicReservation>;
  /** Optional admin/advanced path calling factory.createOrReuseChildFor */
  onCreateAdvanced?: (cycles: bigint, note: string) => Promise<void>;
};

type BasicReservation = {
  id: string;
  payment: {
    account_owner: string;
    subaccount_hex: string;
    amount_e8s: bigint;
    memo?: string;
  };
};

const formatIcp = (amount: bigint): string => {
  const whole = amount / 100_000_000n;
  const frac = amount % 100_000_000n;
  if (frac === 0n) return `${whole.toString()} ICP`;
  const fracStr = frac.toString().padStart(8, "0").replace(/0+$/, "");
  return `${whole.toString()}.${fracStr} ICP`;
};

export function CreateOrgDialog({
  creating,
  triggerLabel = "Create organization",
  triggerVariant = "default",
  triggerClassName,
  onCreateTrial,
  onCreateBasic,
  onCreateAdvanced,
}: CreateOrgDialogProps) {
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");
  const [cycles, setCycles] = useState("600000000000"); // sensible default (600G)
  const [mode, setMode] = useState<"trial" | "basic" | "advanced">("basic");
  const [paymentResult, setPaymentResult] = useState<BasicReservation | null>(null);

  const reset = () => {
    setNote("");
    setCycles("600000000000");
    setMode("basic");
    setPaymentResult(null);
  };

  useEffect(() => {
    if (!open) {
      reset();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    if (mode !== "basic") {
      setPaymentResult(null);
    }
  }, [mode]);

  const copyValue = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      toast.message(`${label} copied`);
    } catch (e: any) {
      toast.error(e?.message || `Failed to copy ${label.toLowerCase()}`);
    }
  };

  const act = async () => {
    const n = note.trim() || "New organization";
    if (mode === "trial") {
      await onCreateTrial(n);
      reset();
      setOpen(false);
      return;
    } else if (mode === "basic") {
      const res = await onCreateBasic(n);
      setPaymentResult(res);
      setNote(n);
      return;
    } else if (mode === "advanced" && onCreateAdvanced) {
      const amt = BigInt((cycles || "0").replace(/[^\d]/g, "") || "0");
      await onCreateAdvanced(amt, n);
      reset();
      setOpen(false);
      return;
    }
  };

  const disableLaunch =
    creating ||
    (mode === "advanced" && !onCreateAdvanced) ||
    (mode === "basic" && Boolean(paymentResult));

  const primaryLabel = mode === "basic" ? "Reserve" : "Launch";
  const paymentAccountIdentifier = paymentResult
    ? principalToAccountIdentifier(
        paymentResult.payment.account_owner,
        paymentResult.payment.subaccount_hex
      )
    : "";

  return (
    <Dialog open={open} onOpenChange={(v) => !creating && setOpen(v)}>
      <DialogTrigger asChild>
        <Button
          variant={triggerVariant}
          className={triggerClassName}
          disabled={creating}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {triggerLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-xl">Launch an organization</DialogTitle>
          <p className="text-sm text-muted-foreground">
            Create a managed reputation canister from the Factory. Trial grants 1T cycles for 30 days; Basic renews via payment.
          </p>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as typeof mode)}>
          <TabsList className="w-full">
            <TabsTrigger value="basic" className="flex-1">Basic</TabsTrigger>
            <TabsTrigger value="trial" className="flex-1">Trial</TabsTrigger>
            <TabsTrigger value="advanced" className="flex-1" disabled={!onCreateAdvanced}>
              Advanced
            </TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4">
            <div className="space-y-2">
              <Label htmlFor="org-note">Organization name</Label>
              <Input
                id="org-note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Orbit Labs"
              />
            </div>

            {mode === "advanced" && (
              <div className="space-y-2">
                <Label htmlFor="cycles">Attach cycles (nat)</Label>
                <Input
                  id="cycles"
                  inputMode="numeric"
                  value={cycles}
                  onChange={(e) => setCycles(e.target.value.replace(/[^\d]/g, ""))}
                  placeholder="600000000000"
                />
                <p className="text-[11px] text-muted-foreground">
                  Feature still in development. Advanced path calls <code>createOrReuseChildFor</code>; Factory enforces floors/headroom internally.
                </p>
              </div>
            )}

            {mode === "basic" && paymentResult && (
              <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-3">
                <div>
                  <h4 className="text-sm font-semibold text-primary">Payment required</h4>
                  <p className="text-xs text-muted-foreground">
                    Deposit the Basic subscription payment to activate <span className="font-medium">{paymentResult.id}</span>.
                  </p>
                </div>

                {paymentResult.payment.memo && (
                  <div className="text-xs font-semibold uppercase tracking-[0.22em] text-muted-foreground/70">
                    {paymentResult.payment.memo}
                  </div>
                )}

                <div className="space-y-2">
                  <span className="text-xs uppercase text-muted-foreground">Account identifier (Plug)</span>
                  <div className="flex items-center gap-2">
                    <code className="text-[11px] break-all flex-1">{paymentAccountIdentifier}</code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => paymentAccountIdentifier && copyValue(paymentAccountIdentifier, "Account identifier")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs uppercase text-muted-foreground">Account owner (principal)</span>
                  <div className="flex items-center gap-2">
                    <code className="text-[11px] break-all flex-1">{paymentResult.payment.account_owner}</code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyValue(paymentResult.payment.account_owner, "Account owner")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-xs uppercase text-muted-foreground">Subaccount (hex)</span>
                  <div className="flex items-center gap-2">
                    <code className="text-[11px] break-all flex-1">{paymentResult.payment.subaccount_hex}</code>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyValue(paymentResult.payment.subaccount_hex, "Subaccount")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Amount</span>
                  <span className="font-semibold text-foreground">
                    {formatIcp(paymentResult.payment.amount_e8s)} ({paymentResult.payment.amount_e8s.toString()} e8s)
                  </span>
                </div>

                <p className="text-[11px] text-muted-foreground">
                  After depositing, return to the organizations list and choose <span className="font-medium">Pay & Activate</span> on your card.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={creating}>
                {paymentResult ? "Close" : "Cancel"}
              </Button>
              {!paymentResult && (
                <Button
                  onClick={act}
                  disabled={disableLaunch}
                  title={mode === "advanced" ? "Feature still in development" : undefined}
                >
                  {creating ? "Provisioning…" : primaryLabel}
                </Button>
              )}
            </div>
          </div>

          <TabsContent value="basic" />
          <TabsContent value="trial" />
          <TabsContent value="advanced" />
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
