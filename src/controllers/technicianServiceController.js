
import { getDB } from "../config/db.js";
import { ObjectId } from "mongodb";

// Get all services created by the logged-in technician
export const getMyServices = async (req, res) => {
  try {
    const db = getDB();

    const services = await db
      .collection("services")
      .find({
        technicianEmail: req.user.email,
      })
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      total: services.length,
      services,
    });
  } catch (error) {
    console.error("Get my services error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your services.",
    });
  }
};

// Get one service owned by the logged-in technician.
// Pending services are also accessible to their owner.
export const getMyServiceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID.",
      });
    }

    const db = getDB();

    const service = await db.collection("services").findOne({
      _id: new ObjectId(id),
      technicianEmail: req.user.email,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found or you do not own this service.",
      });
    }

    return res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("Get my service details error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch your service details.",
    });
  }
};

// Toggle service availability
export const toggleServiceAvailability = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID.",
      });
    }

    const db = getDB();

    const service = await db.collection("services").findOne({
      _id: new ObjectId(id),
      technicianEmail: req.user.email,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found or you do not own this service.",
      });
    }

    const updatedAvailability = !service.isAvailable;

    await db.collection("services").updateOne(
      {
        _id: new ObjectId(id),
        technicianEmail: req.user.email,
      },
      {
        $set: {
          isAvailable: updatedAvailability,
          updatedAt: new Date(),
        },
      }
    );

    return res.status(200).json({
      success: true,
      message: updatedAvailability
        ? "Service is now available."
        : "Service is now unavailable.",
      isAvailable: updatedAvailability,
    });
  } catch (error) {
    console.error("Toggle service availability error:", error);

    return res.status(500).json({
      success: false,
      message: "Failed to update service availability.",
    });
  }
};
