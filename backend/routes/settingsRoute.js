import { Router } from "express";
import { getSettings, updateSettings } from "../controllers/settingsController.js";
import { authenticateUser } from "../middleware/authMiddleware.js";

const router = Router();

router.use(authenticateUser);
router.get("/", getSettings);
router.put("/", updateSettings);

export default router;
