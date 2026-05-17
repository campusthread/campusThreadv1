import { Router } from "express";
import { getAds, createAd, deleteAd } from "../controllers/adController.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";
import { upload } from "../utils/upload.js";

const router = Router();

router.get("/", getAds);
router.post("/", requireAuth, requireRole("admin"), upload.single("image"), createAd);
router.delete("/:id", requireAuth, requireRole("admin"), deleteAd);

export default router;
