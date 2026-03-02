"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createHealthGoal } from "@/features/health/actions";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function NewHealthGoalPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      await createHealthGoal({
        title: formData.get("title") as string,
        description: (formData.get("description") as string) || null,
        category: (formData.get("category") as string) || null,
        targetValue: (formData.get("targetValue") as string) || null,
        targetUnit: (formData.get("targetUnit") as string) || null,
        currentValue: (formData.get("currentValue") as string) || null,
        startDate: (formData.get("startDate") as string) || null,
        targetDate: (formData.get("targetDate") as string) || null,
      });
      router.push("/salute/obiettivi");
    });
  }

  return (
    <div>
      <PageHeader
        title="Nuovo obiettivo"
        description="Definisci un nuovo obiettivo di salute."
        backButton
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Titolo *</Label>
              <Input id="title" name="title" placeholder="es. Raggiungere 75kg" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Descrizione dell'obiettivo..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Input id="category" name="category" placeholder="es. peso, fitness, nutrizione" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="currentValue">Valore attuale</Label>
                <Input id="currentValue" name="currentValue" placeholder="es. 80" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetValue">Valore obiettivo</Label>
                <Input id="targetValue" name="targetValue" placeholder="es. 75" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetUnit">Unità</Label>
                <Input id="targetUnit" name="targetUnit" placeholder="es. kg" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data inizio</Label>
                <Input id="startDate" name="startDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetDate">Data obiettivo</Label>
                <Input id="targetDate" name="targetDate" type="date" />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creazione..." : "Crea obiettivo"}
              </Button>
              <Button type="button" variant="outline" onClick={() => router.back()}>
                Annulla
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
