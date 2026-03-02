"use client";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { TASK_PRIORITY_LABELS } from "@/lib/labels";
import { formatShortDate } from "@/lib/dates";
import { Calendar, Flag, FolderOpen, AlertCircle } from "lucide-react";
import { isPast } from "date-fns";
import { TASK_PRIORITY_BORDER_COLORS } from "@/lib/colors";
import Link from "next/link";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface KanbanCardProps {
  task: {
    id: string;
    title: string;
    priority: "low" | "medium" | "high" | "urgent" | null;
    dueDate: Date | null;
    project?: {
      id: string;
      name: string;
      color: string | null;
    } | null;
  };
}

/**
 * KanbanCard Component
 *
 * Compact card for Kanban board with:
 * - Title
 * - Priority badge
 * - Due date
 * - Project info
 * - Drag & drop support
 */
export function KanbanCard({ task }: KanbanCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const priorityColor = task.priority
    ? TASK_PRIORITY_BORDER_COLORS[task.priority]
    : "border-l-gray-500";
  const isOverdue = task.dueDate && isPast(new Date(task.dueDate));

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <Link href={`/dashboard/tasks/${task.id}`}>
        <Card
          className={`p-3 border-l-4 ${priorityColor} hover:bg-accent cursor-pointer transition-colors`}
        >
          {/* Title */}
          <h4 className="font-medium text-sm line-clamp-2 mb-2">{task.title}</h4>

          {/* Metadata */}
          <div className="space-y-2">
            {/* Priority Badge */}
            {task.priority && (
              <div className="flex items-center gap-2">
                <Flag className="h-3 w-3 text-muted-foreground" />
                <Badge variant="outline" className="text-xs">
                  {TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS]}
                </Badge>
              </div>
            )}

            {/* Due Date */}
            {task.dueDate && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span className={isOverdue ? "text-destructive font-medium" : ""}>
                  {formatShortDate(new Date(task.dueDate))}
                  {isOverdue && <AlertCircle className="inline h-3 w-3 ml-1" />}
                </span>
              </div>
            )}

            {/* Project */}
            {task.project && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <FolderOpen className="h-3 w-3" />
                <span className="truncate">{task.project.name}</span>
              </div>
            )}
          </div>
        </Card>
      </Link>
    </div>
  );
}
