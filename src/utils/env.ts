// src/utils/env.ts
/*
export function requireEnv(key: string): string {
  const value = process.env[key];
  
  if (!value) {
    throw new Error(`❌ Missing required environment variable: ${key}`);
  }
  
  return value;
}
*/

// Or more detailed version:
export function requireEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  
  if (!value) {
    if (defaultValue) return defaultValue;
    
    throw new Error(
      `❌ Missing required environment variable: ${key}\n` +
      `   Please add ${key}=your_value to your .env file`
    );
  }
  
  return value;
}

export function isProduction() {
  return process.env.NODE_ENV === "production";
}