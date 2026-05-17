import { Router } from "express";
import { getBrands, createBrand, deleteBrand } from "../controllers/brandController.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { requireRole } from "../middleware/role.middleware.js";

const router = Router();

router.get("/", getBrands);
router.post("/", requireAuth, requireRole("admin"), createBrand);
router.delete("/:id", requireAuth, requireRole("admin"), deleteBrand);

export default router;
