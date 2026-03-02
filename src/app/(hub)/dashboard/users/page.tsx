import { db } from "@/db";
import { user } from "@/db/schema";
import { requireAuth } from "@/lib/rbac";
import { desc } from "drizzle-orm";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/common";
import { RoleSelector } from "./RoleSelector";
import { formatFullDate } from "@/lib/dates";

/**
 * Dashboard users management page (Admin only).
 * Mostra tutti gli utenti e permette di gestire i loro ruoli.
 */
export const dynamic = "force-dynamic";

export default async function UsersPage() {
  // Richiede ruolo admin
  const session = await requireAuth(["admin"]);

  // Fetch tutti gli utenti
  const allUsers = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));

  // Statistiche per ruolo
  const usersByRole = {
    user: allUsers.filter((u) => u.role === "user").length,
    admin: allUsers.filter((u) => u.role === "admin").length,
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="User Management"
        description={`${allUsers.length} total users - Manage users and their roles`}
      />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Total Users</CardDescription>
            <CardTitle className="text-3xl">{allUsers.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Users</CardDescription>
            <CardTitle className="text-3xl">{usersByRole.user}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardDescription>Admins</CardDescription>
            <CardTitle className="text-3xl">{usersByRole.admin}</CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Users List */}
      <Card>
        <CardHeader>
          <CardTitle>All Users</CardTitle>
          <CardDescription>
            List of all registered users. Click on role to change it.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {allUsers.map((userItem) => (
              <div
                key={userItem.id}
                className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <div>
                      <p className="font-medium">{userItem.name}</p>
                      <p className="text-sm text-muted-foreground">{userItem.email}</p>
                    </div>
                    {userItem.id === session.user.id && (
                      <Badge variant="outline" className="text-xs">
                        You
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Joined: {formatFullDate(userItem.createdAt)}
                  </p>
                </div>

                <RoleSelector
                  userId={userItem.id}
                  currentRole={userItem.role}
                  disabled={userItem.id === session.user.id}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Warning */}
      <Alert className="border-yellow-500/50 bg-yellow-500/10">
        <AlertTriangle className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
        <AlertTitle className="text-yellow-600 dark:text-yellow-500">
          Be careful when changing user roles
        </AlertTitle>
        <AlertDescription className="text-yellow-600/80 dark:text-yellow-500/80">
          Changing a user's role will immediately affect their permissions across the system. You
          cannot change your own role.
        </AlertDescription>
      </Alert>
    </div>
  );
}
