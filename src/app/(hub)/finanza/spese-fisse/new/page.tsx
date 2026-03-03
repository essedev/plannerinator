"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { createFixedExpenseGroup } from "@/features/finance/actions";
import { PageHeader } from "@/components/common/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function NewFixedExpenseGroupPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const name = fd.get("name") as string;
    const description = (fd.get("description") as string) || undefined;

    startTransition(async () => {
      await createFixedExpenseGroup({ name, description });
      router.push("/finanza/spese-fisse");
    });
  }

  return (
    <div>
      <PageHeader title="Nuovo gruppo spese fisse" backButton />

      <Card>
        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome *</Label>
              <Input
                id="name"
                name="name"
                required
                placeholder="Es. Affitto & Casa, Abbonamenti"
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
                placeholder="Descrizione opzionale del gruppo"
              />
            </div>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Salvataggio..." : "Crea gruppo"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
