"server only";

import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export const getUserIdFromClerkId = async ({
  clerkId,
}: {
  clerkId: string;
}) => {
  try {
    const user = await db
      .select()
      .from(users)
      .where(eq(users.clerkId, clerkId))
      .limit(1);
    if (user.length === 0) {
      throw new Error("User not found");
    }
    const result = user[0];
    return result.id;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
