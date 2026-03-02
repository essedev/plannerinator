import { getTags, getTagUsageStats } from "@/features/tags/queries";
import { PageHeader } from "@/components/common";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { TagManagerList } from "@/components/tags/TagManagerList";
import { CreateTagDialog } from "@/components/tags/CreateTagDialog";

/**
 * Tag Manager Page
 *
 * Features:
 * - Display all user tags with usage statistics
 * - Create new tags
 * - Edit tag name and color
 * - Delete single or multiple tags
 * - Merge duplicate tags
 * - Search tags
 */

interface TagsPageProps {
  searchParams: Promise<{
    search?: string;
    sortBy?: string;
    sortOrder?: string;
  }>;
}

export default async function TagsPage({ searchParams }: TagsPageProps) {
  const params = await searchParams;

  // Fetch tags with filters
  const { tags } = await getTags({
    search: params.search,
    sortBy: params.sortBy as "name" | "createdAt" | undefined,
    sortOrder: params.sortOrder as "asc" | "desc" | undefined,
  });

  // Fetch usage statistics
  const tagStats = await getTagUsageStats();

  // Create a map of tag ID to usage stats for easy lookup
  const statsMap = new Map(
    tagStats.map((stat) => [
      stat.tag.id,
      {
        usageByType: stat.usageByType,
        totalUsage: stat.totalUsage,
      },
    ])
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Tags"
        description="Manage your tags, view usage statistics, and organize your content"
        actions={
          <CreateTagDialog>
            <Button>
              <Plus className="h-4 w-4" />
              New Tag
            </Button>
          </CreateTagDialog>
        }
      />

      <TagManagerList tags={tags} statsMap={statsMap} />
    </div>
  );
}
