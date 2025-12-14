import { defineConfig } from "drizzle-kit";

import { config } from "dotenv";
// Load the .env file
config();
// Access your environment variables
const dbUrl = process.env.DB_URL;
if (!dbUrl) {
  throw new Error('DB_URL environment variable is not set');
}

export default defineConfig({
  schema: "src/db/schema.ts",
  out: "src/db/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: `${dbUrl}`,
  },
});

/*
import type { MigrationConfig } from "drizzle-orm/migrator";

const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db/migrations",
};
*/