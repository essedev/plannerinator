"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { handleActionError } from "@/lib/error-handler";
import type { EntityType } from "@/lib/entity-helpers";

interface UseEntityActionsConfig {
  entityId: string;
  entityTitle: string;
  entityType: EntityType;
  actions: {
    delete: (id: string) => Promise<void>;
    duplicate?: (id: string) => Promise<{ id: string } | undefined>;
    archive?: (id: string) => Promise<void>;
    restore?: (id: string) => Promise<void>;
  };
  duplicateRedirectPath?: (id: string) => string;
}

export function useEntityActions(config: UseEntityActionsConfig) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const entityLabel = config.entityType.charAt(0).toUpperCase() + config.entityType.slice(1);

  const handleDelete = () => {
    setShowDeleteDialog(false);

    startTransition(async () => {
      try {
        await config.actions.delete(config.entityId);
        toast.success(`${entityLabel} deleted`);
      } catch (error) {
        handleActionError(error);
      }
    });
  };

  const handleDuplicate = config.actions.duplicate
    ? () => {
        startTransition(async () => {
          try {
            const result = await config.actions.duplicate!(config.entityId);
            toast.success(`${entityLabel} duplicated`);
            if (result?.id && config.duplicateRedirectPath) {
              router.push(config.duplicateRedirectPath(result.id));
            }
          } catch (error) {
            handleActionError(error);
          }
        });
      }
    : undefined;

  const handleArchive = config.actions.archive
    ? () => {
        startTransition(async () => {
          try {
            await config.actions.archive!(config.entityId);
            toast.success(`${entityLabel} archived`);
          } catch (error) {
            handleActionError(error);
          }
        });
      }
    : undefined;

  const handleRestore = config.actions.restore
    ? () => {
        startTransition(async () => {
          try {
            await config.actions.restore!(config.entityId);
            toast.success(`${entityLabel} restored`);
          } catch (error) {
            handleActionError(error);
          }
        });
      }
    : undefined;

  return {
    isPending,
    startTransition,
    showDeleteDialog,
    setShowDeleteDialog,
    handleDelete,
    handleDuplicate,
    handleArchive,
    handleRestore,
  };
}
