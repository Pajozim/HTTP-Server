// env.d.ts
declare namespace NodeJS {
  interface ProcessEnv {
    DB_URL: string;
    PORT: string;
    API_KEY: string;
    JWT_SECRET: string;
  }
}