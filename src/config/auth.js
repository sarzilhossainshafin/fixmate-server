
import { betterAuth } from "better-auth";
import { mongodbAdapter } from "@better-auth/mongo-adapter";
import { APIError } from "better-auth/api";
import { jwt } from "better-auth/plugins";
import { getDB } from "./db.js";

const createAuth = () => {
  console.log("Google OAuth environment check:", {
    clientIdLoaded: Boolean(process.env.GOOGLE_CLIENT_ID),
    clientSecretLoaded: Boolean(process.env.GOOGLE_CLIENT_SECRET),
    baseURLLoaded: Boolean(process.env.BETTER_AUTH_URL),
  });

  return betterAuth({
    database: mongodbAdapter(getDB()),

    baseURL: process.env.BETTER_AUTH_URL,
    secret: process.env.BETTER_AUTH_SECRET,

    emailAndPassword: {
      enabled: true,
      minPasswordLength: 6,
    },

    // Google Login
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      },
    },

    user: {
      additionalFields: {
        role: {
          type: ["customer", "technician", "admin"],
          required: false,
          defaultValue: "customer",
          input: true,
        },
        phone: {
          type: "string",
          required: false,
        },
        area: {
          type: "string",
          required: false,
        },
        bio: {
          type: "string",
          required: false,
        },
      },
    },

    databaseHooks: {
      user: {
        create: {
          before: async (user, context) => {
            const requestedRole = context.body?.role;

            if (
              requestedRole &&
              !["customer", "technician"].includes(requestedRole)
            ) {
              throw new APIError("FORBIDDEN", {
                message: "You cannot register with this role.",
              });
            }

            return {
              data: {
                ...user,
                role: requestedRole || "customer",
              },
            };
          },
        },
      },
    },

    plugins: [
      jwt({
        jwt: {
          definePayload: ({ user }) => ({
            id: user.id,
            email: user.email,
            role: user.role,
          }),
          expirationTime: "15m",
        },
      }),
    ],

    trustedOrigins: [
      process.env.CLIENT_URL || "http://localhost:3000",
    ],
  });
};

export { createAuth };
