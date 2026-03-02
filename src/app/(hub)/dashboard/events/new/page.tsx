"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { PageHeader } from "@/components/common";
import { EventForm } from "@/components/events/EventForm";
import { TagsCard } from "@/components/tags/TagsCard";
import { ParentEntityCard } from "@/components/common/ParentEntityCard";
import { parentEventConfig } from "@/components/events/parent-event-config";

/**
 * Create new event page
 *
 * Supports pre-filling form from URL params:
 * - startTime: ISO date string
 * - endTime: ISO date string
 * - allDay: boolean
 */

export default function NewEventPage() {
  const searchParams = useSearchParams();
  const [parentEventId, setParentEventId] = useState<string | undefined>();
  const [tags, setTags] = useState<Array<{ id: string; name: string; color: string }>>([]);

  // Parse URL params for pre-filling form
  const startTime = searchParams.get("startTime");
  const endTime = searchParams.get("endTime");
  const initialData = startTime
    ? {
        startTime: new Date(startTime),
        endTime: endTime ? new Date(endTime) : undefined,
      }
    : undefined;

  return (
    <div className="space-y-6">
      <PageHeader title="New Event" description="Create a new event for your calendar" />
      <EventForm
        mode="create"
        initialData={initialData}
        parentEventId={parentEventId}
        selectedTags={tags}
      />

      {/* Tags and Parent Event - Side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TagsCard mode="create" entityType="event" initialTags={tags} onTagsChange={setTags} />
        <ParentEntityCard
          mode="create"
          config={parentEventConfig}
          onParentChange={setParentEventId}
        />
      </div>
    </div>
  );
}
