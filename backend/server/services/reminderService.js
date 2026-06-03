import User from "../models/User.js";
import { logger } from "../utils/logger.js";
import {
  sendBuyerPromotionEmail,
  sendGeneralReminderEmail,
  sendVendorUploadReminderEmail,
} from "./emailService.js";

const DEFAULT_REMINDER_DAYS = 3;

const buildAudienceFilter = (audience) => {
  const normalized = (audience || "all").toLowerCase();
  if (normalized === "vendors") {
    return { role: "vendor" };
  }
  if (normalized === "customers" || normalized === "buyers") {
    return { role: { $in: ["customer", "buyer"] } };
  }
  return { role: { $in: ["customer", "vendor", "buyer"] } };
};

const getDefaultContent = (role) => {
  if (role === "vendor") {
    return {
      headline: "Upload new products and boost your earnings",
      message:
        "Students are searching for fresh campus items. Keep your store visible by adding new products every few days.",
      ctaUrl: `${process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173"}/vendor-admin`,
    };
  }

  return {
    headline: "Discover fresh campus deals today",
    message:
      "New student products are waiting for you on CampusThread. Explore the latest campus finds and shop with confidence.",
    ctaUrl: `${process.env.FRONTEND_URL || process.env.CLIENT_URL || "http://localhost:5173"}/shop`,
  };
};

export const sendReminderCampaign = async ({ audience = "all", headline, message, ctaUrl } = {}) => {
  const filter = buildAudienceFilter(audience);
  const users = await User.find(filter).select("name email role brandName");

  if (!users.length) {
    logger.info("Reminder campaign skipped - no recipients found", { audience, total: 0 });
    return { audience, totalRecipients: 0, successCount: 0, failureCount: 0 };
  }

  const results = await Promise.allSettled(
    users.map((user) => {
      const defaultContent = getDefaultContent(user.role);
      const content = {
        headline: headline || defaultContent.headline,
        message: message || defaultContent.message,
        ctaUrl: ctaUrl || defaultContent.ctaUrl,
      };
      if (audience === "all") {
        return sendGeneralReminderEmail(user, content);
      }

      return user.role === "vendor"
        ? sendVendorUploadReminderEmail(user, content)
        : sendBuyerPromotionEmail(user, content);
    }),
  );

  const successCount = results.filter((result) => result.status === "fulfilled").length;
  const failureCount = results.length - successCount;

  logger.info("Reminder campaign completed", {
    audience,
    totalRecipients: users.length,
    successCount,
    failureCount,
  });

  return { audience, totalRecipients: users.length, successCount, failureCount };
};

export const startReminderScheduler = ({ intervalDays = DEFAULT_REMINDER_DAYS } = {}) => {
  const intervalMs = intervalDays * 24 * 60 * 60 * 1000;

  const runReminderJob = async () => {
    try {
      logger.info("Starting scheduled reminder job", { intervalDays });
      await sendReminderCampaign({ audience: "all" });
    } catch (err) {
      logger.error("Scheduled reminder job failed", { message: err?.message, stack: err?.stack });
    }
  };

  setInterval(runReminderJob, intervalMs).unref();
  logger.info("Reminder scheduler initialized", { intervalDays, intervalMs });
};
