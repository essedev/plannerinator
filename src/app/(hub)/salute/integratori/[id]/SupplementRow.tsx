"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { deleteSupplement, updateSupplement } from "@/features/health/actions";
import { Switch } from "@/components/ui/switch";
import type { Supplement } from "@/db/schema";
import { Trash2 } from "lucide-react";
import { useTransition } from "react";

const frequencyLabels: Record<string, string> = {
  daily: "Giornaliero",
  twice_daily: "2x/giorno",
  weekly: "Settimanale",
  as_needed: "Al bisogno",
  custom: "Personalizzato",
};

const timeLabels: Record<string, string> = {
  morning: "Mattina",
  afternoon: "Pomeriggio",
  evening: "Sera",
};

export function SupplementRow({ supplement: s }: { supplement: Supplement }) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg border">
      <Switch
        checked={s.isActive}
        disabled={isPending}
        onCheckedChange={(checked) => {
          startTransition(async () => {
            await updateSupplement(s.id, { isActive: checked });
          });
        }}
      />
      <div className="flex-1 min-w-0">
        <p className="font-medium">{s.name}</p>
        <div className="flex flex-wrap gap-1 mt-1">
          {s.dosage && (
            <Badge variant="outline" className="text-xs">
              {s.dosage}
            </Badge>
          )}
          {s.brand && (
            <Badge variant="outline" className="text-xs">
              {s.brand}
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            {frequencyLabels[s.frequency] ?? s.frequency}
          </Badge>
          {s.timeOfDay && (
            <Badge variant="secondary" className="text-xs">
              {timeLabels[s.timeOfDay] ?? s.timeOfDay}
            </Badge>
          )}
        </div>
        {s.notes && <p className="text-xs text-muted-foreground mt-1">{s.notes}</p>}
      </div>
      <Button
        variant="ghost"
        size="icon"
        disabled={isPending}
        onClick={() => {
          startTransition(async () => {
            await deleteSupplement(s.id);
          });
        }}
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
