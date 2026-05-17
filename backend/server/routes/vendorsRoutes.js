import { Router } from "express";

import {
  getVendorProfile,
  updateVendorProfile,
  uploadVendorProfilePicture,
} from "../controllers/vendorController.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { upload } from "../utils/upload.js";

const router = Router();

router.use(requireAuth, requireRole("vendor"));
router.get("/profile", getVendorProfile);
router.put("/profile", updateVendorProfile);
router.post("/profile/picture", upload.single("media"), uploadVendorProfilePicture);

export default router;
