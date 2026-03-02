import { getTrashItems } from "@/features/trash/queries";
import { PageHeader } from "@/components/common";
import { TrashList } from "@/components/trash/TrashList";

/**
 * Trash page
 *
 * Displays all deleted items from all entity types (tasks, events, notes, projects)
 * Users can restore items or permanently delete them
 * Items in trash are automatically deleted after 30 days
 */

export default async function TrashPage() {
  const trashItems = await getTrashItems();

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Trash"
        description={`${trashItems.length} deleted item${trashItems.length !== 1 ? "s" : ""} • Items are permanently deleted after 30 days`}
      />

      {/* Trash List */}
      <TrashList items={trashItems} />
    </div>
  );
}
