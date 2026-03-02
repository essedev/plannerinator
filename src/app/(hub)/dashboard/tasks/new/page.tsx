"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common";
import { TaskForm } from "@/components/tasks/TaskForm";
import { TagsCard } from "@/components/tags/TagsCard";
import { ParentEntityCard } from "@/components/common/ParentEntityCard";
import { parentTaskConfig } from "@/components/tasks/parent-task-config";

/**
 * Create new task page
 */
export default function NewTaskPage() {
  const [parentTaskId, setParentTaskId] = useState<string | undefined>();
  const [tags, setTags] = useState<Array<{ id: string; name: string; color: string }>>([]);

  return (
    <div className="space-y-6">
      <PageHeader title="New Task" description="Create a new task to track your work" />
      <TaskForm mode="create" parentTaskId={parentTaskId} selectedTags={tags} />

      {/* Tags and Parent Task - Side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TagsCard mode="create" entityType="task" initialTags={tags} onTagsChange={setTags} />
        <ParentEntityCard
          mode="create"
          config={parentTaskConfig}
          onParentChange={setParentTaskId}
        />
      </div>
    </div>
  );
}
