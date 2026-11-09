import { Router } from "express";
import {
  getCurrentUser,
  login,
  signup,
} from "../controllers/authController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = Router();

router.post("/signup", signup);
router.post("/login", login);
router.get("/me", authenticateUser, getCurrentUser);

export default router;