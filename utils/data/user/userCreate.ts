"server only";

import { db } from "@/db/drizzle";
import { users } from "@/db/schema";
import { userCreateProps } from "@/utils/types";
import { uid } from "uid";

export const userCreate = async ({
  email,
  first_name,
  last_name,
  profile_image_url,
  user_id,
}: userCreateProps) => {
  try {
    console.log("info", {
      email,
      firstName: first_name,
      lastName: last_name,
      profileImageUrl: profile_image_url,
      userId: user_id,
    });
    const result = db.insert(users).values({
      id: uid(32),
      email,
      firstName: first_name,
      lastName: last_name,
      profileImageUrl: profile_image_url,
      clerkId: user_id,
    }).returning();

    return result;
  } catch (error: any) {
    throw new Error(error.message);
  }
};
