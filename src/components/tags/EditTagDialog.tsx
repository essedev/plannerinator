"use client";

import { useState, useTransition, useEffect } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTag } from "@/features/tags/actions";
import { DEFAULT_TAG_COLOR } from "@/lib/colors";
import type { Tag } from "@/db/schema";

/**
 * Edit Tag Dialog Component
 *
 * Modal dialog for editing tag name and color
 */

interface EditTagDialogProps {
  tag: Tag;
  isOpen: boolean;
  onClose: () => void;
}

export function EditTagDialog({ tag, isOpen, onClose }: EditTagDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [name, setName] = useState(tag.name);
  const [color, setColor] = useState(tag.color);

  // Reset form when tag changes
  useEffect(() => {
    setName(tag.name);
    setColor(tag.color);
  }, [tag]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Tag name is required");
      return;
    }

    // Check if anything changed
    if (name.trim() === tag.name && color === tag.color) {
      toast.info("No changes made");
      onClose();
      return;
    }

    startTransition(async () => {
      try {
        await updateTag(tag.id, {
          name: name.trim(),
          color,
        });

        toast.success(`Tag "${name.trim()}" updated`);
        onClose();
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update tag");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Edit Tag</DialogTitle>
          <DialogDescription>Update the tag name or color</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-name">Name</Label>
            <Input
              id="edit-name"
              placeholder="e.g., Work, Personal, Urgent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="edit-color">Color</Label>
            <div className="flex gap-2">
              <Input
                id="edit-color"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={isPending}
                className="w-20 h-10"
              />
              <Input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                disabled={isPending}
                placeholder={DEFAULT_TAG_COLOR}
                className="flex-1"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
