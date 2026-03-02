"use server";

import { getNotes } from "./queries";

export async function getNotesForParentSelection(excludeId?: string) {
  const result = await getNotes({
    sortBy: "title",
    sortOrder: "asc",
    limit: 100,
  });

  return excludeId ? result.notes.filter((n) => n.id !== excludeId) : result.notes;
}
