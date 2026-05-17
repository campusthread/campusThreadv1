import { Router } from "express";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import {
  getDashboardStats,
  getAnalytics,
  getAllUsers,
  getUserById,
  updateUserRole,
  deleteUser,
  getPendingVendors,
  approveVendor,
  rejectVendor,
  getAllVendors,
  getAllOrders,
} from "../controllers/adminController.js";

const router = Router();

// All admin routes require authentication and admin role
router.use(requireAuth);
router.use(requireRole("admin"));

// Dashboard and analytics routes
router.get("/stats", getDashboardStats);
router.get("/analytics", getAnalytics);

// User management routes
router.get("/users", getAllUsers);
router.get("/users/:userId", getUserById);
router.put("/users/:userId/role", updateUserRole);
router.delete("/users/:userId", deleteUser);

// Vendor approval routes
router.get("/vendors/pending", getPendingVendors);
router.get("/vendors", getAllVendors);
router.get("/orders", getAllOrders);
router.put("/vendors/:vendorId/approve", approveVendor);
router.put("/vendors/:vendorId/reject", rejectVendor);

export default router;
