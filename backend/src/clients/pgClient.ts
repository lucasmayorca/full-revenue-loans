import { Pool, PoolClient, QueryResult, QueryResultRow } from "pg";
import { logger } from "../utils/logger";

let pool: Pool | null = null;

/**
 * Devuelve el Pool singleton. Null si DATABASE_URL no está configurada
 * (permite correr en modo in-memory para DEMO_MODE / local dev).
 */
export function getPool(): Pool | null {
  if (pool) return pool;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) return null;

  pool = new Pool({
    connectionString,
    // Railway Postgres internal connection no requiere SSL
    ssl: connectionString.includes("railway.internal")
      ? false
      : { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30_000,
  });

  pool.on("error", (err) => {
    logger.error("pg_pool_error", { error: err.message });
  });

  return pool;
}

export function isPgEnabled(): boolean {
  return !!process.env.DATABASE_URL;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params: unknown[] = []
): Promise<QueryResult<T>> {
  const p = getPool();
  if (!p) throw new Error("Postgres pool not initialized (DATABASE_URL missing)");
  return p.query<T>(text, params);
}

export async function withClient<T>(
  fn: (client: PoolClient) => Promise<T>
): Promise<T> {
  const p = getPool();
  if (!p) throw new Error("Postgres pool not initialized");
  const client = await p.connect();
  try {
    return await fn(client);
  } finally {
    client.release();
  }
}
