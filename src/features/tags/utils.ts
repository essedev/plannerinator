import { createTag, assignTagsToEntity } from "./actions";
import type { EntityType } from "./schema";

/**
 * Tag data structure used in forms
 */
export interface TagData {
  id: string;
  name: string;
  color: string;
}

/**
 * Creates new tags (those with temporary IDs) and assigns all tags to an entity.
 *
 * This utility handles the common pattern of:
 * 1. Creating tags that don't exist yet (temporary IDs starting with "temp-")
 * 2. Collecting all tag IDs (both newly created and existing)
 * 3. Assigning all tags to the specified entity
 *
 * @param selectedTags - Array of tags, may include temporary tags to be created
 * @param entityType - The type of entity to assign tags to
 * @param entityId - The ID of the entity to assign tags to
 * @returns Promise that resolves when all tags are created and assigned
 *
 * @example
 * ```ts
 * // After creating a task
 * await createAndAssignTags(
 *   selectedTags,
 *   'task',
 *   newTask.id
 * );
 * ```
 */
export async function createAndAssignTags(
  selectedTags: TagData[],
  entityType: EntityType,
  entityId: string
): Promise<void> {
  if (!selectedTags || selectedTags.length === 0) {
    return;
  }

  const realTagIds: string[] = [];

  // Create new tags (those with temporary IDs) and collect all tag IDs
  for (const tag of selectedTags) {
    if (tag.id.startsWith("temp-")) {
      // This is a temporary tag that needs to be created
      const newTagResult = await createTag({
        name: tag.name,
        color: tag.color,
      });

      if (newTagResult) {
        realTagIds.push(newTagResult.id);
      }
    } else {
      // This is an existing tag
      realTagIds.push(tag.id);
    }
  }

  // Assign all tags to the entity
  if (realTagIds.length > 0) {
    await assignTagsToEntity({
      entityType,
      entityId,
      tagIds: realTagIds,
    });
  }
}
