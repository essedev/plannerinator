"use client";

import { useState } from "react";
import { PageHeader } from "@/components/common";
import { ProjectForm } from "@/components/projects/ProjectForm";
import { TagsCard } from "@/components/tags/TagsCard";
import { ParentEntityCard } from "@/components/common/ParentEntityCard";
import { parentProjectConfig } from "@/components/projects/parent-project-config";

/**
 * New Project Page
 *
 * Form to create a new project
 */

export default function NewProjectPage() {
  const [parentProjectId, setParentProjectId] = useState<string | undefined>();
  const [tags, setTags] = useState<Array<{ id: string; name: string; color: string }>>([]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Create Project"
        description="Create a new project to organize your tasks, events, and notes"
        backButton
      />

      {/* Project Form */}
      <ProjectForm mode="create" parentProjectId={parentProjectId} selectedTags={tags} />

      {/* Tags and Parent Project - Side by side */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TagsCard mode="create" entityType="project" initialTags={tags} onTagsChange={setTags} />
        <ParentEntityCard
          mode="create"
          config={parentProjectConfig}
          onParentChange={setParentProjectId}
        />
      </div>
    </div>
  );
}
