
import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { toNodeHandler } from "better-auth/node";

import { connectDB } from "./config/db.js";
import { createAuth } from "./config/auth.js";

import { verifyToken } from "./middlewares/verifyToken.js";
import { verifyAdmin } from "./middlewares/verifyRole.js";

import adminRoutes from "./routes/adminRoutes.js";
import serviceRoutes from "./routes/serviceRoutes.js";
import bookingRoutes from "./routes/bookingRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: process.env.CLIENT_URL || "http://localhost:3000",
    credentials: true,
  })
);

const startServer = async () => {
  try {
    // Connect to MongoDB
    await connectDB();

    // Initialize Better Auth
    const auth = createAuth();

    // Better Auth routes
    app.all("/api/auth/*splat", toNodeHandler(auth));

    app.use(express.json());

    // Home route
    app.get("/", (req, res) => {
      res.status(200).json({
        success: true,
        message: "FixMate API server is running!",
      });
    });

    // Health check
    app.get("/api/health", (req, res) => {
      res.status(200).json({
        success: true,
        message: "FixMate server is healthy.",
      });
    });

    // Protected JWT test route
    app.get("/api/test/protected", verifyToken, (req, res) => {
      res.status(200).json({
        success: true,
        message: "JWT verification successful!",
        user: req.user,
      });
    });

    // Admin-only test route
    app.get(
      "/api/test/admin",
      verifyToken,
      verifyAdmin,
      (req, res) => {
        res.status(200).json({
          success: true,
          message: "Admin access granted!",
          user: req.user,
        });
      }
    );

    // Service API routes
    app.use("/api/services", serviceRoutes);

    // Booking API routes
    app.use("/api/bookings", bookingRoutes);

    // Payment API routes
    app.use("/api/payments", paymentRoutes);

    // Admin API routes
    app.use("/api/admin", adminRoutes);

    app.listen(PORT, () => {
      console.log(`FixMate API server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Server startup failed:", error.message);
    process.exit(1);
  }
};

startServer();
