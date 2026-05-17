import { Router } from "express";

import {
  addProductReview,
  createProduct,
  deleteProduct,
  getProductById,
  getProducts,
  getVendorProducts,
  updateProduct,
  uploadProductMedia,
} from "../controllers/productController.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { upload } from "../utils/upload.js";

const router = Router();

router.get("/", getProducts);
router.get("/vendor/products", requireAuth, requireRole("vendor"), getVendorProducts);
router.get("/:id", getProductById);
router.post("/", requireAuth, requireRole("vendor"), createProduct);
router.put("/:id", requireAuth, requireRole("vendor"), updateProduct);
router.delete("/:id", requireAuth, requireRole("vendor"), deleteProduct);
router.post("/:id/media", requireAuth, requireRole("vendor"), upload.single("media"), uploadProductMedia);
router.post("/:id/reviews", requireAuth, addProductReview);

export default router;
