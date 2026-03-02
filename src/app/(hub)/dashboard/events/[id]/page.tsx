import { getEventById } from "@/features/events/queries";
import { fetchEntityPageData } from "@/lib/entity-data";
import { getSession } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Edit } from "lucide-react";
import { PageHeader } from "@/components/common";
import { TagsCard } from "@/components/tags/TagsCard";
import { ParentEntityCard } from "@/components/common/ParentEntityCard";
import { parentEventConfig } from "@/components/events/parent-event-config";
import { CommentThread } from "@/components/comments/CommentThread";
import { EntityLinksSection } from "@/components/links/EntityLinksSection";
import { AttachmentsSection } from "@/components/attachments/AttachmentsSection";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatFullDate } from "@/lib/dates";
import { EntityActionButton } from "@/components/common";
import { deleteEvent, archiveEvent } from "@/features/events/actions";

/**
 * Event detail page
 *
 * Features:
 * - View event details
 * - Edit, archive, and delete actions
 * - View related project
 */

interface EventDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EventDetailPage({ params }: EventDetailPageProps) {
  const { id } = await params;

  const eventData = await getEventById(id);

  if (!eventData) {
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
  } = await fetchEntityPageData("event", id);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title={eventData.title}
        description={eventData.description || undefined}
        backButton
        actions={
          <>
            <Button variant="outline" size="sm" asChild>
              <Link href={`/dashboard/events/${id}/edit`}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </Link>
            </Button>
            <EntityActionButton
              entityType="event"
              entityId={id}
              entityTitle={eventData.title}
              actionType="archive"
              onAction={archiveEvent}
            />
            <EntityActionButton
              entityType="event"
              entityId={id}
              entityTitle={eventData.title}
              actionType="delete"
              onAction={deleteEvent}
            />
          </>
        }
      />

      {/* Metadata */}
      <div className="flex items-center gap-2 -mt-2">
        <Badge variant="outline">{formatFullDate(eventData.startTime)}</Badge>

        {eventData.endTime && (
          <>
            <span className="text-muted-foreground">→</span>
            <Badge variant="outline">{formatFullDate(eventData.endTime)}</Badge>
          </>
        )}

        {eventData.project && (
          <>
            <span className="text-muted-foreground">•</span>
            <Link
              href={`/dashboard/projects/${eventData.project.id}`}
              className="text-sm text-primary hover:underline"
            >
              {eventData.project.icon} {eventData.project.name}
            </Link>
          </>
        )}
      </div>

      {/* Location */}
      {eventData.location && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Location</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{eventData.location}</p>
          </CardContent>
        </Card>
      )}

      {/* Tags and Parent Event - Side by side (Read-only in view mode) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TagsCard mode="view" entityType="event" initialTags={tags} />
        <ParentEntityCard
          mode="view"
          config={parentEventConfig}
          parentEntity={eventData.parentEvent}
        />
      </div>

      {/* Attachments Section */}
      <AttachmentsSection entityType="event" entityId={id} initialAttachments={attachments} />

      {/* Links Section */}
      <EntityLinksSection entityType="event" entityId={id} initialLinks={links} />

      {/* Comments Section */}
      <CommentThread
        entityType="event"
        entityId={id}
        currentUserId={session.user.id}
        initialComments={commentsData.comments}
      />
    </div>
  );
}
