"use server";

import { getProjects } from "./queries";

export async function getProjectsForParentSelection(excludeId?: string) {
  const result = await getProjects({
    sortBy: "name",
    sortOrder: "asc",
  });

  return excludeId ? result.projects.filter((p) => p.id !== excludeId) : result.projects;
}
