import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function RingKpi({
  title,
  valueLabel,
  subLabel,
  badge,
}: {
  title: string;
  valueLabel: string;
  subLabel?: string;
  badge?: string;
}) {
  return (
    <Card className="border-slate-200">
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs text-muted-foreground">{title}</div>
            <div className="mt-1 text-2xl font-semibold">{valueLabel}</div>
            {subLabel ? <div className="mt-1 text-xs text-muted-foreground">{subLabel}</div> : null}
          </div>

          <div className="flex flex-col items-end gap-2">
            {badge ? <Badge variant="secondary">{badge}</Badge> : null}
            <div className="h-12 w-12 rounded-full border-4 border-slate-200" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
