
const dns = require("dns");

// Use public DNS resolvers for MongoDB SRV lookup
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const { MongoClient } = require("mongodb");

let db;

const connectDB = async () => {
  try {
    const client = new MongoClient(process.env.MONGODB_URI);

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

module.exports = { connectDB, getDB };
