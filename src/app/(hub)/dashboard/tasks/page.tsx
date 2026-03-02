import { getTasks } from "@/features/tasks/queries";
import { PageHeader, Pagination } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { TasksView } from "@/components/tasks/TasksView";
import { TaskFilters } from "@/components/tasks/TaskFilters";
import type { TaskStatus, TaskPriority, TaskFilterInput } from "@/features/tasks/schema";

/**
 * Tasks list page
 *
 * Features:
 * - Display all user tasks
 * - Filter by status, priority, project, date
 * - Sort tasks
 * - Toggle between List and Kanban view
 * - Quick actions (complete, delete)
 * - Create new task
 */

interface TasksPageProps {
  searchParams: Promise<{
    view?: string;
    status?: string;
    priority?: string;
    projectId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    tags?: string;
    tagLogic?: string;
    offset?: string;
  }>;
}

export default async function TasksPage({ searchParams }: TasksPageProps) {
  const params = await searchParams;

  // Parse tag IDs from comma-separated string
  const tagIds = params.tags ? params.tags.split(",").filter(Boolean) : undefined;

  // Fetch tasks with filters from URL params
  const { tasks, pagination } = await getTasks({
    view: params.view as TaskFilterInput["view"],
    status: params.status as TaskStatus | undefined,
    priority: params.priority as TaskPriority | undefined,
    projectId: params.projectId,
    search: params.search,
    tagIds,
    tagLogic: params.tagLogic as "AND" | "OR" | undefined,
    sortBy: params.sortBy as TaskFilterInput["sortBy"],
    sortOrder: params.sortOrder as TaskFilterInput["sortOrder"],
    offset: params.offset ? parseInt(params.offset) : 0,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader title="Tasks" description={`${pagination.total} total tasks`} />
        <Button asChild>
          <Link href="/dashboard/tasks/new">
            <Plus className="h-4 w-4 mr-2" />
            New Task
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <TaskFilters />

      {/* Tasks View (List or Kanban) */}
      <TasksView tasks={tasks} />

      {/* Pagination */}
      <Pagination total={pagination.total} limit={pagination.limit} offset={pagination.offset} />
    </div>
  );
}
