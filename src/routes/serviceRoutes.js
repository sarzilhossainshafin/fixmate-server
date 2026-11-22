
import express from "express";

import {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
} from "../controllers/serviceController.js";

import {
  getMyServices,
  getMyServiceById,
  toggleServiceAvailability,
} from "../controllers/technicianServiceController.js";

import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyTechnician } from "../middlewares/verifyRole.js";

const router = express.Router();

// Technician-only routes — keep these before /:id
router.get(
  "/my",
  verifyToken,
  verifyTechnician,
  getMyServices
);

router.get(
  "/my/:id",
  verifyToken,
  verifyTechnician,
  getMyServiceById
);

router.patch(
  "/:id/availability",
  verifyToken,
  verifyTechnician,
  toggleServiceAvailability
);

// Public routes
router.get("/", getServices);
router.get("/:id", getServiceById);

// Technician-only service management
router.post("/", verifyToken, verifyTechnician, createService);
router.patch("/:id", verifyToken, verifyTechnician, updateService);
router.delete("/:id", verifyToken, verifyTechnician, deleteService);

export default router;
