
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

// Admin: Get all services
const getAllServicesForAdmin = async (req, res) => {
  try {
    const db = getDB();

    const services = await db
      .collection("services")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      total: services.length,
      services,
    });
  } catch (error) {
    console.error("Admin get services error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch services.",
    });
  }
};

// Admin: Approve or reject a service
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
      { _id: new ObjectId(id) },
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

    return res.status(200).json({
      success: true,
      message: `Service ${approvalStatus} successfully.`,
    });
  } catch (error) {
    console.error("Service approval error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update service approval.",
    });
  }
};

// Admin: Get all users
const getAllUsers = async (req, res) => {
  try {
    const db = getDB();

    const users = await db
      .collection("user")
      .find(
        {},
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
      )
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      total: users.length,
      users,
    });
  } catch (error) {
    console.error("Admin get users error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch users.",
    });
  }
};

// Admin: Change a user's role
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!id || !ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid user ID.",
      });
    }

    if (!["customer", "technician", "admin"].includes(role)) {
      return res.status(400).json({
        success: false,
        message: "Role must be customer, technician, or admin.",
      });
    }

    if (String(req.user.id) === id) {
      return res.status(400).json({
        success: false,
        message: "You cannot change your own role.",
      });
    }

    const db = getDB();

    const result = await db.collection("user").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          role,
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "User not found.",
      });
    }

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role} successfully.`,
    });
  } catch (error) {
    console.error("Admin update user role error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to update user role.",
    });
  }
};

// Admin: Get all bookings
const getAllBookings = async (req, res) => {
  try {
    const db = getDB();

    const bookings = await db
      .collection("bookings")
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      total: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Admin get bookings error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch bookings.",
    });
  }
};

// Admin: Get all payments
const getAllPayments = async (req, res) => {
  try {
    const db = getDB();

    const payments = await db
      .collection("payments")
      .find({})
      .sort({ paidAt: -1 })
      .toArray();

    return res.status(200).json({
      success: true,
      total: payments.length,
      payments,
    });
  } catch (error) {
    console.error("Admin get payments error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch payments.",
    });
  }
};

// Admin: Get dashboard statistics
const getAdminStats = async (req, res) => {
  try {
    const db = getDB();

    const [
      totalUsers,
      totalTechnicians,
      totalCustomers,
      totalServices,
      pendingServices,
      approvedServices,
      totalBookings,
      totalPayments,
    ] = await Promise.all([
      db.collection("user").countDocuments({}),
      db.collection("user").countDocuments({ role: "technician" }),
      db.collection("user").countDocuments({ role: "customer" }),
      db.collection("services").countDocuments({}),
      db.collection("services").countDocuments({
        approvalStatus: "pending",
      }),
      db.collection("services").countDocuments({
        approvalStatus: "approved",
      }),
      db.collection("bookings").countDocuments({}),
      db.collection("payments").countDocuments({
        paymentStatus: "paid",
      }),
    ]);

    return res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalTechnicians,
        totalCustomers,
        totalServices,
        pendingServices,
        approvedServices,
        totalBookings,
        totalPayments,
      },
    });
  } catch (error) {
    console.error("Admin stats error:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to fetch dashboard statistics.",
    });
  }
};

export {
  getAllServicesForAdmin,
  updateServiceApproval,
  getAllUsers,
  updateUserRole,
  getAllBookings,
  getAllPayments,
  getAdminStats,
};
