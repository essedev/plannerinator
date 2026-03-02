import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/common";
import { NoteForm } from "@/components/notes/NoteForm";
import { TagsCard } from "@/components/tags/TagsCard";
import { ParentEntityCard } from "@/components/common/ParentEntityCard";
import { parentNoteConfig } from "@/components/notes/parent-note-config";
import { CommentThread } from "@/components/comments/CommentThread";
import { EntityLinksSection } from "@/components/links/EntityLinksSection";
import { AttachmentsSection } from "@/components/attachments/AttachmentsSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getNoteById } from "@/features/notes/queries";
import { fetchEntityPageData } from "@/lib/entity-data";
import { getSession } from "@/lib/auth";

/**
 * Note Edit Page
 *
 * Features:
 * - Edit note details
 * - Manage tags, comments, links, and attachments
 */

interface EditNotePageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditNotePage({ params }: EditNotePageProps) {
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
        title="Edit Note"
        description={noteData.title ? `Editing note: ${noteData.title}` : "Editing note"}
        backButton
      />

      {/* Note Form */}
      <NoteForm mode="edit" initialData={noteData} />

      {/* Tags and Parent Note - Side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TagsCard mode="edit" entityType="note" entityId={id} initialTags={tags} />
        <ParentEntityCard
          mode="edit"
          config={parentNoteConfig}
          entityId={id}
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
