import dns from "node:dns";
import mongoose from "mongoose";

import { env } from "./env.js";
import { logger } from "../utils/logger.js";

const redactMongoUri = (uri) => {
  try {
    return uri.replace(/\/\/([^:]+):([^@]+)@/, "//$1:***@");
  } catch {
    return "<unavailable>";
  }
};

const getMongoHints = (error) => {
  const message = `${error?.message || ""} ${error?.cause?.message || ""}`.toLowerCase();
  const hostname = error?.hostname || error?.cause?.hostname || error?.reason?.hostname;
  const code = error?.code || error?.cause?.code;

  if (message.includes("authentication failed") || code === 18) {
    return [
      "MongoDB authentication failed.",
      "Check the username/password in MONGODB_URI and make sure special characters in the password are URL-encoded.",
    ];
  }

  if (code === "ECONNREFUSED" && error?.syscall === "querySrv") {
    return [
      "Atlas SRV lookup failed before a database connection could be made.",
      hostname ? `The failing SRV host is ${hostname}.` : "The failing SRV host was not provided.",
      "Confirm the Atlas connection string is copied exactly from the 'Connect > Drivers' screen.",
      "If this keeps failing, try the non-SRV mongodb:// connection string from Atlas instead of mongodb+srv://.",
    ];
  }

  if (message.includes("querysrv") || message.includes("getaddrinfo") || message.includes("enotfound")) {
    return [
      "MongoDB DNS resolution failed.",
      "This usually means the Atlas hostname is wrong, the network cannot resolve it, or DNS access is blocked.",
    ];
  }

  if (message.includes("server selection timed out")) {
    return [
      "MongoDB server selection timed out.",
      "Common causes: Atlas IP allowlist is missing your current IP, the cluster is paused, or outbound access is blocked.",
    ];
  }

  if (message.includes("ip") && message.includes("whitelist")) {
    return [
      "MongoDB Atlas rejected the connection because your IP is not allowlisted.",
      "Add your current IP in Atlas Network Access and try again.",
    ];
  }

  if (message.includes("ssl") || message.includes("tls")) {
    return [
      "MongoDB TLS/SSL negotiation failed.",
      "Confirm you are using the exact Atlas driver URI and not a partially edited connection string.",
    ];
  }

  return [
    "MongoDB connection failed for an unclassified reason.",
    "Check the full error details below and verify the URI, Atlas cluster status, and Network Access settings.",
  ];
};

const summarizeMongoError = (error) => ({
  name: error?.name,
  message: error?.message,
  code: error?.code || error?.cause?.code,
  syscall: error?.syscall || error?.cause?.syscall,
  hostname: error?.hostname || error?.cause?.hostname || error?.reason?.hostname,
  errorLabelSet: error?.errorLabelSet ? Array.from(error.errorLabelSet) : undefined,
  reasonType: error?.reason?.type,
  cause: error?.cause?.message,
});

export const connectToDatabase = async () => {
  try {
    if (env.dnsServers?.length) {
      dns.setServers(env.dnsServers);
      logger.info("Using custom DNS servers for MongoDB resolution", {
        dnsServers: env.dnsServers,
      });
    }

    logger.info("Attempting MongoDB connection", {
      uri: redactMongoUri(env.mongoUri),
    });

    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 10000,
    });

    logger.info("MongoDB connected", {
      database: mongoose.connection.name,
      host: mongoose.connection.host,
      readyState: mongoose.connection.readyState,
    });
  } catch (error) {
    logger.error("MongoDB connection failed", summarizeMongoError(error));
    for (const hint of getMongoHints(error)) {
      logger.warn(hint);
    }
    throw error;
  }
};

export const disconnectFromDatabase = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
    logger.info("MongoDB disconnected");
  }
};
