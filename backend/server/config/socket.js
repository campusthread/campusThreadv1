import { Server } from "socket.io";

import { env } from "./env.js";
import { logger } from "../utils/logger.js";

let io;

export const setupSocketServer = (server) => {
  io = new Server(server, {
    cors: {
      origin: env.allowedOrigins,
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    logger.info(`Socket connected: ${socket.id}`);
    socket.on("disconnect", () => logger.info(`Socket disconnected: ${socket.id}`));
  });

  return io;
};

export const getIO = () => io;
