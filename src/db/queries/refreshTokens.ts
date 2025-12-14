import { eq } from "drizzle-orm";
import { db } from "../index.js";
import { tokens, newToken, token } from "../schema.js";

export async function createRfToken(token: newToken): Promise<token | null> {
    const [result] = await db
        .insert(tokens)
        .values(token)
        .onConflictDoNothing()
        .returning();
    return result || null;   
}

export async function retrieveRfTbT(token: string): Promise<token | null> { // retrieve token by token
    const [result] = await db
        .select()
        .from(tokens)
        .where(eq(tokens.token, token));
    return result || null;
}

export async function retrieveRfTbU(user_id: string): Promise<token | null> { // retrieve token by user
    const [result] = await db
        .select()
        .from(tokens)
        .where(eq(tokens.user_id, user_id));
    return result || null;
}

export async function revokeRfT(token: token): Promise<token | null> {
    const [result] = await db
        .update(tokens)
        .set({ revoked_at: new Date() })
        .where(eq(tokens.token, token.token))
        .returning();
    return result || null;
}