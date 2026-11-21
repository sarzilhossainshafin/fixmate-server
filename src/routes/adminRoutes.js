
import express from "express";

import {
  getAllServicesForAdmin,
  updateServiceApproval,
  getAllUsers,
  updateUserRole,
  getAllBookings,
  getAllPayments,
  getAdminStats,
} from "../controllers/adminController.js";

import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyAdmin } from "../middlewares/verifyRole.js";

const router = express.Router();

// All admin routes require authentication and admin role
router.use(verifyToken, verifyAdmin);

// Dashboard statistics
router.get("/stats", getAdminStats);

// User management
router.get("/users", getAllUsers);
router.patch("/users/:id/role", updateUserRole);

// Service management
router.get("/services", getAllServicesForAdmin);
router.patch("/services/:id/approval", updateServiceApproval);

// Booking management
router.get("/bookings", getAllBookings);

// Payment management
router.get("/payments", getAllPayments);

export default router;
