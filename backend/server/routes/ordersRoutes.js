import { Router } from "express";

import {
  createOrder,
  getOrderById,
  getUserOrders,
  getVendorOrders,
  initializePayment,
  updateOrderStatus,
  verifyPayment,
} from "../controllers/orderController.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.use(requireAuth);
router.get("/user/orders", getUserOrders);
router.get("/vendor/orders", requireRole("vendor"), getVendorOrders);
router.get("/payment/verify", verifyPayment);
router.get("/:id", getOrderById);
router.post("/", createOrder);
router.post("/:id/initialize-payment", initializePayment);
router.put("/:id/status", requireRole("vendor"), updateOrderStatus);

export default router;
