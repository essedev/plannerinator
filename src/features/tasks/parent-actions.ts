"use server";

import { getTasks } from "./queries";

export async function getTasksForParentSelection(excludeId?: string) {
  const result = await getTasks({
    sortBy: "title",
    sortOrder: "asc",
    limit: 100,
  });

  return excludeId ? result.tasks.filter((t) => t.id !== excludeId) : result.tasks;
}
