import React, { useMemo, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";

const WalletCopyBadge: React.FC = () => {
  const { isAuthenticated, principal, authMethod } = useAuth();
  const principalText = useMemo(() => principal?.toText?.() ?? null, [principal]);

  const handleCopy = useCallback(async () => {
    if (!principalText) return;
    try {
      if (typeof navigator === "undefined" || !navigator.clipboard) {
        throw new Error("Clipboard API unavailable");
      }
      const { clipboard } = navigator;
      if (typeof clipboard.writeText !== "function") {
        throw new Error("Clipboard API unavailable");
      }
      await clipboard.writeText(principalText);
      toast.success("Wallet principal copied to clipboard");
    } catch (error) {
      console.error("Failed to copy wallet principal", error);
      toast.error("Unable to copy. Try again.");
    }
  }, [principalText]);

  if (!isAuthenticated || !principalText) return null;

  const label = authMethod === "internetIdentity" ? "II" : "Plug";
  const short = `${principalText.slice(0, 8)}...${principalText.slice(-8)}`;

  return (
    <div className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-3 py-2 backdrop-blur">
      <div className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
      <span className="text-sm font-mono text-muted-foreground">
        {label} · {short}
      </span>
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

export default WalletCopyBadge;
