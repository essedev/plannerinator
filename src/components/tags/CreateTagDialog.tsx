"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createTag } from "@/features/tags/actions";
import { DEFAULT_TAG_COLOR } from "@/lib/colors";

/**
 * Create Tag Dialog Component
 *
 * Modal dialog for creating a new tag with name and color
 */

interface CreateTagDialogProps {
  children: React.ReactNode;
}

export function CreateTagDialog({ children }: CreateTagDialogProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState("");
  const [color, setColor] = useState(DEFAULT_TAG_COLOR);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Tag name is required");
      return;
    }

    startTransition(async () => {
      try {
        await createTag({
          name: name.trim(),
          color,
        });

        toast.success(`Tag "${name.trim()}" created`);
        setIsOpen(false);
        setName("");
        setColor(DEFAULT_TAG_COLOR);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create tag");
      }
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Tag</DialogTitle>
          <DialogDescription>Add a new tag to organize your content</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., Work, Personal, Urgent"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isPending}
              maxLength={50}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="color">Color</Label>
            <div className="flex gap-2">
              <Input
                id="color"
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
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isPending}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? "Creating..." : "Create Tag"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
