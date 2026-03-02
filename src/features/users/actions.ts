"use server";

import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { updateUserRoleSchema } from "./schema";
import { sendEmail } from "@/lib/emails/send";
import { RoleChangedTemplate } from "@/lib/emails/templates/users/role-changed";
import { parseInput, errors } from "@/lib/errors";

export async function updateUserRole(userId: string, role: string) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "admin") {
    throw errors.forbidden("Only admins can update user roles");
  }

  const data = parseInput(updateUserRoleSchema, { userId, role });

  if (session.user.id === data.userId) {
    throw errors.invalidInput("You cannot change your own role");
  }

  const [targetUser] = await db.select().from(user).where(eq(user.id, data.userId)).limit(1);

  if (!targetUser) {
    throw errors.notFound("User");
  }

  const oldRole = targetUser.role;

  await db.update(user).set({ role: data.role }).where(eq(user.id, data.userId));

  if (targetUser.email) {
    try {
      await sendEmail({
        to: targetUser.email,
        subject: "Your account role has been updated",
        react: RoleChangedTemplate({
          name: targetUser.name || "User",
          oldRole: oldRole,
          newRole: data.role,
          changedBy: session.user.name || session.user.email || "Admin",
          changedAt: new Date(),
        }),
      });
    } catch (emailError) {
      console.error("Role change notification email failed:", emailError);
    }
  }

  revalidatePath("/dashboard/users");
}

export async function deleteUser(userId: string) {
  const session = await getSession();

  if (!session?.user || session.user.role !== "admin") {
    throw errors.forbidden("Only admins can delete users");
  }

  if (session.user.id === userId) {
    throw errors.invalidInput("You cannot delete yourself");
  }

  await db.delete(user).where(eq(user.id, userId));

  revalidatePath("/dashboard/users");
}
