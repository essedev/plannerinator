"use client";

import { useTransition } from "react";
import { markF24Paid, deleteF24Payment } from "@/features/finance/actions";
import { Button } from "@/components/ui/button";
import { Check, Trash2 } from "lucide-react";

interface Props {
  id: string;
}

export function F24Actions({ id }: Props) {
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            await markF24Paid(id);
          })
        }
        title="Segna come pagato"
      >
        <Check className="h-3.5 w-3.5" />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-destructive"
        disabled={isPending}
        onClick={() => startTransition(() => deleteF24Payment(id))}
        title="Elimina"
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
}
