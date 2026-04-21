import fs from "fs";
import path from "path";
import { getPool, isPgEnabled } from "../clients/pgClient";
import { logger } from "../utils/logger";

/**
 * Corre el schema.sql de forma idempotente. Safe para llamar en cada boot.
 */
export async function runMigrations(): Promise<void> {
  if (!isPgEnabled()) {
    logger.info("pg_migration_skipped", { reason: "DATABASE_URL missing" });
    return;
  }

  const pool = getPool();
  if (!pool) return;

  const schemaPath = path.join(__dirname, "schema.sql");
  const sql = fs.readFileSync(schemaPath, "utf-8");

  try {
    await pool.query(sql);
    logger.info("pg_migration_completed");
  } catch (err) {
    logger.error("pg_migration_failed", {
      error: err instanceof Error ? err.message : String(err),
    });
    throw err;
  }
}
