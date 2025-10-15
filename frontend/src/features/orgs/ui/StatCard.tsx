import { Card } from "@/components/ui/card";
import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  icon: LucideIcon;
  label: string;
  value: string;
  hint?: string;
  tone?: "default" | "accent";
};

export function StatCard({ icon: Icon, label, value, hint, tone = "default" }: StatCardProps) {
  return (
    <Card
      className={[
        "relative overflow-hidden border border-border bg-card p-5 shadow-sm transition-all duration-300 hover:-translate-y-[1px]",
        tone === "accent" ? "border-primary/40 bg-primary/5" : "",
      ].join(" ")}
    >
      <div className="flex items-center justify-between gap-6">
        <div>
          <span className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/70">
            {label}
          </span>
          <div className="mt-3 text-2xl font-semibold text-foreground">{value}</div>
          {hint && <p className="mt-2 text-xs text-muted-foreground/80">{hint}</p>}
        </div>
        <div
          className={[
            "flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground",
            tone === "accent" ? "border-primary/30 bg-primary/10 text-primary" : "",
          ].join(" ")}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </Card>
  );
}
