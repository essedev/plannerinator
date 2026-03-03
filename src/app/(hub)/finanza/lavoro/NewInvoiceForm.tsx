"use client";

import { useTransition, useRef } from "react";
import { createRecurringInvoice } from "@/features/finance/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface Props {
  clients: { id: string; name: string }[];
}

export function NewInvoiceForm({ clients }: Props) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      await createRecurringInvoice({
        clientId: fd.get("clientId") as string,
        description: fd.get("description") as string,
        amount: fd.get("amount") as string,
        frequency: (fd.get("frequency") as string) || "monthly",
      });
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex items-end gap-2 flex-wrap">
      <div className="w-36">
        <select
          name="clientId"
          required
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          <option value="">Cliente...</option>
          {clients.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex-1 min-w-[120px]">
        <Input name="description" required placeholder="Descrizione" />
      </div>
      <div className="w-24">
        <Input name="amount" required placeholder="Importo" />
      </div>
      <div className="w-32">
        <select
          name="frequency"
          className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm"
        >
          <option value="monthly">Mensile</option>
          <option value="bimonthly">Bimestrale</option>
          <option value="quarterly">Trimestrale</option>
          <option value="semiannual">Semestrale</option>
          <option value="annual">Annuale</option>
        </select>
      </div>
      <Button type="submit" size="icon" disabled={isPending}>
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}
