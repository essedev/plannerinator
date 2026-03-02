import { Suspense } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader, Pagination } from "@/components/common";
import { getProjects } from "@/features/projects/queries";
import { ProjectList } from "@/components/projects/ProjectList";
import { ProjectFilters } from "@/components/projects/ProjectFilters";
import type { ProjectFilterInput } from "@/features/projects/schema";

/**
 * Projects List Page
 *
 * Features:
 * - List all user projects
 * - Filter by status, parent, date range, search
 * - Pagination
 * - Create new project button
 */

interface ProjectsPageProps {
  searchParams: Promise<{
    status?: string;
    parentProjectId?: string;
    search?: string;
    limit?: string;
    offset?: string;
    sortBy?: string;
    sortOrder?: string;
    tags?: string;
    tagLogic?: string;
  }>;
}

export default async function ProjectsPage({ searchParams }: ProjectsPageProps) {
  const params = await searchParams;

  // Parse tag IDs from comma-separated string
  const tagIds = params.tags ? params.tags.split(",").filter(Boolean) : undefined;

  // Build filters from URL params
  const filters: ProjectFilterInput = {
    status: params.status as ProjectFilterInput["status"],
    parentProjectId: params.parentProjectId || undefined,
    search: params.search,
    tagIds,
    tagLogic: params.tagLogic as "AND" | "OR" | undefined,
    limit: params.limit ? parseInt(params.limit) : 50,
    offset: params.offset ? parseInt(params.offset) : 0,
    sortBy: params.sortBy as ProjectFilterInput["sortBy"],
    sortOrder: params.sortOrder as ProjectFilterInput["sortOrder"],
  };

  // Fetch projects with filters
  const { projects, pagination } = await getProjects(filters);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <PageHeader title="Projects" description={`${pagination.total} total projects`} />
        <Button asChild>
          <Link href="/dashboard/projects/new">
            <Plus className="h-4 w-4 mr-2" />
            New Project
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Suspense fallback={<div>Loading filters...</div>}>
        <ProjectFilters />
      </Suspense>

      {/* Projects List */}
      <Suspense fallback={<div>Loading projects...</div>}>
        <ProjectList projects={projects} />
      </Suspense>

      {/* Pagination */}
      <Pagination total={pagination.total} limit={pagination.limit} offset={pagination.offset} />
    </div>
  );
}
