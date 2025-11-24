import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function DepositWarning() {
  return (
    <Alert className="border-red-500 bg-red-50 dark:bg-red-950">
      <AlertTriangle className="h-4 w-4 text-red-600" />
      <AlertDescription className="text-red-800 dark:text-red-200">
        <strong>SECURITY WARNING:</strong> The current deposit system is broken and accepts fake deposits. 
        Do not use this feature until it's fixed with proper ledger verification.
      </AlertDescription>
    </Alert>
  );
}
