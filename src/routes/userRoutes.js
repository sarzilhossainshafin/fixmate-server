
import express from "express";

import {
  getMyProfile,
  updateMyProfile,
} from "../controllers/userController.js";

import { verifyToken } from "../middlewares/verifyToken.js";

const router = express.Router();

// All profile routes require authentication
router.use(verifyToken);

// Get own profile
router.get("/profile", getMyProfile);

// Update own profile
router.patch("/profile", updateMyProfile);

export default router;
