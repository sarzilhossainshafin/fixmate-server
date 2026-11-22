import "dotenv/config";
import { connectDB, getDB } from "./src/config/db.js";

await connectDB();

const db = getDB();

const user = await db.collection("user").findOne(
  { email: "test.technician002@example.com" },
  {
    projection: {
      _id: 1,
      id: 1,
      email: 1,
      name: 1,
      role: 1,
    },
  }
);

console.log("USER:", user);

if (user) {
  const ids = [user.id, String(user._id), user._id].filter(Boolean);

  const accounts = await db.collection("account").find(
    { userId: { $in: ids } },
    {
      projection: {
        _id: 1,
        userId: 1,
        accountId: 1,
        providerId: 1,
      },
    }
  ).toArray();

  console.log("ACCOUNT RECORDS:", accounts);
}

console.log(
  "COLLECTIONS:",
  (await db.listCollections().toArray()).map((c) => c.name)
);

process.exit(0);
