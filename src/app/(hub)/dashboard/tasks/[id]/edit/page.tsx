import { notFound } from "next/navigation";
import { PageHeader } from "@/components/common";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TagsCard } from "@/components/tags/TagsCard";
import { ParentEntityCard } from "@/components/common/ParentEntityCard";
import { parentTaskConfig } from "@/components/tasks/parent-task-config";
import { CommentThread } from "@/components/comments/CommentThread";
import { EntityLinksSection } from "@/components/links/EntityLinksSection";
import { AttachmentsSection } from "@/components/attachments/AttachmentsSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TASK_STATUS_LABELS } from "@/lib/labels";
import { getTaskById } from "@/features/tasks/queries";
import { fetchEntityPageData } from "@/lib/entity-data";
import { getSession } from "@/lib/auth";
import Link from "next/link";

/**
 * Task Edit Page
 *
 * Features:
 * - Edit task details
 * - Manage tags, comments, links, and attachments
 */

interface EditTaskPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditTaskPage({ params }: EditTaskPageProps) {
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
      <PageHeader title="Edit Task" description={`Editing task: ${taskData.title}`} backButton />

      {/* Task Form */}
      <TaskForm mode="edit" initialData={taskData} />

      {/* Tags and Parent Task - Side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TagsCard mode="edit" entityType="task" entityId={id} initialTags={tags} />
        <ParentEntityCard
          mode="edit"
          config={parentTaskConfig}
          entityId={id}
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
