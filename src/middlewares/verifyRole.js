
const verifyRole = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized. Please login first.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden. You do not have permission.",
      });
    }

    next();
  };
};

const verifyCustomer = verifyRole("customer");
const verifyTechnician = verifyRole("technician");
const verifyAdmin = verifyRole("admin");

export {
  verifyRole,
  verifyCustomer,
  verifyTechnician,
  verifyAdmin,
};
