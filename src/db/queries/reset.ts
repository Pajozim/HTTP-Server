import { chirps, users, tokens } from "../schema.js";
import { reset } from "drizzle-seed";
import { db } from "../index.js";
import { migrate } from "drizzle-orm/postgres-js/migrator";

export async function resetDB() {

  // First, run migrations to create tables
  await migrate(db, { migrationsFolder: "./src/db/migrations" });

  await reset(db, { users, chirps, tokens });
}
