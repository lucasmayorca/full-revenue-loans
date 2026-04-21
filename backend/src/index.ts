import "dotenv/config";
import { env } from "./config/env";
import { createApp } from "./app";
import { logger } from "./utils/logger";
import { runMigrations } from "./db/migrate";
import { isPgEnabled } from "./clients/pgClient";

async function main() {
  // Correr migraciones antes de arrancar (idempotente, no-op si no hay DATABASE_URL)
  try {
    await runMigrations();
  } catch (err) {
    logger.error("migration_failed_on_boot", {
      error: err instanceof Error ? err.message : String(err),
    });
    // No bloqueamos el arranque — el storage cae a in-memory si PG no está disponible
  }

  const app = createApp();
  app.listen(env.PORT, () => {
    logger.info("server_started", {
      port: env.PORT,
      environment: env.NODE_ENV,
      demo_mode: env.DEMO_MODE,
      approval_threshold: env.APPROVAL_THRESHOLD,
      persistence: isPgEnabled() ? "postgres" : "in-memory",
    });
  });
}

main().catch((err) => {
  logger.error("fatal_boot_error", { error: err instanceof Error ? err.message : String(err) });
  process.exit(1);
});
