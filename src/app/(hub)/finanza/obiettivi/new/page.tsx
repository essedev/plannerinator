"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createFinanceGoal } from "@/features/finance/actions";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewFinanceGoalPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      await createFinanceGoal({
        title: fd.get("title") as string,
        description: (fd.get("description") as string) || null,
        category: (fd.get("category") as string) || null,
        currentValue: (fd.get("currentValue") as string) || null,
        targetValue: (fd.get("targetValue") as string) || null,
        targetUnit: (fd.get("targetUnit") as string) || null,
        startDate: (fd.get("startDate") as string) || null,
        targetDate: (fd.get("targetDate") as string) || null,
      });
      router.push("/finanza/obiettivi");
    });
  }

  return (
    <div>
      <PageHeader title="Nuovo obiettivo finanziario" backButton />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="title">Titolo *</Label>
              <Input
                id="title"
                name="title"
                required
                placeholder="Es. Fondo emergenza 10.000 EUR"
                maxLength={255}
              />
            </div>
            <div>
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                name="description"
                rows={3}
                maxLength={2000}
                placeholder="Dettagli sull'obiettivo"
              />
            </div>
            <div>
              <Label htmlFor="category">Categoria</Label>
              <Input
                id="category"
                name="category"
                placeholder="Es. Risparmio, Investimento, Debito"
                maxLength={100}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="currentValue">Valore attuale</Label>
                <Input id="currentValue" name="currentValue" placeholder="0" />
              </div>
              <div>
                <Label htmlFor="targetValue">Valore obiettivo</Label>
                <Input id="targetValue" name="targetValue" placeholder="10000" />
              </div>
              <div>
                <Label htmlFor="targetUnit">Unita</Label>
                <Input id="targetUnit" name="targetUnit" placeholder="EUR" defaultValue="EUR" />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="startDate">Data inizio</Label>
                <Input id="startDate" name="startDate" type="date" />
              </div>
              <div>
                <Label htmlFor="targetDate">Data obiettivo</Label>
                <Input id="targetDate" name="targetDate" type="date" />
              </div>
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvataggio..." : "Crea obiettivo"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
