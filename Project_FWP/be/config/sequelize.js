const mongoose = require("mongoose");
require("dotenv").config();

const connectMongoDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URL; // Fallback URL

    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

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
