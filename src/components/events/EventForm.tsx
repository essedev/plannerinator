"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState, useRef, useCallback } from "react";
import { toast } from "sonner";
import { createEvent, updateEvent } from "@/features/events/actions";
import { createAndAssignTags } from "@/features/tags/utils";
import {
  createEventSchema,
  updateEventSchema,
  type EventCalendarType,
} from "@/features/events/schema";
import { useProjectSelection } from "@/hooks/use-project-selection";
import { PROJECT_STATUS_LABELS, EVENT_CALENDAR_TYPE_LABELS } from "@/lib/labels";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatForDateTimeInput } from "@/lib/dates";
import { FormActions } from "@/components/forms/FormActions";

interface EventFormProps {
  mode: "create" | "edit";
  parentEventId?: string; // For create mode
  selectedTags?: Array<{ id: string; name: string; color: string }>; // For create mode
  initialData?: {
    id?: string;
    title?: string;
    description?: string | null;
    startTime?: Date;
    endTime?: Date | null;
    location?: string | null;
    locationUrl?: string | null;
    calendarType?: "personal" | "work" | "family" | "other";
    allDay?: boolean;
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

export function EventForm({ mode, initialData, parentEventId, selectedTags }: EventFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { projects, loading: loadingProjects } = useProjectSelection();

  // Use refs to store saved datetime values (doesn't trigger re-renders)
  const savedStartTimeRef = useRef<string>("");
  const savedEndTimeRef = useRef<string>("");

  const { register, handleSubmit, formState, watch, setValue } = useForm({
    resolver: zodResolver(mode === "edit" ? updateEventSchema : createEventSchema),
    defaultValues: {
      title: initialData?.title || "",
      description: initialData?.description || undefined,
      startTime: initialData?.startTime ? formatForDateTimeInput(initialData.startTime) : "",
      endTime: initialData?.endTime ? formatForDateTimeInput(initialData.endTime) : undefined,
      location: initialData?.location || undefined,
      locationUrl: initialData?.locationUrl || undefined,
      calendarType: initialData?.calendarType || "personal",
      allDay: initialData?.allDay || false,
      projectId: initialData?.projectId || undefined,
    },
  });

  const isAllDay = watch("allDay");

  // Handle All Day checkbox toggle
  const handleAllDayChange = useCallback(
    (checked: boolean) => {
      const currentStartTime = watch("startTime") as string | undefined;
      const currentEndTime = watch("endTime") as string | undefined;

      if (checked) {
        // Switching to All Day mode: save full datetime and show only date
        if (
          currentStartTime &&
          typeof currentStartTime === "string" &&
          currentStartTime.length > 10
        ) {
          savedStartTimeRef.current = currentStartTime;
          setValue("startTime", currentStartTime.substring(0, 10), { shouldValidate: false });
        }
        if (currentEndTime && typeof currentEndTime === "string" && currentEndTime.length > 10) {
          savedEndTimeRef.current = currentEndTime;
          setValue("endTime", currentEndTime.substring(0, 10), { shouldValidate: false });
        }
      } else {
        // Switching to timed mode: restore saved datetime or add default time
        if (
          currentStartTime &&
          typeof currentStartTime === "string" &&
          currentStartTime.length === 10
        ) {
          if (savedStartTimeRef.current && savedStartTimeRef.current.startsWith(currentStartTime)) {
            setValue("startTime", savedStartTimeRef.current, { shouldValidate: false });
          } else {
            setValue("startTime", `${currentStartTime}T00:00`, { shouldValidate: false });
          }
        }
        if (currentEndTime && typeof currentEndTime === "string" && currentEndTime.length === 10) {
          if (savedEndTimeRef.current && savedEndTimeRef.current.startsWith(currentEndTime)) {
            setValue("endTime", savedEndTimeRef.current, { shouldValidate: false });
          } else {
            setValue("endTime", `${currentEndTime}T23:59`, { shouldValidate: false });
          }
        }
      }

      setValue("allDay", checked, { shouldValidate: true });
    },
    [setValue, watch]
  );

  const onSubmit = handleSubmit(async (data) => {
    setIsSubmitting(true);

    try {
      if (mode === "create") {
        const createdEvent = await createEvent({
          ...data,
          parentEventId: parentEventId || null,
        });

        if (createdEvent && selectedTags) {
          await createAndAssignTags(selectedTags, "event", createdEvent.id);
        }

        toast.success("Event created successfully!");
        router.push("/dashboard/events");
      } else if (initialData?.id) {
        await updateEvent(initialData.id, data);
        toast.success("Event updated successfully!");
        router.push(`/dashboard/events/${initialData.id}`);
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to save event");
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle>{mode === "create" ? "Create New Event" : "Edit Event"}</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Title <span className="text-destructive">*</span>
            </Label>
            <Input
              id="title"
              {...register("title")}
              placeholder="Enter event title"
              disabled={isSubmitting}
            />
            {formState.errors.title && (
              <p className="text-sm text-destructive">{formState.errors.title.message}</p>
            )}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              {...register("description")}
              placeholder="Add event description"
              rows={4}
              disabled={isSubmitting}
            />
            {formState.errors.description && (
              <p className="text-sm text-destructive">{formState.errors.description.message}</p>
            )}
          </div>

          {/* Row 3: Project | Calendar Type */}
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
                <SelectContent className="w-[var(--radix-select-trigger-width)]">
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

            {/* Calendar Type */}
            <div className="space-y-2">
              <Label htmlFor="calendarType">Calendar Type</Label>
              <Select
                value={watch("calendarType") || "personal"}
                onValueChange={(value) => setValue("calendarType", value as EventCalendarType)}
                disabled={isSubmitting}
              >
                <SelectTrigger id="calendarType" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="personal">{EVENT_CALENDAR_TYPE_LABELS.personal}</SelectItem>
                  <SelectItem value="work">{EVENT_CALENDAR_TYPE_LABELS.work}</SelectItem>
                  <SelectItem value="family">{EVENT_CALENDAR_TYPE_LABELS.family}</SelectItem>
                  <SelectItem value="other">{EVENT_CALENDAR_TYPE_LABELS.other}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 4: Start Time | (End Time + All Day) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Start Time */}
            <div className="space-y-2">
              <Label htmlFor="startTime">
                Start Time <span className="text-destructive">*</span>
              </Label>
              <Input
                id="startTime"
                type={isAllDay ? "date" : "datetime-local"}
                max={isAllDay ? "9999-12-31" : "9999-12-31T23:59"}
                {...register("startTime")}
                disabled={isSubmitting}
              />
              {formState.errors.startTime && (
                <p className="text-sm text-destructive">{formState.errors.startTime.message}</p>
              )}
            </div>

            {/* End Time + All Day Combined */}
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time</Label>
              <div className="flex gap-2">
                {/* End Time - 2/3 width */}
                <div className="w-2/3">
                  <Input
                    id="endTime"
                    type={isAllDay ? "date" : "datetime-local"}
                    max={isAllDay ? "9999-12-31" : "9999-12-31T23:59"}
                    {...register("endTime")}
                    disabled={isSubmitting}
                  />
                  {formState.errors.endTime && (
                    <p className="text-sm text-destructive mt-1">
                      {formState.errors.endTime.message}
                    </p>
                  )}
                </div>

                {/* All Day Checkbox - 1/3 width */}
                <div className="w-1/3 flex items-center justify-center border rounded-md px-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="allDay"
                      checked={isAllDay || false}
                      onCheckedChange={(checked) => handleAllDayChange(checked as boolean)}
                      disabled={isSubmitting}
                    />
                    <label
                      htmlFor="allDay"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      All day
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Row 5: Location | Location URL */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                {...register("location")}
                placeholder="Event location"
                disabled={isSubmitting}
              />
              {formState.errors.location && (
                <p className="text-sm text-destructive">{formState.errors.location.message}</p>
              )}
            </div>

            {/* Location URL */}
            <div className="space-y-2">
              <Label htmlFor="locationUrl">Location URL</Label>
              <Input
                id="locationUrl"
                type="url"
                {...register("locationUrl")}
                placeholder="https://maps.google.com/..."
                disabled={isSubmitting}
              />
              {formState.errors.locationUrl && (
                <p className="text-sm text-destructive">{formState.errors.locationUrl.message}</p>
              )}
            </div>
          </div>

          {/* Form Actions */}
          <FormActions
            isSubmitting={isSubmitting}
            mode={mode}
            onCancel={() => router.back()}
            submitLabel={mode === "create" ? "Create Event" : "Save Changes"}
          />
        </form>
      </CardContent>
    </Card>
  );
}
