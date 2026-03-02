import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { user, session } from "@/db/schema";
import { count } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RoleGate } from "@/components/auth";
import { QuickStats } from "@/components/dashboard/QuickStats";
import { TodayView } from "@/components/dashboard/TodayView";
import { UpcomingDeadlines } from "@/components/dashboard/UpcomingDeadlines";
import { QuickActions } from "@/components/dashboard/QuickActions";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Dashboard Homepage
 *
 * Displays:
 * - Quick stats (done today, overdue, active, in progress)
 * - Today's tasks and events
 * - Upcoming deadlines (next 7 days)
 * - Quick action buttons
 * - Admin stats (for admin users)
 */

// Loading skeletons for widgets
function QuickStatsLoading() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {[...Array(4)].map((_, i) => (
        <Card key={i}>
          <CardHeader className="pb-3">
            <Skeleton className="h-4 w-20" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-10 w-16 mb-2" />
            <Skeleton className="h-3 w-full" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TodayViewLoading() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {[...Array(2)].map((_, i) => (
        <Card key={i}>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-4 w-60 mt-2" />
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[...Array(3)].map((_, j) => (
                <Skeleton key={j} className="h-20 w-full" />
              ))}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function UpcomingDeadlinesLoading() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default async function DashboardPage() {
  // Session is verified by layout, guaranteed to exist
  const userSession = (await getSession())!;

  // Admin stats
  let userCount = 0;
  let sessionCount = 0;

  if (userSession.user.role === "admin") {
    const [userCountResult, sessionCountResult] = await Promise.all([
      db.select({ count: count() }).from(user),
      db.select({ count: count() }).from(session),
    ]);

    userCount = userCountResult[0]?.count ?? 0;
    sessionCount = sessionCountResult[0]?.count ?? 0;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {userSession.user.name}!</h1>
        <p className="text-muted-foreground mt-1">Here's your overview for today.</p>
      </div>

      {/* Quick Stats */}
      <Suspense fallback={<QuickStatsLoading />}>
        <QuickStats />
      </Suspense>

      {/* Quick Actions */}
      <QuickActions />

      {/* Today View */}
      <Suspense fallback={<TodayViewLoading />}>
        <TodayView />
      </Suspense>

      {/* Upcoming Deadlines */}
      <Suspense fallback={<UpcomingDeadlinesLoading />}>
        <UpcomingDeadlines />
      </Suspense>

      {/* Admin Stats */}
      <RoleGate allowedRoles={["admin"]}>
        <div className="pt-4 border-t">
          <h2 className="text-xl font-semibold mb-4">Admin Overview</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Total Users</CardDescription>
                <CardTitle className="text-4xl">{userCount}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Registered users in the system</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardDescription>Active Sessions</CardDescription>
                <CardTitle className="text-4xl">{sessionCount}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">Currently active sessions</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </RoleGate>
    </div>
  );
}
