"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { createProject, updateProject } from "@/features/projects/actions";
import { createAndAssignTags } from "@/features/tags/utils";
import { createProjectSchema, updateProjectSchema } from "@/features/projects/schema";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatForDateInput } from "@/lib/dates";
import { PROJECT_STATUS_LABELS } from "@/lib/labels";
import { FormActions } from "@/components/forms/FormActions";

interface ProjectFormProps {
  mode: "create" | "edit";
  parentProjectId?: string; // For create mode
  selectedTags?: Array<{ id: string; name: string; color: string }>; // For create mode
  initialData?: {
    id: string;
    name: string;
    description?: string | null;
    status?: "active" | "on_hold" | "completed" | "archived" | "cancelled";
    color?: string | null;
    icon?: string | null;
    startDate?: Date | null;
    endDate?: Date | null;
  };
}

export function ProjectForm({
  mode,
  initialData,
  parentProjectId,
  selectedTags,
}: ProjectFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState, watch, setValue } = useForm({
    resolver: zodResolver(mode === "edit" ? updateProjectSchema : createProjectSchema),
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || undefined,
      icon: initialData?.icon || undefined,
      color: initialData?.color || undefined,
      ...(mode === "edit" && { status: initialData?.status || "active" }),
      startDate: initialData?.startDate ? formatForDateInput(initialData.startDate) : undefined,
      endDate: initialData?.endDate ? formatForDateInput(initialData.endDate) : undefined,
    },
  });

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        const createdProject = await createProject({
          ...data,
          parentProjectId: parentProjectId || null,
        });

        if (createdProject && selectedTags) {
          await createAndAssignTags(selectedTags, "project", createdProject.id);
        }

        toast.success("Project created successfully!");
        router.push("/dashboard/projects");
      } else if (initialData?.id) {
        await updateProject(initialData.id, data);
        toast.success("Project updated successfully!");
        router.push(`/dashboard/projects/${initialData.id}`);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save project");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Create New Project" : "Edit Project"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Name */}
          <div className="space-y-2">
            <Label htmlFor="name">
              Name <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              {...register("name")}
              placeholder="Enter project name"
              disabled={isSubmitting}
            />
            {formState.errors.name && (
              <p className="text-sm text-destructive">{formState.errors.name.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Brief description of the project"
              rows={4}
              disabled={isSubmitting}
            />
            {formState.errors.description && (
              <p className="text-sm text-destructive">{formState.errors.description.message}</p>
            )}
          </div>

          {/* Status - Only in Edit Mode */}
          {mode === "edit" && (
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={watch("status") || "active"}
                onValueChange={(value) =>
                  setValue(
                    "status",
                    value as "active" | "on_hold" | "completed" | "archived" | "cancelled"
                  )
                }
                disabled={isSubmitting}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">{PROJECT_STATUS_LABELS.active}</SelectItem>
                  <SelectItem value="on_hold">{PROJECT_STATUS_LABELS.on_hold}</SelectItem>
                  <SelectItem value="completed">{PROJECT_STATUS_LABELS.completed}</SelectItem>
                  <SelectItem value="archived">{PROJECT_STATUS_LABELS.archived}</SelectItem>
                  <SelectItem value="cancelled">{PROJECT_STATUS_LABELS.cancelled}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Icon & Color */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Icon */}
            <div className="space-y-2">
              <Label htmlFor="icon">Icon (emoji)</Label>
              <Input
                id="icon"
                {...register("icon")}
                placeholder="📁"
                disabled={isSubmitting}
                maxLength={10}
              />
              <p className="text-xs text-muted-foreground">
                Add an emoji to represent this project
              </p>
            </div>

            {/* Color Picker */}
            <div className="space-y-2">
              <Label htmlFor="color">Color</Label>
              <Input
                id="color"
                type="color"
                {...register("color")}
                disabled={isSubmitting}
                className="h-10 w-full"
              />
              <p className="text-xs text-muted-foreground">
                Project color for badges and UI elements
              </p>
            </div>
          </div>

          {/* Dates */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Start Date */}
            <div className="space-y-2">
              <Label htmlFor="startDate">Start Date</Label>
              <Input
                id="startDate"
                type="date"
                max="9999-12-31"
                {...register("startDate")}
                disabled={isSubmitting}
              />
            </div>

            {/* End Date */}
            <div className="space-y-2">
              <Label htmlFor="endDate">End Date</Label>
              <Input
                id="endDate"
                type="date"
                max="9999-12-31"
                {...register("endDate")}
                disabled={isSubmitting}
              />
              {formState.errors.endDate && (
                <p className="text-sm text-destructive">{formState.errors.endDate.message}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <FormActions
            isSubmitting={isSubmitting}
            mode={mode}
            onCancel={() => router.back()}
            submitLabel={mode === "create" ? "Create Project" : "Save Changes"}
          />
        </form>
      </CardContent>
    </Card>
  );
}
