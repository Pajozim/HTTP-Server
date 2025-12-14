import { sql } from "drizzle-orm";
//import { primaryKey } from "drizzle-orm/gel-core";
import { pgTable, timestamp, varchar, uuid, text, boolean } from "drizzle-orm/pg-core";

// users table/db
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  email: varchar("email", { length: 256 }).unique().notNull(),
  password: varchar("password", { length: 256 }).notNull().default("unset"),
  isChirpyRed: boolean("is_chirpy_red").notNull().default(false),
});

export type NewUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;

// chirps table/db
export const chirps = pgTable("chirps", {
  id: uuid("chID").primaryKey().defaultRandom(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at")
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
  body: varchar("body", { length: 140 }).notNull(),
  userId: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(),
});

export type NewChirp = typeof chirps.$inferInsert;
export type Chirp = typeof chirps.$inferSelect;

// refresh token table/db
export const tokens = pgTable("tokens", {
    token: text("token").primaryKey().notNull(), //the primary key - it's just a string
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow().$onUpdate(() => new Date()),
    user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }).notNull(), //foreign key that deletes the row if the user is deleted
    expires_at: timestamp('expires_at').notNull().default(sql`now() + interval '60 days'`),//the timestamp when the token expires
    revoked_at: timestamp('revoked_at'), //the timestamp when the token was revoked (null if not revoked)
})

export type newToken = typeof tokens.$inferInsert;
export type token = typeof tokens.$inferSelect;