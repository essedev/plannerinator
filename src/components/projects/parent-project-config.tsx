"use client";

import { Badge } from "@/components/ui/badge";
import { PROJECT_STATUS_LABELS } from "@/lib/labels";
import { getProjectsForParentSelection } from "@/features/projects/parent-actions";
import { updateProject } from "@/features/projects/actions";
import type { ParentEntityCardConfig } from "@/components/common/ParentEntityCard";
import type { Project } from "@/db/schema";

/**
 * Type for project data used in parent selection
 */
export type ProjectOption = Pick<Project, "id" | "name" | "icon" | "status">;

/**
 * Configuration for ParentEntityCard when used with projects
 *
 * Defines project-specific behavior:
 * - Fetches projects for selection
 * - Updates project with new parent
 * - Renders project with name, icon, and status badge
 */
export const parentProjectConfig: ParentEntityCardConfig<ProjectOption> = {
  entityTypeName: "Project",
  basePath: "/dashboard/projects",
  parentIdField: "parentProjectId",

  fetchEntities: async (excludeId?: string) => {
    return (await getProjectsForParentSelection(excludeId)) as ProjectOption[];
  },

  updateEntity: async (entityId: string, parentId: string | null) => {
    await updateProject(entityId, { parentProjectId: parentId });
  },

  renderViewDisplay: (project) => (
    <>
      <div className="flex items-center gap-2">
        {project.icon && <span className="text-xl">{project.icon}</span>}
        <p className="font-medium">{project.name}</p>
      </div>
      <Badge variant="outline" className="mt-2 text-xs">
        {PROJECT_STATUS_LABELS[project.status]}
      </Badge>
    </>
  ),

  renderSelectItem: (project) => (
    <span className="flex items-center gap-2">
      {project.icon && <span>{project.icon}</span>}
      <span className="flex-1 truncate">{project.name}</span>
      {project.status && project.status !== "active" && (
        <span className="text-xs text-muted-foreground">
          ({PROJECT_STATUS_LABELS[project.status]})
        </span>
      )}
    </span>
  ),
};
