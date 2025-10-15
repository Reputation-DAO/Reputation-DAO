import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type LoadingCardsProps = {
  count?: number;
  variant?: "owned" | "compact";
};

export function LoadingCards({ count = 3, variant = "owned" }: LoadingCardsProps) {
  return (
    <div
      className={
        variant === "compact"
          ? "grid gap-6 md:grid-cols-2 xl:grid-cols-3"
          : "grid grid-cols-1 gap-6"
      }
    >
      {Array.from({ length: count }).map((_, idx) => (
        <Card key={idx} className="border border-border bg-card/80 p-6 shadow-sm">
          <div className="space-y-5">
            <div className="flex items-start gap-3">
              <Skeleton className="h-12 w-12 rounded-xl bg-muted" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-2/3 bg-muted" />
                <Skeleton className="h-3 w-1/2 bg-muted/70" />
              </div>
            </div>
            <Skeleton className="h-24 w-full rounded-xl bg-muted/70" />
            <div className={variant === "compact" ? "grid grid-cols-2 gap-3" : "grid grid-cols-3 gap-3"}>
              <Skeleton className="h-14 rounded-lg bg-muted/70" />
              <Skeleton className="h-14 rounded-lg bg-muted/70" />
              {variant === "owned" && <Skeleton className="h-14 rounded-lg bg-muted/70" />}
            </div>
            <Skeleton
              className={variant === "compact" ? "h-10 w-1/2 rounded-lg bg-muted/70" : "h-10 w-full rounded-lg bg-muted/70"}
            />
          </div>
        </Card>
      ))}
    </div>
  );
}
