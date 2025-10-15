import { Card } from "@/components/ui/card";
import { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

type EmptyStateProps = {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: LucideIcon;
  className?: string;
};

export function EmptyState({
  title,
  description,
  action,
  icon: Icon,
  className = "",
}: EmptyStateProps) {
  return (
    <Card className={`border border-border bg-card p-12 text-center shadow-lg ${className}`}>
      {Icon ? (
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
          <Icon className="h-7 w-7" />
        </div>
      ) : null}
      <h3 className="mt-6 text-xl font-semibold text-foreground">{title}</h3>
      <p className="mt-3 text-sm text-muted-foreground/80">{description}</p>
      {action && <div className="mt-6 flex justify-center">{action}</div>}
    </Card>
  );
}
