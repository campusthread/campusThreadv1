import "express-async-errors";
import express from "express";
import cookieParser from "cookie-parser";
import cors from "cors";
import morgan from "morgan";

import { env } from "./config/env.js";
import { applySecurityMiddleware } from "./config/security.js";
import authRoutes from "./routes/authRoutes.js";
import ordersRoutes from "./routes/ordersRoutes.js";
import productsRoutes from "./routes/productsRoutes.js";
import usersRoutes from "./routes/usersRoutes.js";
import vendorsRoutes from "./routes/vendorsRoutes.js";
import brandsRoutes from "./routes/brandsRoutes.js";
import categoriesRoutes from "./routes/categoriesRoutes.js";
import adsRoutes from "./routes/adsRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import emailRoutes from "./routes/emailRoutes.js";
import { auditMiddleware } from "./middleware/audit.middleware.js";
import { notFoundHandler, errorHandler } from "./middleware/error.middleware.js";
import { apiLimiter } from "./middleware/rateLimiter.js";
import { sendSuccess } from "./utils/response.js";

const app = express();

app.set("trust proxy", env.isProduction);

app.use(
  cors({
    origin: env.allowedOrigins,
    credentials: true,
  }),
);
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(morgan(env.isProduction ? "combined" : "dev"));
applySecurityMiddleware(app);
app.use(auditMiddleware);

app.get("/health", (req, res) => {
  sendSuccess(res, {
    message: "Backend is healthy",
    data: {
      env: env.nodeEnv,
      timestamp: new Date().toISOString(),
    },
  });
});

app.use("/api", apiLimiter);
app.use("/api/auth", authRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/vendors", vendorsRoutes);
app.use("/api/products", productsRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/brands", brandsRoutes);
app.use("/api/categories", categoriesRoutes);
app.use("/api/ads", adsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/email", emailRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
