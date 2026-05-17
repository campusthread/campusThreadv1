import http from "node:http";

import app from "./app.js";
import { env } from "./config/env.js";
import { connectToDatabase, disconnectFromDatabase } from "./config/db.js";
import { connectRedis, disconnectRedis } from "./config/redis.js";
import { setupSocketServer } from "./config/socket.js";
import { logger } from "./utils/logger.js";

const server = http.createServer(app);
setupSocketServer(server);

const shutdown = async (signal) => {
  logger.info(`${signal} received, starting graceful shutdown`);

  server.close(async () => {
    await Promise.allSettled([disconnectFromDatabase(), disconnectRedis()]);
    logger.info("HTTP server closed");
    process.exit(0);
  });

  setTimeout(() => {
    logger.error("Forced shutdown after timeout");
    process.exit(1);
  }, 10000).unref();
};

const start = async () => {
  await connectToDatabase();
  await connectRedis();

  server.listen(env.port, () => {
    logger.info("API server listening", {
      environment: env.nodeEnv,
      port: env.port,
      url: `http://localhost:${env.port}`,
    });
  });
};

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

start().catch((error) => {
  logger.error("Failed to start server", {
    message: error?.message,
    name: error?.name,
    code: error?.code,
    syscall: error?.syscall,
    hostname: error?.hostname,
  });
  process.exit(1);
});
