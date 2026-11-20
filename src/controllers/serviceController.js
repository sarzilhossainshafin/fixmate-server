
import { ObjectId } from "mongodb";
import { getDB } from "../config/db.js";

const SERVICE_CATEGORIES = [
  "Smartphone",
  "Laptop & PC",
  "AC",
  "Refrigerator",
  "TV",
  "Washing Machine",
  "Electrical",
];

const SERVICE_MODES = ["Home Visit", "Shop Drop-off"];

const getServices = async (req, res) => {
  try {
    const db = getDB();

    const { search, category, serviceMode, sort } = req.query;

    const query = {
      approvalStatus: "approved",
      isAvailable: true,
    };

    if (category && SERVICE_CATEGORIES.includes(category)) {
      query.category = category;
    }

    if (serviceMode && SERVICE_MODES.includes(serviceMode)) {
      query.serviceMode = serviceMode;
    }

    if (search?.trim()) {
      const searchRegex = new RegExp(
        search.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
        "i"
      );

      query.$or = [
        { title: searchRegex },
        { category: searchRegex },
        { description: searchRegex },
      ];
    }

    let sortOption = { createdAt: -1 };

    if (sort === "price-low") {
      sortOption = { basePrice: 1 };
    } else if (sort === "price-high") {
      sortOption = { basePrice: -1 };
    }

    const services = await db
      .collection("services")
      .find(query)
      .sort(sortOption)
      .toArray();

    res.status(200).json({
      success: true,
      total: services.length,
      services,
    });
  } catch (error) {
    console.error("Get services error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch services.",
    });
  }
};

const getServiceById = async (req, res) => {
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
      approvalStatus: "approved",
      isAvailable: true,
    });

    if (!service) {
      return res.status(404).json({
        success: false,
        message: "Service not found.",
      });
    }

    res.status(200).json({
      success: true,
      service,
    });
  } catch (error) {
    console.error("Get service details error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to fetch service details.",
    });
  }
};

const createService = async (req, res) => {
  try {
    const {
      title,
      category,
      description,
      image,
      basePrice,
      estimatedDuration,
      serviceMode,
      serviceArea,
    } = req.body;

    if (
      !title?.trim() ||
      !category ||
      !description?.trim() ||
      !image?.trim() ||
      basePrice === undefined ||
      !estimatedDuration?.trim() ||
      !serviceMode ||
      !serviceArea?.trim()
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required service information.",
      });
    }

    if (!SERVICE_CATEGORIES.includes(category)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service category.",
      });
    }

    if (!SERVICE_MODES.includes(serviceMode)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service mode.",
      });
    }

    const price = Number(basePrice);

    if (!Number.isFinite(price) || price <= 0) {
      return res.status(400).json({
        success: false,
        message: "Base price must be a valid positive number.",
      });
    }

    if (!ObjectId.isValid(req.user.id)) {
      return res.status(401).json({
        success: false,
        message: "Invalid technician account.",
      });
    }

    const db = getDB();

    const technician = await db.collection("user").findOne({
      _id: new ObjectId(req.user.id),
      email: req.user.email,
      role: "technician",
    });

    if (!technician) {
      return res.status(403).json({
        success: false,
        message: "Technician account not found.",
      });
    }

    const newService = {
      title: title.trim(),
      category,
      description: description.trim(),
      image: image.trim(),
      basePrice: price,
      estimatedDuration: estimatedDuration.trim(),
      serviceMode,
      serviceArea: serviceArea.trim(),
      technicianName: technician.name,
      technicianEmail: technician.email,
      approvalStatus: "pending",
      isAvailable: true,
      createdAt: new Date(),
    };

    const result = await db
      .collection("services")
      .insertOne(newService);

    res.status(201).json({
      success: true,
      message: "Service submitted successfully. Waiting for admin approval.",
      service: {
        _id: result.insertedId,
        ...newService,
      },
    });
  } catch (error) {
    console.error("Create service error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to create service.",
    });
  }
};

const updateService = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID.",
      });
    }

    const allowedFields = [
      "title",
      "category",
      "description",
      "image",
      "basePrice",
      "estimatedDuration",
      "serviceMode",
      "serviceArea",
    ];

    const updateData = {};

    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    }

    if (Object.keys(updateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update.",
      });
    }

    if (
      updateData.category &&
      !SERVICE_CATEGORIES.includes(updateData.category)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid service category.",
      });
    }

    if (
      updateData.serviceMode &&
      !SERVICE_MODES.includes(updateData.serviceMode)
    ) {
      return res.status(400).json({
        success: false,
        message: "Invalid service mode.",
      });
    }

    if (updateData.basePrice !== undefined) {
      updateData.basePrice = Number(updateData.basePrice);

      if (
        !Number.isFinite(updateData.basePrice) ||
        updateData.basePrice <= 0
      ) {
        return res.status(400).json({
          success: false,
          message: "Base price must be a valid positive number.",
        });
      }
    }

    for (const field of [
      "title",
      "description",
      "image",
      "estimatedDuration",
      "serviceArea",
    ]) {
      if (updateData[field] !== undefined) {
        if (
          typeof updateData[field] !== "string" ||
          !updateData[field].trim()
        ) {
          return res.status(400).json({
            success: false,
            message: `${field} cannot be empty.`,
          });
        }

        updateData[field] = updateData[field].trim();
      }
    }

    updateData.approvalStatus = "pending";
    updateData.updatedAt = new Date();

    const db = getDB();

    const result = await db.collection("services").updateOne(
      {
        _id: new ObjectId(id),
        technicianEmail: req.user.email,
      },
      {
        $set: updateData,
      }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Service not found or you do not own this service.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Service updated successfully. It is waiting for admin approval again.",
    });
  } catch (error) {
    console.error("Update service error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to update service.",
    });
  }
};

const deleteService = async (req, res) => {
  try {
    const { id } = req.params;

    if (!ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        message: "Invalid service ID.",
      });
    }

    const db = getDB();

    const result = await db.collection("services").deleteOne({
      _id: new ObjectId(id),
      technicianEmail: req.user.email,
    });

    if (result.deletedCount === 0) {
      return res.status(404).json({
        success: false,
        message: "Service not found or you do not own this service.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Service deleted successfully.",
    });
  } catch (error) {
    console.error("Delete service error:", error);

    res.status(500).json({
      success: false,
      message: "Failed to delete service.",
    });
  }
};

export {
  getServices,
  getServiceById,
  createService,
  updateService,
  deleteService,
};
