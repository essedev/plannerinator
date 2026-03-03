"use client";

import { useRouter } from "next/navigation";
import { useTransition } from "react";
import { updateFinanceGoal, deleteFinanceGoal } from "@/features/finance/actions";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { MoreHorizontal } from "lucide-react";
import type { Goal } from "@/db/schema";

interface Props {
  goal: Goal;
}

export function GoalActions({ goal }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  function handleStatusChange(status: string) {
    startTransition(async () => {
      await updateFinanceGoal(goal.id, { status });
      router.refresh();
    });
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteFinanceGoal(goal.id);
      router.push("/finanza/obiettivi");
    });
  }

  return (
    <AlertDialog>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" disabled={isPending}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {goal.status !== "completed" && (
            <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
              Segna completato
            </DropdownMenuItem>
          )}
          {goal.status === "active" && (
            <DropdownMenuItem onClick={() => handleStatusChange("paused")}>
              Metti in pausa
            </DropdownMenuItem>
          )}
          {goal.status === "paused" && (
            <DropdownMenuItem onClick={() => handleStatusChange("active")}>
              Riprendi
            </DropdownMenuItem>
          )}
          <AlertDialogTrigger asChild>
            <DropdownMenuItem className="text-destructive">Elimina</DropdownMenuItem>
          </AlertDialogTrigger>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Eliminare questo obiettivo?</AlertDialogTitle>
          <AlertDialogDescription>
            L&apos;obiettivo &quot;{goal.title}&quot; verra eliminato.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Annulla</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>Elimina</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
