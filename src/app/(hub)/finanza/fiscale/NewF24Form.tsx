"use client";

import { useTransition, useRef } from "react";
import { createF24Payment } from "@/features/finance/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export function NewF24Form() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      await createF24Payment({
        date: fd.get("date") as string,
        totalAmount: fd.get("totalAmount") as string,
        period: fd.get("period") || null,
        notes: fd.get("notes") || null,
      });
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex items-end gap-2 flex-wrap">
      <div className="flex-1 min-w-[120px]">
        <Input name="date" type="date" required placeholder="Scadenza" />
      </div>
      <div className="w-28">
        <Input name="totalAmount" required placeholder="Importo" />
      </div>
      <div className="w-28">
        <Input name="period" placeholder="Periodo" />
      </div>
      <div className="flex-1 min-w-[100px]">
        <Input name="notes" placeholder="Note" />
      </div>
      <Button type="submit" size="icon" disabled={isPending}>
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}
