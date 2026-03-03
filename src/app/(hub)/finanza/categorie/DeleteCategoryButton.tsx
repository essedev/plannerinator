"use client";

import { useTransition } from "react";
import { deleteCategory } from "@/features/finance/actions";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";

interface Props {
  id: string;
  name: string;
}

export function DeleteCategoryButton({ id, name }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-7 w-7 text-destructive"
      disabled={isPending}
      onClick={() => {
        if (confirm(`Eliminare la categoria "${name}"?`)) {
          startTransition(async () => {
            await deleteCategory(id);
          });
        }
      }}
      title="Elimina"
    >
      <Trash2 className="h-3.5 w-3.5" />
    </Button>
  );
}
