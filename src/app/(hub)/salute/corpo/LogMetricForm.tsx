"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { logBodyMetric } from "@/features/health/actions";
import { Plus } from "lucide-react";
import { useRef, useState, useTransition } from "react";

const commonMetrics = [
  { type: "weight", label: "Peso", unit: "kg" },
  { type: "body_fat", label: "Grasso corporeo", unit: "%" },
  { type: "blood_pressure", label: "Pressione arteriosa", unit: "mmHg" },
  { type: "heart_rate", label: "Frequenza cardiaca", unit: "bpm" },
  { type: "waist", label: "Girovita", unit: "cm" },
  { type: "custom", label: "Personalizzato", unit: "" },
];

export function LogMetricForm() {
  const [isPending, startTransition] = useTransition();
  const [metricType, setMetricType] = useState("weight");
  const formRef = useRef<HTMLFormElement>(null);

  const selectedMetric = commonMetrics.find((m) => m.type === metricType);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const type = metricType === "custom" ? (formData.get("customType") as string) : metricType;

    startTransition(async () => {
      await logBodyMetric({
        metricType: type,
        value: formData.get("value") as string,
        unit: (formData.get("unit") as string) || selectedMetric?.unit || null,
        notes: (formData.get("notes") as string) || null,
      });
      formRef.current?.reset();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Registra metrica</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Tipo</Label>
              <Select value={metricType} onValueChange={setMetricType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {commonMetrics.map((m) => (
                    <SelectItem key={m.type} value={m.type}>
                      {m.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {metricType === "custom" && (
              <div className="space-y-2">
                <Label htmlFor="customType">Nome metrica *</Label>
                <Input id="customType" name="customType" placeholder="es. glucosio" required />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="value">Valore *</Label>
              <Input
                id="value"
                name="value"
                placeholder={selectedMetric?.unit ? `es. in ${selectedMetric.unit}` : "Valore"}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="unit">Unità</Label>
              <Input
                id="unit"
                name="unit"
                defaultValue={selectedMetric?.unit}
                placeholder="Unità di misura"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Note</Label>
            <Input id="notes" name="notes" placeholder="Note opzionali..." />
          </div>

          <Button type="submit" disabled={isPending}>
            <Plus className="h-4 w-4 mr-2" />
            {isPending ? "Registrazione..." : "Registra"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
