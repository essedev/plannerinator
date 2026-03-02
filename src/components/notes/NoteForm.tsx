"use client";

import { FormActions } from "@/components/forms/FormActions";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createNote, updateNote } from "@/features/notes/actions";
import { createNoteSchema, updateNoteSchema, type NoteType } from "@/features/notes/schema";
import { createAndAssignTags } from "@/features/tags/utils";
import { useProjectSelection } from "@/hooks/use-project-selection";
import { NOTE_TYPE_LABELS, PROJECT_STATUS_LABELS } from "@/lib/labels";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { MarkdownEditor } from "./MarkdownEditor";

interface NoteFormProps {
  mode: "create" | "edit";
  parentNoteId?: string; // For create mode
  selectedTags?: Array<{ id: string; name: string; color: string }>; // For create mode
  initialData?: {
    id: string;
    title?: string | null;
    content?: string | null;
    type?: "note" | "document" | "research" | "idea" | "snippet";
    isFavorite?: boolean;
    projectId?: string | null;
    project?: {
      id: string;
      name: string;
      icon?: string | null;
      color?: string | null;
      status: string;
    } | null;
  };
}

export function NoteForm({ mode, initialData, parentNoteId, selectedTags }: NoteFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { projects, loading: loadingProjects } = useProjectSelection();
  const [isFocusMode, setIsFocusMode] = useState(false);

  const { register, handleSubmit, formState, watch, setValue } = useForm({
    resolver: zodResolver(mode === "edit" ? updateNoteSchema : createNoteSchema),
    defaultValues: {
      title: initialData?.title || "",
      content: initialData?.content || "",
      type: initialData?.type || "note",
      isFavorite: initialData?.isFavorite || false,
      projectId: initialData?.projectId || undefined,
    },
  });

  // Register content field manually since we're using a custom component
  useEffect(() => {
    register("content");
  }, [register]);

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        const createdNote = await createNote({
          ...data,
          parentNoteId: parentNoteId || null,
        });

        if (createdNote && selectedTags) {
          await createAndAssignTags(selectedTags, "note", createdNote.id);
        }

        toast.success("Note created successfully!");
        router.push("/dashboard/notes");
      } else if (initialData?.id) {
        await updateNote(initialData.id, data);
        toast.success("Note updated successfully!");
        router.push(`/dashboard/notes/${initialData.id}`);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save note");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Create New Note" : "Edit Note"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Title */}
          {!isFocusMode && (
            <div className="space-y-2">
              <Label htmlFor="title">Title (optional)</Label>
              <Input
                id="title"
                {...register("title")}
                placeholder="Enter note title"
                disabled={isSubmitting}
              />
              {formState.errors.title && (
                <p className="text-sm text-destructive">{formState.errors.title.message}</p>
              )}
            </div>
          )}

          {/* Row 2: Project | Type */}
          {!isFocusMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Project Selection */}
              <div className="space-y-2">
                <Label htmlFor="project">Project</Label>
                <Select
                  value={watch("projectId") || undefined}
                  onValueChange={(value) =>
                    setValue("projectId", value || undefined, { shouldValidate: true })
                  }
                  disabled={isSubmitting || loadingProjects}
                >
                  <SelectTrigger id="project" className="w-full">
                    <SelectValue placeholder={loadingProjects ? "Loading..." : "No project"} />
                  </SelectTrigger>
                  <SelectContent className="w-(--radix-select-trigger-width)">
                    {projects.map((project) => (
                      <SelectItem key={project.id} value={project.id}>
                        <span className="flex items-center gap-2">
                          {project.icon && <span>{project.icon}</span>}
                          <span className="flex-1 truncate">{project.name}</span>
                          {project.status && project.status !== "active" && (
                            <span className="text-xs text-muted-foreground">
                              (
                              {
                                PROJECT_STATUS_LABELS[
                                  project.status as keyof typeof PROJECT_STATUS_LABELS
                                ]
                              }
                              )
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {watch("projectId") && (
                  <button
                    type="button"
                    onClick={() => setValue("projectId", undefined, { shouldValidate: true })}
                    className="text-xs text-muted-foreground hover:text-foreground"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select
                  value={watch("type") || "note"}
                  onValueChange={(value) => setValue("type", value as NoteType)}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id="type" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="note">{NOTE_TYPE_LABELS.note}</SelectItem>
                    <SelectItem value="document">{NOTE_TYPE_LABELS.document}</SelectItem>
                    <SelectItem value="research">{NOTE_TYPE_LABELS.research}</SelectItem>
                    <SelectItem value="idea">{NOTE_TYPE_LABELS.idea}</SelectItem>
                    <SelectItem value="snippet">{NOTE_TYPE_LABELS.snippet}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {/* Favorite */}
          {!isFocusMode && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="isFavorite"
                checked={watch("isFavorite") || false}
                onCheckedChange={(checked) =>
                  setValue("isFavorite", checked as boolean, { shouldValidate: true })
                }
                disabled={isSubmitting}
              />
              <label
                htmlFor="isFavorite"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
              >
                Mark as favorite
              </label>
            </div>
          )}

          {/* Content - Markdown Editor */}
          <div className="space-y-2">
            {!isFocusMode && <Label htmlFor="content">Content</Label>}
            <MarkdownEditor
              value={watch("content") || ""}
              onChange={(value) =>
                setValue("content", value, { shouldValidate: true, shouldDirty: true })
              }
              placeholder="Write your note in markdown..."
              minHeight="600px"
              isFocusMode={isFocusMode}
              onFocusModeChange={setIsFocusMode}
            />
            {formState.errors.content && (
              <p className="text-sm text-destructive">{formState.errors.content.message}</p>
            )}
          </div>

          {/* Form Actions */}
          {!isFocusMode && (
            <FormActions
              isSubmitting={isSubmitting}
              mode={mode}
              onCancel={() => router.back()}
              submitLabel={mode === "create" ? "Create Note" : "Save Changes"}
            />
          )}
        </form>
      </CardContent>
    </Card>
  );
}
