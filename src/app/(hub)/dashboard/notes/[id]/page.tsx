import { getNoteById } from "@/features/notes/queries";
import { fetchEntityPageData } from "@/lib/entity-data";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Edit } from "lucide-react";
import { PageHeader } from "@/components/common";
import { TagsCard } from "@/components/tags/TagsCard";
import { ParentEntityCard } from "@/components/common/ParentEntityCard";
import { parentNoteConfig } from "@/components/notes/parent-note-config";
import { CommentThread } from "@/components/comments/CommentThread";
import { EntityLinksSection } from "@/components/links/EntityLinksSection";
import { AttachmentsSection } from "@/components/attachments/AttachmentsSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { EntityActionButton } from "@/components/common";
import { deleteNote, archiveNote } from "@/features/notes/actions";
import { NoteContentCard } from "@/components/notes/NoteContentCard";

/**
 * Note detail page
 *
 * Features:
 * - View note details
 * - Edit, archive, and delete actions
 * - View related project and child notes
 */

interface NoteDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function NoteDetailPage({ params }: NoteDetailPageProps) {
  const { id } = await params;

  const noteData = await getNoteById(id);

  if (!noteData) {
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
  } = await fetchEntityPageData("note", id);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={noteData.title || "Untitled Note"}
        backButton
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/notes/${id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <EntityActionButton
              entityType="note"
              entityId={id}
              entityTitle={noteData.title || "Untitled Note"}
              actionType="archive"
              onAction={archiveNote}
            />
            <EntityActionButton
              entityType="note"
              entityId={id}
              entityTitle={noteData.title || "Untitled Note"}
              actionType="delete"
              onAction={deleteNote}
            />
          </>
        }
      />

      {/* Metadata */}
      {noteData.project && (
        <div className="flex items-center gap-2 -mt-2">
          <Link
            href={`/dashboard/projects/${noteData.project.id}`}
            className="text-sm text-primary hover:underline"
          >
            {noteData.project.icon} {noteData.project.name}
          </Link>
        </div>
      )}

      {/* Content */}
      {noteData.content && <NoteContentCard content={noteData.content} />}

      {/* Tags and Parent Note - Side by side (Read-only in view mode) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TagsCard mode="view" entityType="note" initialTags={tags} />
        <ParentEntityCard
          mode="view"
          config={parentNoteConfig}
          parentEntity={noteData.parentNote}
        />
      </div>

      {/* Child Notes Card */}
      {noteData.childNotes && noteData.childNotes.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Child Notes ({noteData.childNotes.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {noteData.childNotes.map((child) => (
                <li key={child.id}>
                  <Link
                    href={`/dashboard/notes/${child.id}`}
                    className="text-sm hover:text-primary transition-colors"
                  >
                    {child.title || "Untitled Note"}
                  </Link>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Attachments Section */}
      <AttachmentsSection entityType="note" entityId={id} initialAttachments={attachments} />

      {/* Links Section */}
      <EntityLinksSection entityType="note" entityId={id} initialLinks={links} />

      {/* Comments Section */}
      <CommentThread
        entityType="note"
        entityId={id}
        currentUserId={session.user.id}
        initialComments={commentsData.comments}
      />
    </div>
  );
}
