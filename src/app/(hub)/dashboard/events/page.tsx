import { getEvents } from "@/features/events/queries";
import { PageHeader, Pagination } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { EventsView } from "@/components/events/EventsView";
import { EventFilters } from "@/components/events/EventFilters";
import type { EventCalendarType, EventFilterInput } from "@/features/events/schema";

/**
 * Events list page
 *
 * Features:
 * - Display all user events
 * - Filter by calendar type, project, date range
 * - Sort events
 * - Quick actions (edit, delete)
 * - Create new event
 */

interface EventsPageProps {
  searchParams: Promise<{
    calendarType?: string;
    projectId?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    allDay?: string;
    tags?: string;
    tagLogic?: string;
    offset?: string;
  }>;
}

export default async function EventsPage({ searchParams }: EventsPageProps) {
  const params = await searchParams;

  // Parse tag IDs from comma-separated string
  const tagIds = params.tags ? params.tags.split(",").filter(Boolean) : undefined;

  // Fetch events with filters from URL params
  const { events, pagination } = await getEvents({
    calendarType: params.calendarType as EventCalendarType | undefined,
    projectId: params.projectId,
    search: params.search,
    allDay: params.allDay === "true" ? true : params.allDay === "false" ? false : undefined,
    tagIds,
    tagLogic: params.tagLogic as "AND" | "OR" | undefined,
    sortBy: params.sortBy as EventFilterInput["sortBy"],
    sortOrder: params.sortOrder as EventFilterInput["sortOrder"],
    offset: params.offset ? parseInt(params.offset) : 0,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader title="Events" description={`${pagination.total} total events`} />
        <Button asChild>
          <Link href="/dashboard/events/new">
            <Plus className="h-4 w-4 mr-2" />
            New Event
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <EventFilters />

      {/* Events View (List or Calendar) */}
      <EventsView events={events} />

      {/* Pagination */}
      <Pagination total={pagination.total} limit={pagination.limit} offset={pagination.offset} />
    </div>
  );
}
