import { drizzle } from "drizzle-orm/neon-http";
import { neon, Pool } from "@neondatabase/serverless";
import { drizzle as drizzleWs } from "drizzle-orm/neon-serverless";
import * as schema from "./schema/index";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined");
}

// HTTP driver for regular queries (fast, stateless)
const sql = neon(connectionString);
export const db = drizzle(sql, { schema });

// Type for the WebSocket-based db instance
export type TransactionDb = ReturnType<typeof drizzleWs<typeof schema>>;

/**
 * Execute a callback with transaction support using WebSocket driver.
 * Creates a new Pool connection per-call to avoid Cloudflare Workers I/O context issues.
 *
 * Usage:
 * ```ts
 * const result = await withTransaction(async (tx) => {
 *   await tx.delete(comment).where(...);
 *   await tx.delete(task).where(...);
 *   return { done: true };
 * });
 * ```
 */
export async function withTransaction<T>(
  callback: (tx: Parameters<Parameters<TransactionDb["transaction"]>[0]>[0]) => Promise<T>
): Promise<T> {
  const pool = new Pool({ connectionString });
  const wsDb = drizzleWs(pool, { schema });

  try {
    return await wsDb.transaction(callback);
  } finally {
    await pool.end();
  }
}
