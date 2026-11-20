
import express from "express";

import {
  getAllServicesForAdmin,
  updateServiceApproval,
} from "../controllers/adminController.js";

import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyAdmin } from "../middlewares/verifyRole.js";

const router = express.Router();

// All routes require admin authentication
router.use(verifyToken, verifyAdmin);

// Admin: Get all services
router.get("/services", getAllServicesForAdmin);

// Admin: Approve or reject a service
router.patch("/services/:id/approval", updateServiceApproval);

export default router;
