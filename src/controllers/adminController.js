
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

// Get all services for admin
const getAllServicesForAdmin = async (req, res) => {
  try {
    const db = getDB();

    const services = await db
      .collection("services")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      total: services.length,
      services,
    });
  } catch (error) {
    console.error("Admin get services error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch services.",
    });
  }
};

// Approve or reject a service
const updateServiceApproval = async (req, res) => {
  try {
    const { id } = req.params;
    const { approvalStatus } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID.",
      });
    }

    if (!["approved", "rejected"].includes(approvalStatus)) {
      return res.status(400).json({
        success: false,
        message: "Approval status must be approved or rejected.",
      });
    }

    const db = getDB();

    const result = await db.collection("services").updateOne(
      {
        _id: new ObjectId(id),
      },
      {
        $set: {
          approvalStatus,
          reviewedBy: req.user.email,
          reviewedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    res.status(200).json({
      success: true,
      message: `Service ${approvalStatus} successfully.`,
    });
  } catch (error) {
    console.error("Service approval error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update service approval.",
    });
  }
};

export {
  getAllServicesForAdmin,
  updateServiceApproval,
};
