import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getTodayItems } from "@/features/dashboard/queries";
import { formatTime } from "@/lib/dates";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/labels";
import { isPast } from "date-fns";
import { EVENT_CALENDAR_TYPE_SOLID_COLORS } from "@/lib/colors";
import { AlertCircle, Calendar, CheckSquare, Clock } from "lucide-react";
import Link from "next/link";

/**
 * TodayView Widget
 *
 * Displays today's tasks and events:
 * - Tasks due today or overdue (not done/cancelled)
 * - Events happening today
 */
export async function TodayView() {
  const { tasks, events } = await getTodayItems();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Today's Tasks */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckSquare className="h-5 w-5" />
              <CardTitle>Today's Tasks</CardTitle>
            </div>
            <Badge variant="secondary">{tasks.length}</Badge>
          </div>
          <CardDescription>Tasks due today and overdue</CardDescription>
        </CardHeader>
        <CardContent>
          {tasks.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No tasks for today. Great job! 🎉
            </p>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => {
                const isOverdue = task.dueDate && isPast(new Date(task.dueDate));
                return (
                  <Link
                    key={task.id}
                    href={`/dashboard/tasks/${task.id}`}
                    className="block p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{task.title}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge
                            variant={task.status === "in_progress" ? "default" : "secondary"}
                            className="text-xs"
                          >
                            {TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS]}
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {
                              TASK_PRIORITY_LABELS[
                                task.priority as keyof typeof TASK_PRIORITY_LABELS
                              ]
                            }
                          </Badge>
                        </div>
                      </div>
                      {isOverdue && <AlertCircle className="h-4 w-4 text-destructive shrink-0" />}
                    </div>
                    {task.dueDate && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatTime(new Date(task.dueDate))}
                        {isOverdue && (
                          <span className="text-destructive font-medium ml-1">(Overdue)</span>
                        )}
                      </p>
                    )}
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Today's Events */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              <CardTitle>Today's Events</CardTitle>
            </div>
            <Badge variant="secondary">{events.length}</Badge>
          </div>
          <CardDescription>Events scheduled for today</CardDescription>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              No events scheduled for today
            </p>
          ) : (
            <div className="space-y-3">
              {events.map((event) => {
                const colorClass =
                  EVENT_CALENDAR_TYPE_SOLID_COLORS[
                    event.calendarType as keyof typeof EVENT_CALENDAR_TYPE_SOLID_COLORS
                  ] || EVENT_CALENDAR_TYPE_SOLID_COLORS.other;

                return (
                  <Link
                    key={event.id}
                    href={`/dashboard/events/${event.id}`}
                    className="block p-3 rounded-lg border bg-card hover:bg-accent transition-colors"
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-1 h-full rounded-full ${colorClass}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{event.title}</p>
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {event.allDay ? (
                            "All day"
                          ) : (
                            <>
                              {formatTime(new Date(event.startTime))}
                              {event.endTime && ` - ${formatTime(new Date(event.endTime))}`}
                            </>
                          )}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
