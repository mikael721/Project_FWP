const mongoose = require("mongoose");
require("dotenv").config();

const connectMongoDB = async () => {
  try {
    const mongoURI =
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/warungbulis";

    await mongoose.connect(mongoURI);

    console.log("MongoDB connected successfully!");
    return mongoose.connection;
  } catch (error) {
    console.error("MongoDB connection error:", error);
    process.exit(1);
  }
};

const disconnectMongoDB = async () => {
  try {
    await mongoose.disconnect();
    console.log("MongoDB disconnected successfully!");
  } catch (error) {
    console.error("MongoDB disconnection error:", error);
  }
};

module.exports = { connectMongoDB, disconnectMongoDB };
