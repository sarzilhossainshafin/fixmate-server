
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

// Customer: Create a new booking
const createBooking = async (req, res) => {
  try {
    const {
      serviceId,
      customerPhone,
      address,
      preferredDate,
      problemDescription,
    } = req.body;

    // Validate required fields
    if (
      !serviceId ||
      !customerPhone?.trim() ||
      !address?.trim() ||
      !preferredDate ||
      !problemDescription?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required booking information.",
      });
    }

    // Validate service ID
    if (!ObjectId.isValid(serviceId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID.",
      });
    }

    // Validate preferred date
    const bookingDate = new Date(preferredDate);

    if (Number.isNaN(bookingDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Please provide a valid preferred date.",
      });
    }

    const db = getDB();

    // Get the logged-in customer from database
    const customer = await db.collection("user").findOne({
      _id: new ObjectId(req.user.id),
      email: req.user.email,
      role: "customer",
    });

    if (!customer) {
      return res.status(403).json({
        success: false,
        message: "Customer account not found.",
      });
    }

    // Find an approved and available service
    const service = await db.collection("services").findOne({
      _id: new ObjectId(serviceId),
      approvalStatus: "approved",
      isAvailable: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found or currently unavailable.",
      });
    }

    // A technician cannot book their own service
    if (service.technicianEmail === customer.email) {
      return res.status(403).json({
        success: false,
        message: "You cannot book your own service.",
      });
    }

    // Prevent duplicate active bookings for the same service
    const existingBooking = await db.collection("bookings").findOne({
      serviceId,
      customerEmail: customer.email,
      status: {
        $in: ["requested", "accepted", "in-progress"],
      },
    });

    if (existingBooking) {
      return res.status(409).json({
        success: false,
        message: "You already have an active request for this service.",
      });
    }

    // Create booking document
    const newBooking = {
      serviceId,

      serviceTitle: service.title,
      serviceImage: service.image,
      category: service.category,
      basePrice: service.basePrice,

      technicianName: service.technicianName,
      technicianEmail: service.technicianEmail,

      customerName: customer.name,
      customerEmail: customer.email,
      customerPhone: customerPhone.trim(),

      address: address.trim(),
      preferredDate: bookingDate,
      problemDescription: problemDescription.trim(),

      status: "requested",
      finalAmount: service.basePrice,
      paymentStatus: "unpaid",

      createdAt: new Date(),
    };

    const result = await db.collection("bookings").insertOne(newBooking);

    res.status(201).json({
      success: true,
      message: "Repair request submitted successfully.",
      booking: {
        _id: result.insertedId,
        ...newBooking,
      },
    });
  } catch (error) {
    console.error("Create booking error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create booking.",
    });
  }
};

// Customer: Get own bookings
const getMyBookings = async (req, res) => {
  try {
    const db = getDB();

    const bookings = await db
      .collection("bookings")
      .find({
        customerEmail: req.user.email,
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      total: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get customer bookings error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch your bookings.",
    });
  }
};

// Customer: Cancel own requested booking
const cancelBooking = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const db = getDB();

    const result = await db.collection("bookings").updateOne(
      {
        _id: new ObjectId(id),
        customerEmail: req.user.email,
        status: "requested",
      },
      {
        $set: {
          status: "cancelled",
          updatedAt: new Date(),
        },
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Booking not found, or it can no longer be cancelled.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully.",
    });
  } catch (error) {
    console.error("Cancel booking error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to cancel booking.",
    });
  }
};

// Technician: Get own bookings
const getTechnicianBookings = async (req, res) => {
  try {
    const db = getDB();

    const bookings = await db
      .collection("bookings")
      .find({
        technicianEmail: req.user.email,
      })
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      total: bookings.length,
      bookings,
    });
  } catch (error) {
    console.error("Get technician bookings error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch technician bookings.",
    });
  }
};

// Technician: Update booking status
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, finalAmount } = req.body;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking ID.",
      });
    }

    const allowedStatuses = [
      "accepted",
      "rejected",
      "in-progress",
      "completed",
    ];

    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: "Invalid booking status.",
      });
    }

    const db = getDB();

    // Find booking owned by the logged-in technician
    const booking = await db.collection("bookings").findOne({
      _id: new ObjectId(id),
      technicianEmail: req.user.email,
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        message: "Booking not found or you do not own this booking.",
      });
    }

    // Enforce the job status pipeline
    const allowedTransitions = {
      requested: ["accepted", "rejected"],
      accepted: ["in-progress"],
      "in-progress": ["completed"],
    };

    if (!allowedTransitions[booking.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Cannot change booking from ${booking.status} to ${status}.`,
      });
    }

    const updateData = {
      status,
      updatedAt: new Date(),
    };

    // Final amount is required when completing a job
    if (status === "completed") {
      const amount = Number(finalAmount);

      if (
        finalAmount === undefined ||
        finalAmount === null ||
        finalAmount === "" ||
        !Number.isFinite(amount) ||
        amount <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "A valid final amount greater than zero is required.",
        });
      }

      updateData.finalAmount = amount;
    }

    // Check current status again to prevent stale updates
    const result = await db.collection("bookings").updateOne(
      {
        _id: new ObjectId(id),
        technicianEmail: req.user.email,
        status: booking.status,
      },
      {
        $set: updateData,
      }
    );

    if (result.matchedCount === 0) {
      return res.status(409).json({
        success: false,
        message: "Booking status changed. Please refresh and try again.",
      });
    }

    res.status(200).json({
      success: true,
      message: `Booking ${status} successfully.`,
    });
  } catch (error) {
    console.error("Update booking status error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update booking status.",
    });
  }
};

export {
  createBooking,
  getMyBookings,
  cancelBooking,
  getTechnicianBookings,
  updateBookingStatus,
};
