"use client";

import { useTransition, useRef } from "react";
import { createAnnualRevenue } from "@/features/finance/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export function NewRevenueForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      await createAnnualRevenue({
        year: parseInt(fd.get("year") as string, 10),
        totalRevenue: fd.get("totalRevenue") as string,
        totalExpenses: (fd.get("totalExpenses") as string) || "0",
        notes: fd.get("notes") || null,
      });
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex items-end gap-2 flex-wrap">
      <div className="w-20">
        <Input
          name="year"
          type="number"
          required
          placeholder="Anno"
          defaultValue={new Date().getFullYear()}
        />
      </div>
      <div className="w-28">
        <Input name="totalRevenue" required placeholder="Fatturato" />
      </div>
      <div className="w-28">
        <Input name="totalExpenses" placeholder="Spese" />
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
