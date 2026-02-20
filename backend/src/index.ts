import "dotenv/config";
import { env } from "./config/env";
import { createApp } from "./app";
import { logger } from "./utils/logger";

const app = createApp();

app.listen(env.PORT, () => {
  logger.info("server_started", {
    port: env.PORT,
    environment: env.NODE_ENV,
    demo_mode: env.DEMO_MODE,
    approval_threshold: env.APPROVAL_THRESHOLD,
  });
});
