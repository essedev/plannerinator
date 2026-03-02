"use client";

import { getNotesForParentSelection } from "@/features/notes/parent-actions";
import { updateNote } from "@/features/notes/actions";
import type { ParentEntityCardConfig } from "@/components/common/ParentEntityCard";
import type { Note } from "@/db/schema";

/**
 * Type for note data used in parent selection
 */
export type NoteOption = Pick<Note, "id" | "title">;

/**
 * Configuration for ParentEntityCard when used with notes
 *
 * Defines note-specific behavior:
 * - Fetches notes for selection
 * - Updates note with new parent
 * - Renders note with title (or "Untitled Note" fallback)
 */
export const parentNoteConfig: ParentEntityCardConfig<NoteOption> = {
  entityTypeName: "Note",
  basePath: "/dashboard/notes",
  parentIdField: "parentNoteId",

  fetchEntities: async (excludeId?: string) => {
    return (await getNotesForParentSelection(excludeId)) as NoteOption[];
  },

  updateEntity: async (entityId: string, parentId: string | null) => {
    await updateNote(entityId, { parentNoteId: parentId });
  },

  renderViewDisplay: (note) => <p className="font-medium">{note.title || "Untitled Note"}</p>,

  renderSelectItem: (note) => (
    <span className="flex-1 truncate">{note.title || "Untitled Note"}</span>
  ),
};
