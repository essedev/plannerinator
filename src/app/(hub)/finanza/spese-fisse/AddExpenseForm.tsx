"use client";

import { useRef, useTransition } from "react";
import { createFixedExpense } from "@/features/finance/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface Props {
  groupId: string;
}

export function AddExpenseForm({ groupId }: Props) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    const name = fd.get("name") as string;
    const amount = fd.get("amount") as string;
    const frequency = (fd.get("frequency") as string) || "monthly";

    startTransition(async () => {
      await createFixedExpense({ groupId, name, amount, frequency });
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1">
        <Input name="name" placeholder="Nome spesa" required className="h-8 text-sm" />
      </div>
      <div className="w-28">
        <Input
          name="amount"
          type="number"
          step="0.01"
          min="0"
          placeholder="Importo"
          required
          className="h-8 text-sm"
        />
      </div>
      <div className="w-32">
        <select
          name="frequency"
          defaultValue="monthly"
          className="flex h-8 w-full rounded-md border border-input bg-transparent px-2 text-sm"
        >
          <option value="monthly">Mensile</option>
          <option value="bimonthly">Bimestrale</option>
          <option value="quarterly">Trimestrale</option>
          <option value="semiannual">Semestrale</option>
          <option value="annual">Annuale</option>
        </select>
      </div>
      <Button type="submit" size="sm" variant="outline" disabled={isPending}>
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}
