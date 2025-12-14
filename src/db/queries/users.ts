import { eq, sql } from "drizzle-orm";
import { db } from "../index.js";
import { NewUser, User, users } from "../schema.js";
import { UUID } from "crypto";

export async function createUser(user: NewUser): Promise<NewUser | null> {
  const [result] = await db
    .insert(users)
    .values(user)
    .onConflictDoNothing()
    .returning();
  return result;
}

export async function userExists(email: string): Promise<User | null> {
  const [result] = await db
  .select()
  .from(users)
  .where(eq(users.email, email));
  return result || null;
}

export async function userUpdate(user: NewUser): Promise<User | null> {
    const [update] = await db
      .update(users)
      .set(user)
      .where(eq(users.id, user.id!))  // Yes, thi ! is intentional, I checked in function UpdateAccount() whether the id exists
      .returning();
    return update || null;
}

export async function userUpgradeTCR(userID: UUID): Promise<User | null> { // user upgrade to Chirpy Red
    const [update] = await db
      .update(users)
      .set({ isChirpyRed: true })
      .where(eq(users.id, userID))
      .returning();
    return update || null;
}