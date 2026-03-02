"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteBodyMetric } from "@/features/health/actions";
import { formatMetricValue } from "@/features/health/helpers";
import type { BodyMetric } from "@/db/schema";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";

const typeLabels: Record<string, string> = {
  weight: "Peso",
  body_fat: "Grasso corporeo",
  blood_pressure: "Pressione",
  heart_rate: "Frequenza cardiaca",
  waist: "Girovita",
};

export function MetricRow({ metric }: { metric: BodyMetric }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <Badge variant="outline">{typeLabels[metric.metricType] ?? metric.metricType}</Badge>
          <span className="font-medium">{formatMetricValue(metric.value, metric.unit)}</span>
        </div>
        <p className="text-xs text-muted-foreground mt-1">
          {new Date(metric.measuredAt).toLocaleDateString("it-IT", {
            day: "numeric",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
          {metric.notes && ` — ${metric.notes}`}
        </p>
      </div>
      <Button
        variant="ghost"
        size="icon"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await deleteBodyMetric(metric.id);
          });
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
