import compression from "compression";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";

export const applySecurityMiddleware = (app) => {
  app.use(helmet());
  app.use(compression());
  app.use(mongoSanitize());
};
