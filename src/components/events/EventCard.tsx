"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { deleteEvent, duplicateEvent, archiveEvent, restoreEvent } from "@/features/events/actions";
import { EVENT_CALENDAR_TYPE_LABELS } from "@/lib/labels";
import { formatShortDate, formatTime, isPast } from "@/lib/dates";
import { EVENT_CALENDAR_TYPE_COLORS, COMMON_COLORS } from "@/lib/colors";
import { ConfirmDialog, EntityCardMenu } from "@/components/common";
import { useEntityActions } from "@/hooks/use-entity-actions";

interface EventCardProps {
  event: {
    id: string;
    title: string;
    description: string | null;
    startTime: Date;
    endTime: Date | null;
    allDay: boolean;
    location: string | null;
    calendarType: "personal" | "work" | "family" | "other";
    archivedAt?: Date | null;
    project?: {
      id: string;
      name: string;
      color: string | null;
    } | null;
  };
}

export function EventCard({ event }: EventCardProps) {
  const {
    isPending,
    showDeleteDialog,
    setShowDeleteDialog,
    handleDelete,
    handleDuplicate,
    handleArchive,
    handleRestore,
  } = useEntityActions({
    entityId: event.id,
    entityTitle: event.title,
    entityType: "event",
    actions: {
      delete: deleteEvent,
      duplicate: duplicateEvent,
      archive: archiveEvent,
      restore: restoreEvent,
    },
    duplicateRedirectPath: (id) => `/dashboard/events/${id}`,
  });

  const isEventPast = isPast(event.startTime);

  return (
    <Card className={isEventPast ? "opacity-60" : ""}>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-1 min-w-0">
            <Link href={`/dashboard/events/${event.id}`} className="group">
              <h3 className="font-medium hover:text-primary transition-colors">{event.title}</h3>
            </Link>

            {event.description && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{event.description}</p>
            )}

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge variant="outline" className={EVENT_CALENDAR_TYPE_COLORS[event.calendarType]}>
                {EVENT_CALENDAR_TYPE_LABELS[event.calendarType]}
              </Badge>

              {event.allDay && (
                <Badge variant="outline" className={COMMON_COLORS.allDay}>
                  All Day
                </Badge>
              )}

              {event.archivedAt && (
                <Badge variant="outline" className={COMMON_COLORS.archived}>
                  Archived
                </Badge>
              )}

              {event.project && (
                <Badge variant="outline" style={{ borderColor: event.project.color || undefined }}>
                  {event.project.name}
                </Badge>
              )}

              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>
                  {event.allDay
                    ? formatShortDate(event.startTime)
                    : `${formatShortDate(event.startTime)}, ${formatTime(event.startTime)}`}
                </span>
              </div>

              {event.endTime && !event.allDay && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>{formatTime(event.endTime)}</span>
                </div>
              )}

              {event.location && (
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="h-3 w-3" />
                  <span className="truncate max-w-[200px]">{event.location}</span>
                </div>
              )}
            </div>
          </div>

          <EntityCardMenu
            editHref={`/dashboard/events/${event.id}`}
            isPending={isPending}
            isArchived={!!event.archivedAt}
            onDuplicate={handleDuplicate}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onDelete={() => setShowDeleteDialog(true)}
          />
        </div>
      </CardContent>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Event"
        description={`Are you sure you want to delete "${event.title}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </Card>
  );
}
