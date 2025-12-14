import { UUID } from "node:crypto";
import { db } from "../index.js";
import { chirps, NewChirp, Chirp } from "../schema.js";

// create Chirp entry
export async function createChirp(chirp: NewChirp): Promise<Chirp | null> {
  const [result] = await db
    .insert(chirps)
    .values(chirp)
    .onConflictDoNothing()
    .returning();
  return result ?? null;
}

// retrieve all chirp entries
import { eq, asc, desc } from 'drizzle-orm';
export async function retrieveAllChirps(orderBy: "desc" | "asc" = "asc", authorId?: string): Promise<Chirp[]> {
  if (!authorId) return await db
    .select()
    .from(chirps)
    .orderBy(orderBy === "desc" ? desc(chirps.createdAt) : asc(chirps.createdAt)); 
  
  return await db
    .select()
    .from(chirps)
    .where(eq(chirps.userId, authorId))
    .orderBy(orderBy === "desc" ? desc(chirps.createdAt) : asc(chirps.createdAt));
};

// retrieve A chirp entry
export async function retrieveChirp(chirpID: UUID): Promise<Chirp | null> {
  const [result] = await db
    .select()
    .from(chirps)
    .where(eq(chirps.id, chirpID));
  return result ?? null;
};

// delete A chirp entry
export async function deleteChirpFromDB(chirpID: UUID): Promise<Chirp | null> {
  const [result] = await db
    .delete(chirps)
    .where(eq(chirps.id, chirpID))
    .returning();
  return result ?? null;
}

// modifies an entry