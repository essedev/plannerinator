"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { FileText, Star } from "lucide-react";
import Link from "next/link";
import {
  deleteNote,
  toggleNoteFavorite,
  duplicateNote,
  archiveNote,
  restoreNote,
} from "@/features/notes/actions";
import { toast } from "sonner";
import { NOTE_TYPE_LABELS } from "@/lib/labels";
import { formatShortDate } from "@/lib/dates";
import { NOTE_TYPE_COLORS, COMMON_COLORS } from "@/lib/colors";
import { ConfirmDialog, EntityCardMenu } from "@/components/common";
import { useEntityActions } from "@/hooks/use-entity-actions";
import { handleActionError } from "@/lib/error-handler";

interface NoteCardProps {
  note: {
    id: string;
    title: string | null;
    content: string | null;
    type: "note" | "document" | "research" | "idea" | "snippet";
    isFavorite: boolean;
    createdAt: Date;
    updatedAt: Date;
    archivedAt?: Date | null;
    project?: {
      id: string;
      name: string;
      color: string | null;
    } | null;
  };
}

export function NoteCard({ note }: NoteCardProps) {
  const {
    isPending,
    startTransition,
    showDeleteDialog,
    setShowDeleteDialog,
    handleDelete,
    handleDuplicate,
    handleArchive,
    handleRestore,
  } = useEntityActions({
    entityId: note.id,
    entityTitle: note.title || "Untitled Note",
    entityType: "note",
    actions: {
      delete: deleteNote,
      duplicate: duplicateNote,
      archive: archiveNote,
      restore: restoreNote,
    },
    duplicateRedirectPath: (id) => `/dashboard/notes/${id}`,
  });

  const handleToggleFavorite = () => {
    startTransition(async () => {
      try {
        await toggleNoteFavorite(note.id, !note.isFavorite);
        toast.success(note.isFavorite ? "Removed from favorites" : "Added to favorites");
      } catch (error) {
        handleActionError(error);
      }
    });
  };

  const preview = note.content ? note.content.slice(0, 200) : null;

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <FileText className="h-5 w-5 text-muted-foreground mt-1" />

          <div className="flex-1 min-w-0">
            <Link href={`/dashboard/notes/${note.id}`} className="group">
              <h3 className="font-medium hover:text-primary transition-colors">
                {note.title || "Untitled Note"}
              </h3>
            </Link>

            {preview && (
              <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{preview}</p>
            )}

            <div className="flex items-center gap-2 mt-3 flex-wrap">
              <Badge variant="outline" className={NOTE_TYPE_COLORS[note.type]}>
                {NOTE_TYPE_LABELS[note.type]}
              </Badge>

              {note.isFavorite && (
                <Badge variant="outline" className={COMMON_COLORS.favorite}>
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Favorite
                </Badge>
              )}

              {note.archivedAt && (
                <Badge variant="outline" className={COMMON_COLORS.archived}>
                  Archived
                </Badge>
              )}

              {note.project && (
                <Badge variant="outline" style={{ borderColor: note.project.color || undefined }}>
                  {note.project.name}
                </Badge>
              )}

              <span className="text-xs text-muted-foreground">
                Updated {formatShortDate(note.updatedAt)}
              </span>
            </div>
          </div>

          <EntityCardMenu
            editHref={`/dashboard/notes/${note.id}`}
            isPending={isPending}
            isArchived={!!note.archivedAt}
            onDuplicate={handleDuplicate}
            onArchive={handleArchive}
            onRestore={handleRestore}
            onDelete={() => setShowDeleteDialog(true)}
            extraItems={
              <DropdownMenuItem
                onClick={handleToggleFavorite}
                disabled={isPending}
                className="cursor-pointer"
              >
                <Star className="h-4 w-4 mr-2" />
                {note.isFavorite ? "Remove from Favorites" : "Add to Favorites"}
              </DropdownMenuItem>
            }
          />
        </div>
      </CardContent>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Delete Note"
        description={`Are you sure you want to delete "${note.title || "this note"}"? This action cannot be undone.`}
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />
    </Card>
  );
}
