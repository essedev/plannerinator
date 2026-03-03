"use client";

import { useTransition, useRef } from "react";
import { createClient } from "@/features/finance/actions";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

export function NewClientForm() {
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);

    startTransition(async () => {
      await createClient({
        name: fd.get("name") as string,
        email: fd.get("email") || null,
        company: fd.get("company") || null,
        defaultRate: fd.get("defaultRate") || null,
      });
      formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="flex items-end gap-2 flex-wrap">
      <div className="flex-1 min-w-[120px]">
        <Input name="name" required placeholder="Nome cliente" />
      </div>
      <div className="w-40">
        <Input name="email" type="email" placeholder="Email" />
      </div>
      <div className="w-28">
        <Input name="company" placeholder="Azienda" />
      </div>
      <div className="w-24">
        <Input name="defaultRate" placeholder="Tariffa" />
      </div>
      <Button type="submit" size="icon" disabled={isPending}>
        <Plus className="h-4 w-4" />
      </Button>
    </form>
  );
}
