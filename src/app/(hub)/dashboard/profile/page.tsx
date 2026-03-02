import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { EditProfileForm } from "@/features/profile/EditProfileForm";
import { PageHeader } from "@/components/common";
import { StorageQuota } from "@/components/attachments/StorageQuota";
import { getUserStorageQuota } from "@/features/attachments/queries";
import { Shield, Mail, Calendar, Clock } from "lucide-react";
import { formatFullDate, getDaysSince } from "@/lib/dates";

/**
 * Dashboard profile page.
 * Mostra le informazioni del profilo utente.
 * Accessibile a tutti gli utenti autenticati.
 */
export default async function ProfilePage() {
  // Session è già verificata dal layout, garantito che session esiste
  const session = (await getSession())!;

  // Fetch dati utente completi e storage quota in parallelo
  const [[userData], storageQuota] = await Promise.all([
    db.select().from(user).where(eq(user.id, session.user.id)).limit(1),
    getUserStorageQuota(),
  ]);

  if (!userData) {
    throw new Error("User data not found");
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Profile" description="View and manage your account information" />

      {/* Profile Information - Editable */}
      <EditProfileForm initialName={userData.name ?? ""} initialEmail={userData.email} />

      {/* Account Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Role Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Account Role</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Badge
                variant={userData.role === "admin" ? "default" : "outline"}
                className="text-sm px-3 py-1"
              >
                {userData.role.charAt(0).toUpperCase() + userData.role.slice(1)}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {userData.role === "admin"
                  ? "Full access to all features and settings"
                  : "Basic access to personal features"}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Email Status Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Email Status</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {userData.emailVerified ? (
                <>
                  <Badge variant="default" className="text-sm px-3 py-1">
                    ✓ Verified
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Your email address has been verified
                  </p>
                </>
              ) : (
                <>
                  <Badge variant="outline" className="text-sm px-3 py-1">
                    Not Verified
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    Please verify your email to unlock all features
                  </p>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Member Since Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Member Since</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-semibold">{formatFullDate(userData.createdAt)}</p>
              <p className="text-sm text-muted-foreground">
                {getDaysSince(userData.createdAt)} days ago
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Last Activity Card */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-primary" />
              <CardTitle className="text-base">Last Activity</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p className="text-2xl font-semibold">{formatFullDate(userData.updatedAt)}</p>
              <p className="text-sm text-muted-foreground">Profile last updated</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Storage Quota */}
      <StorageQuota quota={storageQuota} />
    </div>
  );
}
