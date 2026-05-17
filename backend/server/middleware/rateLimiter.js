import rateLimit from "express-rate-limit";

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res, next) => {
    res.status(429).json({
      success: false,
      message: "Too many requests. Please wait a few minutes and try again.",
    });
  },
});
