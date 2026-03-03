"use client";

import { useRef, useTransition } from "react";
import { upsertBudget } from "@/features/finance/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface Props {
  categories: Array<{ id: string; name: string }>;
  month: string;
}

export function BudgetForm({ categories, month }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const categoryId = fd.get("categoryId") as string;
    const plannedAmount = fd.get("plannedAmount") as string;

    startTransition(async () => {
      await upsertBudget({ categoryId, month, plannedAmount });
      formRef.current?.reset();
    });
  }

  if (categories.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nessuna categoria di spesa disponibile. Crea prima delle categorie.
      </p>
    );
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1">
        <select
          name="categoryId"
          required
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        >
          <option value="">Seleziona categoria</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="w-32">
        <Input
          name="plannedAmount"
          type="number"
          step="0.01"
          min="0"
          placeholder="Importo"
          required
          className="h-9"
        />
      </div>
      <Button type="submit" size="sm" disabled={isPending}>
        <Plus className="h-4 w-4 mr-1" />
        Aggiungi
      </Button>
    </form>
  );
}
