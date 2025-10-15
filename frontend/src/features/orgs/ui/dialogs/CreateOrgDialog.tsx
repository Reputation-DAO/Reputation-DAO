import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Sparkles } from "lucide-react";

type CreateOrgDialogProps = {
  creating: boolean;
  triggerLabel?: string;
  triggerVariant?: "default" | "outline" | "secondary";
  triggerClassName?: string;

  onCreateTrial: (note: string) => Promise<void>;
  onCreateBasic: (note: string) => Promise<void>;
  /** Optional admin/advanced path calling factory.createOrReuseChildFor */
  onCreateAdvanced?: (cycles: bigint, note: string) => Promise<void>;
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

  const reset = () => {
    setNote("");
    setCycles("600000000000");
    setMode("basic");
  };

  const act = async () => {
    const n = note.trim() || "New organization";
    if (mode === "trial") {
      await onCreateTrial(n);
    } else if (mode === "basic") {
      await onCreateBasic(n);
    } else if (mode === "advanced" && onCreateAdvanced) {
      const amt = BigInt((cycles || "0").replace(/[^\d]/g, "") || "0");
      await onCreateAdvanced(amt, n);
    }
    reset();
    setOpen(false);
  };

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
            Create a managed reputation canister from the Factory. Choose Trial (1T for 30 days) or Basic (paid, extendable).
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
                  Advanced path calls <code>createOrReuseChildFor</code>. Factory enforces floors/headroom internally.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={creating}>
                Cancel
              </Button>
              <Button onClick={act} disabled={creating || (mode === "advanced" && !onCreateAdvanced)}>
                {creating ? "Provisioning…" : "Launch"}
              </Button>
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
