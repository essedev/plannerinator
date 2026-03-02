"use server";

import { getEvents } from "./queries";

export async function getEventsForParentSelection(excludeId?: string) {
  const result = await getEvents({
    sortBy: "startTime",
    sortOrder: "desc",
    limit: 100,
  });

  return excludeId ? result.events.filter((e) => e.id !== excludeId) : result.events;
}
