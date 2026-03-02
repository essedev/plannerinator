import { notFound } from "next/navigation";
import { PageHeader } from "@/components/common";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { TagsCard } from "@/components/tags/TagsCard";
import { ParentEntityCard } from "@/components/common/ParentEntityCard";
import { parentProjectConfig } from "@/components/projects/parent-project-config";
import { CommentThread } from "@/components/comments/CommentThread";
import { EntityLinksSection } from "@/components/links/EntityLinksSection";
import { AttachmentsSection } from "@/components/attachments/AttachmentsSection";
import { getProjectById } from "@/features/projects/queries";
import { fetchEntityPageData } from "@/lib/entity-data";
import { getSession } from "@/lib/auth";

/**
 * Project Detail Page
 *
 * Features:
 * - View project details
 * - Edit project
 */

interface EditProjectPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditProjectPage({ params }: EditProjectPageProps) {
  const { id } = await params;

  // Fetch project
  let project;
  try {
    project = await getProjectById(id);
  } catch {
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
  } = await fetchEntityPageData("project", id);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Project Details"
        description={`Viewing project: ${project.name}`}
        backButton
      />

      {/* Project Form */}
      <ProjectForm
        mode="edit"
        initialData={{
          id: project.id,
          name: project.name,
          description: project.description,
          status: project.status,
          color: project.color,
          icon: project.icon,
          startDate: project.startDate ? new Date(project.startDate) : null,
          endDate: project.endDate ? new Date(project.endDate) : null,
        }}
      />

      {/* Tags and Parent Project - Side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TagsCard mode="edit" entityType="project" entityId={id} initialTags={tags} />
        <ParentEntityCard
          mode="edit"
          config={parentProjectConfig}
          entityId={id}
          parentEntity={project.parentProject}
        />
      </div>

      {/* Attachments Section */}
      <AttachmentsSection entityType="project" entityId={id} initialAttachments={attachments} />

      {/* Links Section */}
      <EntityLinksSection entityType="project" entityId={id} initialLinks={links} />

      {/* Comments Section */}
      <CommentThread
        entityType="project"
        entityId={id}
        currentUserId={session.user.id}
        initialComments={commentsData.comments}
      />
    </div>
  );
}
