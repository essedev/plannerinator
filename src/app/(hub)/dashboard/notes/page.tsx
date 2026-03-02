import { getNotes } from "@/features/notes/queries";
import { PageHeader, Pagination } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import Link from "next/link";
import { NoteList } from "@/components/notes/NoteList";
import { NoteFilters } from "@/components/notes/NoteFilters";
import type { NoteType, NoteFilterInput } from "@/features/notes/schema";

/**
 * Notes list page
 *
 * Features:
 * - Display all user notes
 * - Filter by type, favorites, search
 * - Sort notes
 * - Quick actions (favorite, delete)
 * - Create new note
 */

interface NotesPageProps {
  searchParams: Promise<{
    type?: string;
    isFavorite?: string;
    search?: string;
    sortBy?: string;
    sortOrder?: string;
    tags?: string;
    tagLogic?: string;
    offset?: string;
  }>;
}

export default async function NotesPage({ searchParams }: NotesPageProps) {
  const params = await searchParams;

  // Parse tag IDs from comma-separated string
  const tagIds = params.tags ? params.tags.split(",").filter(Boolean) : undefined;

  // Fetch notes with filters from URL params
  const { notes, pagination } = await getNotes({
    type: params.type as NoteType | undefined,
    isFavorite: params.isFavorite === "true" ? true : undefined,
    search: params.search,
    tagIds,
    tagLogic: params.tagLogic as "AND" | "OR" | undefined,
    sortBy: params.sortBy as NoteFilterInput["sortBy"],
    sortOrder: params.sortOrder as NoteFilterInput["sortOrder"],
    offset: params.offset ? parseInt(params.offset) : 0,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <PageHeader title="Notes" description={`${pagination.total} total notes`} />
        <Button asChild>
          <Link href="/dashboard/notes/new">
            <Plus className="h-4 w-4 mr-2" />
            New Note
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <NoteFilters />

      {/* Note List */}
      <NoteList notes={notes} />

      {/* Pagination */}
      <Pagination total={pagination.total} limit={pagination.limit} offset={pagination.offset} />
    </div>
  );
}
