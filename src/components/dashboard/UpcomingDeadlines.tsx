import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { getUpcomingDeadlines } from "@/features/dashboard/queries";
import { formatShortDate } from "@/lib/dates";
import { TASK_PRIORITY_LABELS, TASK_STATUS_LABELS } from "@/lib/labels";
import { differenceInDays, isToday, isTomorrow } from "date-fns";
import { TASK_PRIORITY_TEXT_COLORS } from "@/lib/colors";
import { CalendarClock } from "lucide-react";
import Link from "next/link";

/**
 * UpcomingDeadlines Widget
 *
 * Displays tasks with deadlines in the next 7 days
 */
export async function UpcomingDeadlines() {
  const tasks = await getUpcomingDeadlines();

  // Helper to format relative date
  const getRelativeDate = (date: Date) => {
    if (isToday(date)) return "Today";
    if (isTomorrow(date)) return "Tomorrow";
    const days = differenceInDays(date, new Date());
    if (days === 2) return "In 2 days";
    if (days === 3) return "In 3 days";
    return formatShortDate(date);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CalendarClock className="h-5 w-5" />
            <CardTitle>Upcoming Deadlines</CardTitle>
          </div>
          <Badge variant="secondary">{tasks.length}</Badge>
        </div>
        <CardDescription>Tasks due in the next 7 days</CardDescription>
      </CardHeader>
      <CardContent>
        {tasks.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-4">
            No upcoming deadlines. You're all caught up! ✅
          </p>
        ) : (
          <div className="space-y-2">
            {tasks.map((task) => {
              const dueDate = task.dueDate ? new Date(task.dueDate) : null;
              const priorityColorClass =
                TASK_PRIORITY_TEXT_COLORS[
                  task.priority as keyof typeof TASK_PRIORITY_TEXT_COLORS
                ] || TASK_PRIORITY_TEXT_COLORS.medium;

              return (
                <Link
                  key={task.id}
                  href={`/dashboard/tasks/${task.id}`}
                  className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-accent transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-medium text-sm truncate">{task.title}</p>
                      <Badge variant="outline" className={`text-xs shrink-0 ${priorityColorClass}`}>
                        {TASK_PRIORITY_LABELS[task.priority as keyof typeof TASK_PRIORITY_LABELS]}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs">
                        {TASK_STATUS_LABELS[task.status as keyof typeof TASK_STATUS_LABELS]}
                      </Badge>
                    </div>
                  </div>
                  {dueDate && (
                    <div className="text-right shrink-0 ml-4">
                      <p className="text-xs font-medium">{getRelativeDate(dueDate)}</p>
                      <p className="text-xs text-muted-foreground">{formatShortDate(dueDate)}</p>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
