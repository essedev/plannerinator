"use client";

import { PageHeader } from "@/components/common/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProtocol } from "@/features/health/actions";
import { useRouter } from "next/navigation";
import { useTransition } from "react";

export default function NewProtocolPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    startTransition(async () => {
      const result = await createProtocol({
        name: formData.get("name") as string,
        description: (formData.get("description") as string) || null,
        startDate: (formData.get("startDate") as string) || null,
        endDate: (formData.get("endDate") as string) || null,
      });
      router.push(`/salute/integratori/${result.id}`);
    });
  }

  return (
    <div>
      <PageHeader
        title="Nuovo protocollo"
        description="Crea un nuovo protocollo di integrazione."
        backButton
      />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome *</Label>
              <Input id="name" name="name" placeholder="es. Stack mattutino" required />
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descrizione</Label>
              <Textarea
                id="description"
                name="description"
                placeholder="Descrizione del protocollo..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Data inizio</Label>
                <Input id="startDate" name="startDate" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">Data fine</Label>
                <Input id="endDate" name="endDate" type="date" />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isPending}>
                {isPending ? "Creazione..." : "Crea protocollo"}
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
