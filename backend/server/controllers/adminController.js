import { sendSuccess, sendError } from "../utils/response.js";
import { AppError } from "../utils/errors.js";
import User from "../models/User.js";
import Order from "../models/Order.js";
import Product from "../models/Product.js";
import Brand from "../models/Brand.js";
import * as emailService from "../services/emailService.js";
import { logger } from "../utils/logger.js";

const resolveReminderAudienceFilter = (audience) => {
  const normalizedAudience = (audience || 'all').toLowerCase();

  if (normalizedAudience === 'vendors') {
    return { role: 'vendor' };
  }

  if (normalizedAudience === 'customers' || normalizedAudience === 'buyers') {
    return { role: { $in: ['customer', 'buyer'] } };
  }

  return { role: { $in: ['customer', 'vendor', 'buyer'] } };
};

const buildDashboardStats = async () => {
  const totalUsers = await User.countDocuments();
  const totalVendors = await User.countDocuments({ role: "vendor" });
  const totalProducts = await Product.countDocuments();
  const totalBrands = await Brand.countDocuments();
  // Count only paid orders as "placed" orders to avoid counting pending/abandoned payments
  const totalPaidOrders = await Order.countDocuments({ paymentStatus: 'paid' });
  const totalOrders = totalPaidOrders;

  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  const activeUsers30d = await User.countDocuments({ updatedAt: { $gte: thirtyDaysAgo } });

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const newUsers7d = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

  const orderRevenue = await Order.aggregate([
    { $match: { paymentStatus: 'paid' } },
    { $group: { _id: null, total: { $sum: '$totalAmount' } } },
  ]);

  const totalRevenue = orderRevenue[0]?.total || 0;
  const avgOrderValue = totalPaidOrders > 0 ? totalRevenue / totalPaidOrders : 0;
  const serviceCommission = Number((totalRevenue * 0.1).toFixed(2));

  return {
    totalUsers,
    totalVendors,
    totalProducts,
    totalBrands,
    totalOrders,
    totalRevenue,
    avgOrderValue,
    serviceCommission,
    activeUsers30d,
    newUsers7d,
  };
};

// Get dashboard statistics
export const getDashboardStats = async (req, res) => {
  try {
    const stats = await buildDashboardStats();
    const totalVendors = await User.countDocuments({ role: "vendor" });
    const totalProducts = await Product.countDocuments();
    const totalOrders = await Order.countDocuments();

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers30d = await User.countDocuments({ updatedAt: { $gte: thirtyDaysAgo } });

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const newUsers7d = await User.countDocuments({ createdAt: { $gte: sevenDaysAgo } });

    sendSuccess(res, {
      message: "Dashboard stats fetched",
      data: stats,
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Get analytics data
export const getAnalytics = async (req, res) => {
  try {
    const stats = await buildDashboardStats();
    sendSuccess(res, {
      message: "Analytics data fetched",
      data: stats,
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Get all users with pagination
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, role, search } = req.query;

    const skip = (page - 1) * limit;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const users = await User.find(filter)
      .select("-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    sendSuccess(res, {
      message: "Users fetched",
      data: {
        users,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Get user by ID
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select("-password");
    if (!user) throw new AppError("User not found", 404);

    sendSuccess(res, {
      message: "User fetched",
      data: { user },
    });
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

// Update user role
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!["customer", "vendor", "admin"].includes(role)) {
      throw new AppError("Invalid role", 400);
    }

    const user = await User.findByIdAndUpdate(userId, { role }, { new: true }).select("-password");
    if (!user) throw new AppError("User not found", 404);

    sendSuccess(res, {
      message: "User role updated",
      data: { user },
    });
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

// Delete user
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findByIdAndDelete(userId);
    if (!user) throw new AppError("User not found", 404);

    sendSuccess(res, {
      message: "User deleted successfully",
      data: { user },
    });
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

// Get pending vendors for approval
export const getPendingVendors = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    const skip = (page - 1) * limit;

    const vendors = await User.find({
      role: "vendor",
      vendorStatus: "pending",
    })
      .select("-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments({
      role: "vendor",
      vendorStatus: "pending",
    });

    sendSuccess(res, {
      message: "Pending vendors fetched",
      data: {
        vendors,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const filter = { paymentStatus: 'paid' };

    const orders = await Order.find(filter)
      .populate('buyer', 'name email phone')
      .populate('items.product', 'name')
      .populate('items.vendor', 'name brandName')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Order.countDocuments(filter);

    sendSuccess(res, {
      message: 'Orders fetched',
      data: {
        orders,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

export const sendReminderEmails = async (req, res) => {
  try {
    const { audience = 'all', headline, message, ctaUrl, ctaText, imageUrl } = req.body;
    const normalizedAudience = audience.toLowerCase();

    const allowedAudiences = ['vendors', 'customers', 'buyers', 'all'];
    if (!allowedAudiences.includes(normalizedAudience)) {
      throw new AppError('Invalid audience. Use vendors, customers, buyers, or all.', 400);
    }

    const filter = resolveReminderAudienceFilter(audience);

    const users = await User.find(filter).select('name email role brandName');

    const results = await Promise.allSettled(
      users.map((user) => {
        if (user.role === 'vendor') {
          return emailService.sendVendorUploadReminderEmail(user, {
            headline,
            message,
            ctaUrl,
            ctaText,
            imageUrl,
          });
        }

        return emailService.sendBuyerPromotionEmail(user, {
          headline,
          message,
          ctaUrl,
          ctaText,
          imageUrl,
        });
      }),
    );

    const successCount = results.filter((result) => result.status === 'fulfilled').length;

    sendSuccess(res, {
      message: 'Reminder emails processed',
      data: {
        audience: normalizedAudience,
        totalRecipients: users.length,
        successCount,
      },
    });
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

// Approve vendor
export const approveVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await User.findByIdAndUpdate(
      vendorId,
      { vendorStatus: "approved", vendorApprovedAt: new Date() },
      { new: true }
    ).select("-password");

    if (!vendor) throw new AppError("Vendor not found", 404);

    (async () => {
      try {
        await emailService.sendVendorApprovalEmail(vendor);
        logger.info("Sent vendor approval email", { to: vendor.email });
      } catch (err) {
        logger.error("Vendor approval email failed", { to: vendor.email, message: err?.message });
      }
    })();

    sendSuccess(res, {
      message: "Vendor approved successfully",
      data: { vendor },
    });
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

// Reject vendor
export const rejectVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;
    const { reason } = req.body;

    if (!reason) throw new AppError("Rejection reason is required", 400);

    const vendor = await User.findByIdAndUpdate(
      vendorId,
      {
        vendorStatus: "rejected",
        vendorRejectionReason: reason,
        vendorRejectedAt: new Date(),
      },
      { new: true }
    ).select("-password");

    if (!vendor) throw new AppError("Vendor not found", 404);

    (async () => {
      try {
        await emailService.sendVendorRejectionEmail(vendor, reason);
        logger.info("Sent vendor rejection email", { to: vendor.email });
      } catch (err) {
        logger.error("Vendor rejection email failed", { to: vendor.email, message: err?.message });
      }
    })();

    sendSuccess(res, {
      message: "Vendor rejected successfully",
      data: { vendor },
    });
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

// Get all vendors
export const getAllVendors = async (req, res) => {
  try {
    const { page = 1, limit = 10, status, search } = req.query;

    const skip = (page - 1) * limit;
    const filter = { role: "vendor" };

    if (status) filter.vendorStatus = status;
    if (search) {
      filter.$or = [
        { brandName: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const vendors = await User.find(filter)
      .select("-password")
      .skip(skip)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);

    sendSuccess(res, {
      message: "Vendors fetched",
      data: {
        vendors,
        total,
        page: parseInt(page),
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    sendError(res, error.message, 500);
  }
};

// Toggle vendor pin status
export const togglePinVendor = async (req, res) => {
  try {
    const { vendorId } = req.params;

    const vendor = await User.findById(vendorId);
    if (!vendor) throw new AppError("Vendor not found", 404);
    if (vendor.role !== "vendor") throw new AppError("User is not a vendor", 400);

    vendor.isPinned = !vendor.isPinned;
    await vendor.save();

    sendSuccess(res, {
      message: vendor.isPinned ? "Vendor pinned successfully" : "Vendor unpinned successfully",
      data: { vendor: vendor },
    });
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};

// Send broadcast message to all non-admin users
export const sendBroadcastMessage = async (req, res) => {
  try {
    const { subject, message, imageUrl, ctaUrl, ctaText } = req.body;

    if (!message) {
      throw new AppError('Message content is required', 400);
    }

    // Fetch all users except admins
    const users = await User.find({ role: { $ne: 'admin' } }).select('name email role');

    if (users.length === 0) {
      return sendSuccess(res, {
        message: 'No non-admin users found to send messages to',
        data: {
          totalRecipients: 0,
          successCount: 0,
        },
      });
    }

    const results = await Promise.allSettled(
      users.map((user) =>
        emailService.sendBroadcastMessageEmail(user, {
          subject,
          message,
          imageUrl,
          ctaUrl,
          ctaText,
        })
      )
    );

    const successCount = results.filter((result) => result.status === 'fulfilled').length;

    logger.info('Broadcast message sent', {
      totalRecipients: users.length,
      successCount,
      subject,
    });

    sendSuccess(res, {
      message: 'Broadcast message sent successfully',
      data: {
        totalRecipients: users.length,
        successCount,
        failureCount: users.length - successCount,
      },
    });
  } catch (error) {
    sendError(res, error.message, error.statusCode || 500);
  }
};
