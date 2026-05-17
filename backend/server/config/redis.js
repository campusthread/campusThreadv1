import { createClient } from "redis";

import { env } from "./env.js";
import { logger } from "../utils/logger.js";

let redisClient;
let hasLoggedRedisError = false;

export const connectRedis = async () => {
  if (!env.redisEnabled) {
    logger.info("Redis disabled for this environment");
    return null;
  }

  if (redisClient?.isOpen) {
    return redisClient;
  }

  redisClient = createClient({ url: env.redisUrl });
  redisClient.on("error", (error) => {
    if (hasLoggedRedisError) {
      return;
    }

    hasLoggedRedisError = true;
    logger.warn("Redis unavailable, continuing without it", {
      code: error?.code,
      message: error?.message,
      url: env.redisUrl,
    });
  });

  try {
    await redisClient.connect();
    hasLoggedRedisError = false;
    logger.info("Redis connected", {
      url: env.redisUrl,
    });
  } catch (error) {
    logger.warn("Redis connection skipped", {
      message: error.message,
      url: env.redisUrl,
    });
  }

  return redisClient;
};

export const getRedisClient = () => redisClient;

export const disconnectRedis = async () => {
  if (redisClient?.isOpen) {
    await redisClient.quit();
    logger.info("Redis disconnected");
  }
};
