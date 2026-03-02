"use client";

import { ConfirmDialog, EntityCardMenu } from "@/components/common";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import {
  archiveProject,
  completeProject,
  deleteProject,
  duplicateProject,
  restoreProject,
} from "@/features/projects/actions";
import { formatDueDate, formatShortDate, getDueDateColorClass } from "@/lib/dates";
import { PROJECT_STATUS_LABELS } from "@/lib/labels";
import { PROJECT_STATUS_COLORS, COMMON_COLORS } from "@/lib/colors";
import { CheckCircle } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useEntityActions } from "@/hooks/use-entity-actions";
import { handleActionError } from "@/lib/error-handler";

interface ProjectCardProps {
  project: {
    id: string;
    name: string;
    description: string | null;
    status: "active" | "on_hold" | "completed" | "archived" | "cancelled";
    color: string | null;
    icon: string | null;
    startDate: Date | string | null;
    endDate: Date | string | null;
    createdAt: Date | string;
    updatedAt: Date | string;
    archivedAt?: Date | null;
  };
}

export function ProjectCard({ project }: ProjectCardProps) {
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
    entityId: project.id,
    entityTitle: project.name,
    entityType: "project",
    actions: {
      delete: deleteProject,
      duplicate: duplicateProject,
      archive: archiveProject,
      restore: restoreProject,
    },
    duplicateRedirectPath: (id) => `/dashboard/projects/${id}`,
  });

  const handleComplete = () => {
    startTransition(async () => {
      try {
        await completeProject(project.id);
        toast.success("Project marked as completed");
      } catch (error) {
        handleActionError(error);
      }
    });
  };

  return (
    <Card className="hover:shadow-md transition-shadow flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/dashboard/projects/${project.id}`} className="flex-1 min-w-0 group">
            <div className="flex items-start gap-3">
              {project.icon && <span className="text-2xl shrink-0">{project.icon}</span>}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold group-hover:text-primary transition-colors truncate">
                  {project.name}
                </h3>
                {project.description && (
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-2 wrap-break-word">
                    {project.description}
                  </p>
                )}
              </div>
            </div>
          </Link>

          <EntityCardMenu
            editHref={`/dashboard/projects/${project.id}`}
            editLabel="View Details"
            isPending={isPending}
            isArchived={!!project.archivedAt}
            onDuplicate={handleDuplicate}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onDelete={() => setShowDeleteDialog(true)}
            extraItems={
              project.status === "active" ? (
                <DropdownMenuItem
                  onClick={handleComplete}
                  disabled={isPending}
                  className="cursor-pointer"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Completed
                </DropdownMenuItem>
              ) : undefined
            }
          />
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          <Badge
            variant="outline"
            className={`${PROJECT_STATUS_COLORS[project.status]} shrink-0`}
            style={{
              borderColor: project.color || undefined,
            }}
          >
            {PROJECT_STATUS_LABELS[project.status]}
          </Badge>

          {project.archivedAt && (
            <Badge variant="outline" className={`${COMMON_COLORS.archived} shrink-0`}>
              Archived
            </Badge>
          )}

          {project.endDate && (
            <Badge
              variant="outline"
              className={`${getDueDateColorClass(project.endDate)} shrink-0`}
            >
              {formatDueDate(project.endDate)}
            </Badge>
          )}

          {project.startDate && (
            <span className="text-xs text-muted-foreground whitespace-nowrap">
              Started {formatShortDate(project.startDate)}
            </span>
          )}
        </div>
      </CardContent>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Project"
        description={`Are you sure you want to delete "${project.name}"? This will also delete all related tasks, events, and notes. This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </Card>
  );
}
