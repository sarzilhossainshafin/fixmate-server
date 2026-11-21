
import express from "express";

import {
  createBooking,
  getMyBookings,
  cancelBooking,
  getTechnicianBookings,
  updateBookingStatus,
} from "../controllers/bookingController.js";

import { verifyToken } from "../middlewares/verifyToken.js";

import {
  verifyCustomer,
  verifyTechnician,
} from "../middlewares/verifyRole.js";

const router = express.Router();

// Customer-only routes
router.post("/", verifyToken, verifyCustomer, createBooking);

router.get("/my", verifyToken, verifyCustomer, getMyBookings);

router.patch(
  "/:id/cancel",
  verifyToken,
  verifyCustomer,
  cancelBooking
);

// Technician-only routes
router.get(
  "/technician",
  verifyToken,
  verifyTechnician,
  getTechnicianBookings
);

router.patch(
  "/:id/status",
  verifyToken,
  verifyTechnician,
  updateBookingStatus
);

export default router;
