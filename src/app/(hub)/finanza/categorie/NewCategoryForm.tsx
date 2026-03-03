"use client";

import { useTransition, useRef } from "react";
import { createCategory } from "@/features/finance/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface Props {
  type: "income" | "expense";
}

export function NewCategoryForm({ type }: Props) {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      await createCategory({
        name: fd.get("name") as string,
        type,
        icon: fd.get("icon") || null,
      });
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex items-end gap-2">
      <div className="flex-1">
        <Input
          name="name"
          required
          placeholder={
            type === "expense" ? "Es. Alimentari, Trasporti..." : "Es. Stipendio, Freelance..."
          }
        />
      </div>
      <div className="w-16">
        <Input name="icon" placeholder="Icon" maxLength={4} />
      </div>
      <Button type="submit" size="icon" disabled={isPending}>
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}
