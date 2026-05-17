import { Router } from "express";
import {
  getUserProfile,
  updateUserProfile,
  uploadUserProfilePicture,
  getUserCart,
  updateUserCart,
  getUserFavorites,
  updateUserFavorites,
} from "../controllers/userController.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { upload } from "../utils/upload.js";

const router = Router();

router.use(requireAuth);
router.get("/profile", getUserProfile);
router.put("/profile", updateUserProfile);
router.post("/profile/picture", upload.single("media"), uploadUserProfilePicture);
router.get("/cart", getUserCart);
router.put("/cart", updateUserCart);
router.get("/favorites", getUserFavorites);
router.put("/favorites", updateUserFavorites);

export default router;
