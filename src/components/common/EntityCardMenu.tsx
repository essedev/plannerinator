"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreVertical, Edit, Copy, Archive, RotateCcw, Trash2 } from "lucide-react";
import Link from "next/link";

interface EntityCardMenuProps {
  editHref: string;
  editLabel?: string;
  isPending: boolean;
  isArchived: boolean;
  onDuplicate?: () => void;
  onArchive?: () => void;
  onRestore?: () => void;
  onDelete: () => void;
  extraItems?: React.ReactNode;
}

export function EntityCardMenu({
  editHref,
  editLabel = "Edit",
  isPending,
  isArchived,
  onDuplicate,
  onArchive,
  onRestore,
  onDelete,
  extraItems,
}: EntityCardMenuProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <MoreVertical className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={editHref} className="cursor-pointer">
            <Edit className="h-4 w-4 mr-2" />
            {editLabel}
          </Link>
        </DropdownMenuItem>
        {onDuplicate && (
          <DropdownMenuItem onClick={onDuplicate} disabled={isPending}>
            <Copy className="h-4 w-4 mr-2" />
            Duplicate
          </DropdownMenuItem>
        )}
        {extraItems}
        {isArchived
          ? onRestore && (
              <DropdownMenuItem onClick={onRestore} disabled={isPending}>
                <RotateCcw className="h-4 w-4 mr-2" />
                Restore
              </DropdownMenuItem>
            )
          : onArchive && (
              <DropdownMenuItem onClick={onArchive} disabled={isPending}>
                <Archive className="h-4 w-4 mr-2" />
                Archive
              </DropdownMenuItem>
            )}
        <DropdownMenuSeparator />
        <DropdownMenuItem
          onClick={onDelete}
          disabled={isPending}
          className="text-destructive focus:text-destructive cursor-pointer"
        >
          <Trash2 className="h-4 w-4 mr-2" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
