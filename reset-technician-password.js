import "dotenv/config";
import { connectDB, getDB } from "./src/config/db.js";
import { hashPassword } from "@better-auth/utils/password";

const email = "test.technician002@example.com";

try {
  const password = process.env.FIXMATE_RESET_PASSWORD;

  if (!password || password.length < 8) {
    throw new Error("Invalid password or password too short.");
  }

  await connectDB();

  const db = getDB();

  const user = await db.collection("user").findOne({
    email,
    role: "technician",
  });

  if (!user) throw new Error("Technician account not found.");

  const account = await db.collection("account").findOne({
    userId: user._id,
    providerId: "credential",
  });

  if (!account) throw new Error("Credential account not found.");

  const passwordHash = await hashPassword(password);

  const result = await db.collection("account").updateOne(
    {
      _id: account._id,
      userId: user._id,
      providerId: "credential",
    },
    {
      $set: { password: passwordHash },
    }
  );

  if (result.modifiedCount !== 1) {
    throw new Error("Password update was not confirmed.");
  }

  console.log("Password reset successful!");
  console.log("Account:", email);
} catch (error) {
  console.error("Password reset failed:", error.message);
}
