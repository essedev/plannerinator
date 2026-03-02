"use client";

import { useState, useEffect, type ReactNode } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Base entity type with required id field
 */
export interface BaseEntity {
  id: string;
}

/**
 * Configuration for ParentEntityCard
 * Defines entity-specific behavior and rendering
 */
export interface ParentEntityCardConfig<T extends BaseEntity> {
  /**
   * Display name for the entity type (e.g., "Task", "Event")
   * Used in card title: "Parent {entityTypeName}"
   */
  entityTypeName: string;

  /**
   * Base path for entity detail pages (e.g., "/dashboard/tasks")
   */
  basePath: string;

  /**
   * Name of the parent ID field for updates (e.g., "parentTaskId")
   */
  parentIdField: string;

  /**
   * Fetch entities for parent selection
   * @param excludeId - ID to exclude from results (current entity in edit mode)
   * @returns Promise with entities array
   */
  fetchEntities: (excludeId?: string) => Promise<T[]>;

  /**
   * Update entity with new parent ID
   * @param entityId - ID of entity to update
   * @param parentId - New parent ID (or null to remove parent)
   */
  updateEntity: (entityId: string, parentId: string | null) => Promise<void>;

  /**
   * Render entity display in view mode
   * @param entity - Entity to display
   * @returns React node to render
   */
  renderViewDisplay: (entity: T) => ReactNode;

  /**
   * Render entity in select item
   * @param entity - Entity to render
   * @returns React node to render
   */
  renderSelectItem: (entity: T) => ReactNode;

  /**
   * Message to show when no parent is set
   * Default: "No parent {entityTypeName}"
   */
  emptyMessage?: string;
}

/**
 * Props for ParentEntityCard component
 */
export interface ParentEntityCardProps<T extends BaseEntity> {
  /**
   * Component mode
   * - view: Read-only display with link
   * - edit: Editable with immediate save
   * - create: Selection without immediate save (uses callback)
   */
  mode: "create" | "edit" | "view";

  /**
   * Configuration object defining entity-specific behavior
   */
  config: ParentEntityCardConfig<T>;

  /**
   * Current entity ID (required for edit mode)
   */
  entityId?: string;

  /**
   * Current parent entity (for display)
   */
  parentEntity?: T | null;

  /**
   * Callback when parent changes in create mode
   * @param parentId - New parent ID or undefined to clear
   */
  onParentChange?: (parentId: string | undefined) => void;
}

/**
 * Generic Parent Entity Card Component
 *
 * Displays and manages parent entity relationships across different modes.
 * Fully type-safe and configurable for any entity type.
 *
 * @example
 * ```tsx
 * <ParentEntityCard
 *   mode="edit"
 *   config={parentTaskConfig}
 *   entityId={taskId}
 *   parentEntity={parentTask}
 * />
 * ```
 */
export function ParentEntityCard<T extends BaseEntity>({
  mode,
  config,
  entityId,
  parentEntity,
  onParentChange,
}: ParentEntityCardProps<T>) {
  const [entities, setEntities] = useState<T[]>([]);
  const [loadingEntities, setLoadingEntities] = useState(mode !== "view");
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>(
    parentEntity?.id || undefined
  );
  const [isUpdating, setIsUpdating] = useState(false);

  // Load available entities for parent selection (edit and create modes)
  useEffect(() => {
    if (mode === "view") return;

    async function loadEntities() {
      try {
        const entities = await config.fetchEntities(mode === "edit" ? entityId : undefined);
        setEntities(entities);
      } catch (error) {
        console.error(`Failed to load ${config.entityTypeName.toLowerCase()}s:`, error);
        toast.error(`Failed to load ${config.entityTypeName.toLowerCase()}s`);
      } finally {
        setLoadingEntities(false);
      }
    }
    loadEntities();
  }, [mode, entityId, config]);

  // Handle parent change in edit mode (immediate save)
  const handleParentChangeEdit = async (newParentId: string | undefined) => {
    if (mode !== "edit" || !entityId) return;

    setIsUpdating(true);
    try {
      await config.updateEntity(entityId, newParentId || null);
      setSelectedParentId(newParentId);
      toast.success(`Parent ${config.entityTypeName.toLowerCase()} updated`);
    } catch {
      toast.error(`Failed to update parent ${config.entityTypeName.toLowerCase()}`);
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle parent change in create mode (notify parent component)
  const handleParentChangeCreate = (newParentId: string | undefined) => {
    if (mode !== "create") return;
    setSelectedParentId(newParentId);
    onParentChange?.(newParentId);
  };

  const emptyMessage = config.emptyMessage || `No parent ${config.entityTypeName.toLowerCase()}`;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Parent {config.entityTypeName}</CardTitle>
      </CardHeader>
      <CardContent>
        {mode === "view" ? (
          // View mode: Read-only display
          parentEntity ? (
            <Link
              href={`${config.basePath}/${parentEntity.id}`}
              className="block hover:text-primary transition-colors"
            >
              {config.renderViewDisplay(parentEntity)}
            </Link>
          ) : (
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
          )
        ) : (
          // Edit/Create mode: Parent entity selector
          <div className="space-y-2">
            <Select
              value={selectedParentId || "none"}
              onValueChange={(value) => {
                const newValue = value === "none" ? undefined : value;
                if (mode === "edit") {
                  handleParentChangeEdit(newValue);
                } else {
                  handleParentChangeCreate(newValue);
                }
              }}
              disabled={loadingEntities || isUpdating}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder={loadingEntities ? "Loading..." : emptyMessage} />
              </SelectTrigger>
              <SelectContent className="w-[var(--radix-select-trigger-width)]">
                <SelectItem value="none">{emptyMessage}</SelectItem>
                {entities.map((entity) => (
                  <SelectItem key={entity.id} value={entity.id}>
                    {config.renderSelectItem(entity)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
