"use client";

import { useState, useEffect } from "react";
import { TagBadge } from "./TagBadge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Plus, Tag as TagIcon } from "lucide-react";
import { DEFAULT_TAG_COLOR } from "@/lib/colors";
import { searchTags } from "@/features/tags/queries";

/**
 * TagSelector Component
 *
 * Local tag selection component for create mode.
 * Allows selecting existing tags and creating new ones without persisting immediately.
 * Used in create pages where the entity doesn't exist yet.
 */

interface TagSelectorProps {
  selectedTags: Array<{
    id: string;
    name: string;
    color: string;
  }>;
  onTagsChange: (tags: Array<{ id: string; name: string; color: string }>) => void;
}

export function TagSelector({ selectedTags, onTagsChange }: TagSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<
    Array<{
      id: string;
      name: string;
      color: string;
    }>
  >([]);

  // Search tags as user types
  useEffect(() => {
    const search = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults([]);
        return;
      }

      try {
        const results = await searchTags(searchQuery, 10);
        // Filter out already selected tags
        const selectedTagIds = new Set(selectedTags.map((t) => t.id));
        setSearchResults(results.filter((r) => !selectedTagIds.has(r.id)));
      } catch (error) {
        console.error("Error searching tags:", error);
      }
    };

    const debounce = setTimeout(search, 300);
    return () => clearTimeout(debounce);
  }, [searchQuery, selectedTags]);

  const handleCreateTag = () => {
    if (!searchQuery.trim()) return;

    // Create a temporary tag (will be created for real when entity is saved)
    const newTag = {
      id: `temp-${Date.now()}`, // Temporary ID
      name: searchQuery.trim(),
      color: DEFAULT_TAG_COLOR,
    };

    onTagsChange([...selectedTags, newTag]);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleSelectTag = (tag: { id: string; name: string; color: string }) => {
    onTagsChange([...selectedTags, tag]);
    setSearchQuery("");
    setIsOpen(false);
  };

  const handleRemoveTag = (tagId: string) => {
    onTagsChange(selectedTags.filter((t) => t.id !== tagId));
  };

  return (
    <div className="space-y-2">
      {/* Selected Tags */}
      <div className="flex flex-wrap gap-2">
        {selectedTags.map((tag) => (
          <TagBadge key={tag.id} tag={tag} onRemove={() => handleRemoveTag(tag.id)} />
        ))}

        {/* Add Tag Button */}
        <Popover open={isOpen} onOpenChange={setIsOpen}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-6 gap-1">
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
                        onClick={() => handleSelectTag(tag)}
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

      {selectedTags.length === 0 && (
        <p className="text-sm text-muted-foreground">No tags selected</p>
      )}
    </div>
  );
}
