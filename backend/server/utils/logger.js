import util from "node:util";

const levelLabels = {
  info: "INFO",
  warn: "WARN",
  error: "ERROR",
};

const formatValue = (value) => {
  if (value === undefined || value === null) {
    return String(value);
  }

  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return util.inspect(value, {
    depth: 4,
    breakLength: 100,
    compact: false,
    sorted: true,
  });
};

const formatMeta = (meta) => {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) {
    return [`  details: ${formatValue(meta)}`];
  }

  return Object.entries(meta)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `  ${key}: ${formatValue(value)}`);
};

const format = (level, message, meta) => {
  const timestamp = new Date().toISOString();
  const lines = [`[${timestamp}] ${levelLabels[level] || level.toUpperCase()}  ${message}`];

  if (meta !== undefined) {
    lines.push(...formatMeta(meta));
  }

  return lines.join("\n");
};

export const logger = {
  info(message, meta) {
    console.log(format("info", message, meta));
  },
  warn(message, meta) {
    console.warn(format("warn", message, meta));
  },
  error(message, meta) {
    console.error(format("error", message, meta));
  },
};
