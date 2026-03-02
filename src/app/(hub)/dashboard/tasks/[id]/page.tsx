import { getTaskById } from "@/features/tasks/queries";
import { fetchEntityPageData } from "@/lib/entity-data";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Edit } from "lucide-react";
import { PageHeader } from "@/components/common";
import { TagsCard } from "@/components/tags/TagsCard";
import { ParentEntityCard } from "@/components/common/ParentEntityCard";
import { parentTaskConfig } from "@/components/tasks/parent-task-config";
import { CommentThread } from "@/components/comments/CommentThread";
import { EntityLinksSection } from "@/components/links/EntityLinksSection";
import { AttachmentsSection } from "@/components/attachments/AttachmentsSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TASK_STATUS_LABELS, TASK_PRIORITY_LABELS } from "@/lib/labels";
import { formatFullDate } from "@/lib/dates";
import { EntityActionButton } from "@/components/common";
import { deleteTask, archiveTask } from "@/features/tasks/actions";

/**
 * Task detail page
 *
 * Features:
 * - View task details
 * - Edit, archive, and delete actions
 * - View related project and subtasks
 */

interface TaskDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TaskDetailPage({ params }: TaskDetailPageProps) {
  const { id } = await params;

  const taskData = await getTaskById(id);

  if (!taskData) {
    notFound();
  }

  // Get current user session
  const session = await getSession();
  if (!session?.user) {
    notFound();
  }

  // Fetch tags, comments, links, and attachments in parallel
  const {
    tags,
    comments: commentsData,
    links,
    attachments,
  } = await fetchEntityPageData("task", id);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={taskData.title}
        description={taskData.description || undefined}
        backButton
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/tasks/${id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <EntityActionButton
              entityType="task"
              entityId={id}
              entityTitle={taskData.title}
              actionType="archive"
              onAction={archiveTask}
            />
            <EntityActionButton
              entityType="task"
              entityId={id}
              entityTitle={taskData.title}
              actionType="delete"
              onAction={deleteTask}
            />
          </>
        }
      />

      {/* Metadata */}
      <div className="flex items-center gap-2 -mt-2">
        <Badge variant="outline">{TASK_STATUS_LABELS[taskData.status]}</Badge>
        {taskData.priority && (
          <Badge variant="outline">{TASK_PRIORITY_LABELS[taskData.priority]}</Badge>
        )}

        {taskData.dueDate && (
          <span className="text-sm text-muted-foreground">
            Due {formatFullDate(taskData.dueDate)}
          </span>
        )}

        {taskData.project && (
          <>
            <span className="text-muted-foreground">•</span>
            <Link
              href={`/dashboard/projects/${taskData.project.id}`}
              className="text-sm text-primary hover:underline"
            >
              {taskData.project.icon} {taskData.project.name}
            </Link>
          </>
        )}
      </div>

      {/* Tags and Parent Task - Side by side (Read-only in view mode) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TagsCard mode="view" entityType="task" initialTags={tags} />
        <ParentEntityCard
          mode="view"
          config={parentTaskConfig}
          parentEntity={taskData.parentTask}
        />
      </div>

      {/* Subtasks Card */}
      {taskData.subtasks && taskData.subtasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Subtasks ({taskData.subtasks.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {taskData.subtasks.map((subtask) => (
                <li key={subtask.id}>
                  <Link
                    href={`/dashboard/tasks/${subtask.id}`}
                    className="flex items-center gap-2 hover:text-primary transition-colors"
                  >
                    <Badge variant="outline" className="text-xs">
                      {TASK_STATUS_LABELS[subtask.status]}
                    </Badge>
                    <span className="text-sm">{subtask.title}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Attachments Section */}
      <AttachmentsSection entityType="task" entityId={id} initialAttachments={attachments} />

      {/* Links Section */}
      <EntityLinksSection entityType="task" entityId={id} initialLinks={links} />

      {/* Comments Section */}
      <CommentThread
        entityType="task"
        entityId={id}
        currentUserId={session.user.id}
        initialComments={commentsData.comments}
      />
    </div>
  );
}
