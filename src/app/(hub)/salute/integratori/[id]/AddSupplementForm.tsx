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
import { Textarea } from "@/components/ui/textarea";
import { createSupplement } from "@/features/health/actions";
import { Plus } from "lucide-react";
import { useRef, useTransition } from "react";

export function AddSupplementForm({ protocolId }: { protocolId: string }) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      await createSupplement({
        protocolId,
        name: formData.get("name") as string,
        brand: (formData.get("brand") as string) || null,
        dosage: (formData.get("dosage") as string) || null,
        frequency: (formData.get("frequency") as string) || "daily",
        timeOfDay: (formData.get("timeOfDay") as string) || null,
        notes: (formData.get("notes") as string) || null,
      });
      formRef.current?.reset();
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Aggiungi integratore</CardTitle>
      </CardHeader>
      <CardContent>
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" name="name" placeholder="es. Vitamina D3" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="brand">Marca</Label>
              <Input id="brand" name="brand" placeholder="es. NOW Foods" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="dosage">Dosaggio</Label>
              <Input id="dosage" name="dosage" placeholder="es. 2000 UI" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequenza</Label>
              <Select name="frequency" defaultValue="daily">
                <SelectTrigger id="frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Giornaliero</SelectItem>
                  <SelectItem value="twice_daily">2x al giorno</SelectItem>
                  <SelectItem value="weekly">Settimanale</SelectItem>
                  <SelectItem value="as_needed">Al bisogno</SelectItem>
                  <SelectItem value="custom">Personalizzato</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="timeOfDay">Momento della giornata</Label>
              <Select name="timeOfDay" defaultValue="morning">
                <SelectTrigger id="timeOfDay">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="morning">Mattina</SelectItem>
                  <SelectItem value="afternoon">Pomeriggio</SelectItem>
                  <SelectItem value="evening">Sera</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Note</Label>
            <Textarea id="notes" name="notes" placeholder="Note aggiuntive..." />
          </div>

          <Button type="submit" disabled={isPending}>
            <Plus className="h-4 w-4 mr-2" />
            {isPending ? "Aggiunta..." : "Aggiungi integratore"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
