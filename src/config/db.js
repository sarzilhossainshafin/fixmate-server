
import dns from "node:dns";
import { MongoClient } from "mongodb";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

let client;
let db;

const connectDB = async () => {
  try {
    if (db) return db;

    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();

    db = client.db(process.env.DB_NAME);

    console.log("MongoDB connected successfully!");

    return db;
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
};

const getDB = () => {
  if (!db) {
    throw new Error("Database is not connected!");
  }

  return db;
};

export { connectDB, getDB };
