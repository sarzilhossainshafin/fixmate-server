
import express from "express";

import upload from "../middlewares/upload.js";
import { uploadImage } from "../controllers/uploadController.js";

import { verifyToken } from "../middlewares/verifyToken.js";
import { verifyTechnician } from "../middlewares/verifyRole.js";

const router = express.Router();

// Technician-only image upload
router.post(
  "/",
  verifyToken,
  verifyTechnician,
  upload.single("image"),
  uploadImage
);

export default router;
