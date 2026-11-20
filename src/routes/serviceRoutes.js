
import express from "express";

import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "../controllers/serviceController.js";

import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyTechnician } from "../middlewares/verifyRole.js";

const router = express.Router();

// Public routes
router.get("/", getServices);
router.get("/:id", getServiceById);

// Technician-only routes
router.post("/", verifyToken, verifyTechnician, createService);
router.patch("/:id", verifyToken, verifyTechnician, updateService);
router.delete("/:id", verifyToken, verifyTechnician, deleteService);

export default router;

