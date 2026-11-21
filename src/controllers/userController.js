
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

// Get logged-in user's profile
const getMyProfile = async (req, res) => {
  try {
    const db = getDB();

    const user = await db.collection("user").findOne(
      { _id: new ObjectId(req.user.id) },
      {
        projection: {
          name: 1,
          email: 1,
          role: 1,
          phone: 1,
          area: 1,
          bio: 1,
          image: 1,
          createdAt: 1,
        },
      }
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.error("Get profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch profile.",
    });
  }
};

// Update logged-in user's profile
const updateMyProfile = async (req, res) => {
  try {
    const { name, phone, area, bio, image } = req.body;

    const allowedFields = {
      name,
      phone,
      area,
      bio,
      image,
    };

    const updates = {};

    for (const [key, value] of Object.entries(allowedFields)) {
      if (value !== undefined) {
        if (typeof value !== "string") {
          return res.status(400).json({
            success: false,
            message: `${key} must be a string.`,
          });
        }

        updates[key] = value.trim();
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one profile field is required.",
      });
    }

    if (updates.name !== undefined && !updates.name) {
      return res.status(400).json({
        success: false,
        message: "Name cannot be empty.",
      });
    }

    if (updates.image && !/^https?:\/\/.+/i.test(updates.image)) {
      return res.status(400).json({
        success: false,
        message: "Profile image must be a valid HTTP or HTTPS URL.",
      });
    }

    updates.updatedAt = new Date();

    const db = getDB();

    const result = await db.collection("user").updateOne(
      { _id: new ObjectId(req.user.id) },
      { $set: updates }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User profile not found.",
      });
    }

    const updatedUser = await db.collection("user").findOne(
      { _id: new ObjectId(req.user.id) },
      {
        projection: {
          name: 1,
          email: 1,
          role: 1,
          phone: 1,
          area: 1,
          bio: 1,
          image: 1,
          createdAt: 1,
          updatedAt: 1,
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully.",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update profile.",
    });
  }
};

export {
  getMyProfile,
  updateMyProfile,
};
