
import express from "express";

import {
  createCheckoutSession,
  verifyCheckoutSession,
} from "../controllers/paymentController.js";

import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyCustomer } from "../middlewares/verifyRole.js";

const router = express.Router();

// Customer: Create Stripe Checkout Session
router.post(
  "/create-checkout-session",
  verifyToken,
  verifyCustomer,
  createCheckoutSession
);

// Customer: Verify successful Stripe payment
router.get(
  "/verify",
  verifyToken,
  verifyCustomer,
  verifyCheckoutSession
);

export default router;
