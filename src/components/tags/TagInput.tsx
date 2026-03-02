"use client";

import { useState, useEffect } from "react";
import { useTransition } from "react";
import { toast } from "sonner";
import { TagBadge } from "./TagBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Tag as TagIcon } from "lucide-react";
import { searchTags } from "@/features/tags/queries";
import { createTag, assignTagsToEntity, removeTagsFromEntity } from "@/features/tags/actions";
import { DEFAULT_TAG_COLOR } from "@/lib/colors";
import type { EntityType } from "@/features/tags/schema";

/**
 * Tag Input Component
 *
 * Allows selecting existing tags or creating new ones
 * Displays assigned tags with remove buttons
 */

interface TagInputProps {
  entityType: EntityType;
  entityId: string;
  initialTags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
}

export function TagInput({ entityType, entityId, initialTags }: TagInputProps) {
  const [isPending, startTransition] = useTransition();
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{
      id: string;
      name: string;
      color: string;
    }>
  >([]);
  const [assignedTags, setAssignedTags] = useState(initialTags);

  // Search tags as user types
  useEffect(() => {
    const search = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const results = await searchTags(searchQuery, 10);
        // Filter out already assigned tags
        const assignedTagIds = new Set(assignedTags.map((t) => t.id));
        setSearchResults(results.filter((r) => !assignedTagIds.has(r.id)));
      } catch (error) {
        console.error("Error searching tags:", error);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, assignedTags]);

  const handleCreateTag = async () => {
    if (!searchQuery.trim()) return;

    startTransition(async () => {
      try {
        const result = await createTag({
          name: searchQuery.trim(),
          color: DEFAULT_TAG_COLOR,
        });

        // Immediately assign the new tag
        await assignTagsToEntity({
          entityType,
          entityId,
          tagIds: [result.id],
        });

        setAssignedTags([...assignedTags, result]);
        setSearchQuery("");
        setIsOpen(false);
        toast.success(`Tag "${result.name}" created and assigned`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to create tag");
      }
    });
  };

  const handleAssignTag = async (tag: { id: string; name: string; color: string }) => {
    startTransition(async () => {
      try {
        await assignTagsToEntity({
          entityType,
          entityId,
          tagIds: [tag.id],
        });

        setAssignedTags([...assignedTags, tag]);
        setSearchQuery("");
        setIsOpen(false);
        toast.success(`Tag "${tag.name}" assigned`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to assign tag");
      }
    });
  };

  const handleRemoveTag = async (tagId: string, tagName: string) => {
    startTransition(async () => {
      try {
        await removeTagsFromEntity({
          entityType,
          entityId,
          tagIds: [tagId],
        });

        setAssignedTags(assignedTags.filter((t) => t.id !== tagId));
        toast.success(`Tag "${tagName}" removed`);
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to remove tag");
      }
    });
  };

  return (
    <div className="space-y-2">
      {/* Assigned Tags */}
      <div className="flex flex-wrap gap-2">
        {assignedTags.map((tag) => (
          <TagBadge key={tag.id} tag={tag} onRemove={() => handleRemoveTag(tag.id, tag.name)} />
        ))}

        {/* Add Tag Button */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 gap-1" disabled={isPending}>
              <Plus className="h-3 w-3" />
              Add Tag
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80" align="start">
            <div className="space-y-4">
              <div className="space-y-2">
                <h4 className="font-medium leading-none">Add Tag</h4>
                <p className="text-sm text-muted-foreground">
                  Search for existing tags or create a new one
                </p>
              </div>

              {/* Search Input */}
              <Input
                placeholder="Search or create tag..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                disabled={isPending}
              />

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground">Existing tags:</p>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {searchResults.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleAssignTag(tag)}
                        disabled={isPending}
                        className="w-full flex items-center gap-2 p-2 rounded-md hover:bg-accent text-left"
                      >
                        <TagIcon className="h-4 w-4" style={{ color: tag.color }} />
                        <span className="text-sm">{tag.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Create New Tag */}
              {searchQuery.trim().length >= 2 && (
                <Button
                  onClick={handleCreateTag}
                  disabled={isPending}
                  variant="outline"
                  className="w-full justify-start"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Create "{searchQuery.trim()}"
                </Button>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}
