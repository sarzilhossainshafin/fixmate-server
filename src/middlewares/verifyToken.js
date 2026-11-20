
import { createRemoteJWKSet, jwtVerify } from "jose";

let JWKS;

const getJWKS = () => {
  if (!JWKS) {
    const authURL = process.env.BETTER_AUTH_URL;

    if (!authURL) {
      throw new Error("BETTER_AUTH_URL is not configured.");
    }

    JWKS = createRemoteJWKSet(
      new URL(`${authURL}/api/auth/jwks`)
    );
  }

  return JWKS;
};

const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access. Token is required.",
      });
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access. Invalid token.",
      });
    }

    const { payload } = await jwtVerify(token, getJWKS(), {
      issuer: process.env.BETTER_AUTH_URL,
      audience: process.env.BETTER_AUTH_URL,
    });

    const allowedRoles = ["customer", "technician", "admin"];

    if (
      !payload.id ||
      !payload.email ||
      !allowedRoles.includes(payload.role)
    ) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access. Invalid user information.",
      });
    }

    req.user = {
      id: payload.id,
      email: payload.email,
      role: payload.role,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Unauthorized access. Invalid or expired token.",
    });
  }
};

export { verifyToken };
