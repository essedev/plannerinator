"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { Calendar, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import {
  markTaskComplete,
  markTaskIncomplete,
  deleteTask,
  duplicateTask,
  archiveTask,
  restoreTask,
} from "@/features/tasks/actions";
import { toast } from "sonner";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/lib/labels";
import { formatShortDate, isOverdue } from "@/lib/dates";
import { TASK_PRIORITY_COLORS, TASK_STATUS_COLORS, COMMON_COLORS } from "@/lib/colors";
import { ConfirmDialog, EntityCardMenu } from "@/components/common";
import { useEntityActions } from "@/hooks/use-entity-actions";
import { handleActionError } from "@/lib/error-handler";

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string | null;
    dueDate: Date | null;
    status: "todo" | "in_progress" | "done" | "cancelled";
    priority: "low" | "medium" | "high" | "urgent" | null;
    archivedAt?: Date | null;
    project?: {
      id: string;
      name: string;
      color: string | null;
    } | null;
  };
}

export function TaskCard({ task }: TaskCardProps) {
  const [isCompleted, setIsCompleted] = useState(task.status === "done");

  const {
    isPending,
    startTransition,
    showDeleteDialog,
    setShowDeleteDialog,
    handleDelete,
    handleDuplicate,
    handleArchive,
    handleRestore,
  } = useEntityActions({
    entityId: task.id,
    entityTitle: task.title,
    entityType: "task",
    actions: {
      delete: deleteTask,
      duplicate: duplicateTask,
      archive: archiveTask,
      restore: restoreTask,
    },
    duplicateRedirectPath: (id) => `/dashboard/tasks/${id}`,
  });

  const handleToggleComplete = async () => {
    const newStatus = !isCompleted;
    setIsCompleted(newStatus);

    startTransition(async () => {
      try {
        if (newStatus) {
          await markTaskComplete(task.id);
          toast.success("Task completed!");
        } else {
          await markTaskIncomplete(task.id);
          toast.success("Task reopened");
        }
      } catch (error) {
        setIsCompleted(!newStatus);
        handleActionError(error);
      }
    });
  };

  const isTaskOverdue = task.dueDate && isOverdue(task.dueDate, task.status === "done");

  return (
    <Card className={isCompleted ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Checkbox
            checked={isCompleted}
            onCheckedChange={handleToggleComplete}
            disabled={isPending}
            className="mt-1"
          />

          <div className="flex-1 min-w-0">
            <Link href={`/dashboard/tasks/${task.id}`} className="group">
              <h3
                className={`font-medium hover:text-primary transition-colors ${
                  isCompleted ? "line-through" : ""
                }`}
              >
                {task.title}
              </h3>
            </Link>

            {task.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{task.description}</p>
            )}

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge variant="outline" className={TASK_STATUS_COLORS[task.status]}>
                {TASK_STATUS_LABELS[task.status]}
              </Badge>

              {task.priority && (
                <Badge variant="outline" className={TASK_PRIORITY_COLORS[task.priority]}>
                  {TASK_PRIORITY_LABELS[task.priority]}
                </Badge>
              )}

              {task.archivedAt && (
                <Badge variant="outline" className={COMMON_COLORS.archived}>
                  Archived
                </Badge>
              )}

              {task.project && (
                <Badge variant="outline" style={{ borderColor: task.project.color || undefined }}>
                  {task.project.name}
                </Badge>
              )}

              {task.dueDate && (
                <div
                  className={`flex items-center gap-1 text-xs ${
                    isTaskOverdue ? "text-red-600 dark:text-red-400" : "text-muted-foreground"
                  }`}
                >
                  <Calendar className="h-3 w-3" />
                  <span>{formatShortDate(task.dueDate)}</span>
                  {isTaskOverdue && <span className="font-medium">(Overdue)</span>}
                </div>
              )}
            </div>
          </div>

          <EntityCardMenu
            editHref={`/dashboard/tasks/${task.id}`}
            isPending={isPending}
            isArchived={!!task.archivedAt}
            onDuplicate={handleDuplicate}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onDelete={() => setShowDeleteDialog(true)}
            extraItems={
              <DropdownMenuItem onClick={handleToggleComplete} disabled={isPending}>
                <CheckCircle2 className="h-4 w-4 mr-2" />
                {isCompleted ? "Mark Incomplete" : "Mark Complete"}
              </DropdownMenuItem>
            }
          />
        </div>
      </CardContent>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Task"
        description={`Are you sure you want to delete "${task.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </Card>
  );
}
