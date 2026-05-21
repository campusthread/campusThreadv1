import { Router } from "express";

import {
  createOrder,
  getOrderById,
  getUserOrders,
  getVendorOrders,
  initializePayment,
  updateOrderStatus,
  verifyPayment,
  initializePaymentWithOrder,
} from "../controllers/orderController.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

// Verify payment endpoint - no auth required (secured by Paystack reference token)
router.get("/payment/verify", verifyPayment);

// All other routes require authentication
router.use(requireAuth);
router.get("/user/orders", getUserOrders);
router.get("/vendor/orders", requireRole("vendor"), getVendorOrders);
router.get("/:id", getOrderById);
router.post("/", createOrder);
router.post("/:id/initialize-payment", initializePayment);
router.post("/initialize-payment-with-order", initializePaymentWithOrder);
router.put("/:id/status", requireRole("vendor"), updateOrderStatus);

export default router;
