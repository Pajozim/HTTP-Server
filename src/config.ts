import { loadEnvFile } from 'node:process';
loadEnvFile();
import { isProduction, requireEnv } from "./utils/env.js";
const dbUrl = requireEnv("DB_URL");
const port = requireEnv("PORT");
const platform = isProduction() ? "production" : "development";
const jwtSecret = requireEnv("JWT_SECRET");
const PolkaAPIKey = requireEnv("POLKA_KEY");


type Config = {
  api: APIConfig;
  db: DBConfig;
  jwt: JWTConfig;
};

type APIConfig = {
  fileServerHits: number;
  port: number;
  platform: string;
  polkaAPIKey: string;
};

import type { MigrationConfig } from "drizzle-orm/migrator";
const migrationConfig: MigrationConfig = {
  migrationsFolder: "./src/db/migrations",
};

type DBConfig = {
  url: string;
  migrationConfig: MigrationConfig;
};

type JWTConfig = {
  secret: string;
  expiresIn: number;
};

export const config: Config = {
  api: {
    fileServerHits: 0,
    port: Number(port),
    platform: platform,
    polkaAPIKey: PolkaAPIKey,
  },
  db: {
    url: dbUrl, 
    migrationConfig: migrationConfig, 
  },
  jwt: {
    secret: jwtSecret ?? "",
    expiresIn: 60 * 60 * 24, // 1 day
  },
};

// extended Error Objects/Classes
export const errorClasses = {
  BadRequestError: class BadRequestError extends Error {},
  UnauthorizedError: class UnauthorizedError extends Error {},
  ForbiddenError: class ForbiddenError extends Error {},
  NotFoundError: class NotFoundError extends Error {},
};

export const createError = (name: keyof typeof errorClasses, message: string) => {
  return new errorClasses[name](message);
};
