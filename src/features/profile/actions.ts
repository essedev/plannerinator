"use server";

import { getSession } from "@/lib/auth";
import { db } from "@/db";
import { user } from "@/db/schema";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { updateProfileSchema } from "./schema";
import { parseInput, errors } from "@/lib/errors";

export async function updateProfile(input: unknown) {
  const session = await getSession();

  if (!session?.user) {
    throw errors.unauthorized();
  }

  const data = parseInput(updateProfileSchema, input);

  const existingUser = await db.select().from(user).where(eq(user.email, data.email)).limit(1);

  if (existingUser.length > 0 && existingUser[0].id !== session.user.id) {
    throw errors.alreadyExists("Email");
  }

  await db
    .update(user)
    .set({
      name: data.name,
      email: data.email,
      updatedAt: new Date(),
    })
    .where(eq(user.id, session.user.id));

  revalidatePath("/dashboard/profile");
}
