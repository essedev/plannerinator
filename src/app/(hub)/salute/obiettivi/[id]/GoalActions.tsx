"use client";

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
} from "@/components/ui/alert-dialog";
import { updateHealthGoal, deleteHealthGoal } from "@/features/health/actions";
import type { Goal } from "@/db/schema";
import { MoreHorizontal, Trash2, Pause, Play, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

export function GoalActions({ goal }: { goal: Goal }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  function handleStatusChange(status: string) {
    startTransition(async () => {
      await updateHealthGoal(goal.id, { status });
    });
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="icon" disabled={isPending}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {goal.status !== "completed" && (
            <DropdownMenuItem onClick={() => handleStatusChange("completed")}>
              <CheckCircle className="mr-2 h-4 w-4" />
              Segna come completato
            </DropdownMenuItem>
          )}
          {goal.status === "active" && (
            <DropdownMenuItem onClick={() => handleStatusChange("paused")}>
              <Pause className="mr-2 h-4 w-4" />
              Metti in pausa
            </DropdownMenuItem>
          )}
          {goal.status === "paused" && (
            <DropdownMenuItem onClick={() => handleStatusChange("active")}>
              <Play className="mr-2 h-4 w-4" />
              Riattiva
            </DropdownMenuItem>
          )}
          <DropdownMenuItem onClick={() => setShowDeleteDialog(true)} className="text-destructive">
            <Trash2 className="mr-2 h-4 w-4" />
            Elimina
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminare l&apos;obiettivo?</AlertDialogTitle>
            <AlertDialogDescription>
              L&apos;obiettivo &quot;{goal.title}&quot; verrà eliminato.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annulla</AlertDialogCancel>
            <AlertDialogAction
              disabled={isPending}
              onClick={() => {
                startTransition(async () => {
                  await deleteHealthGoal(goal.id);
                  router.push("/salute/obiettivi");
                });
              }}
            >
              Elimina
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
