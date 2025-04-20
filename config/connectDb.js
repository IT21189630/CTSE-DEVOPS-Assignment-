const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    // Debug: Check if env vars are loading
    console.log("Environment:", {
      NODE_ENV: process.env.NODE_ENV,
      MONGO_DB_URI: process.env.MONGO_DB_URI ? "***exists***" : "MISSING",
    });

    if (!process.env.MONGO_DB_URI) {
      throw new Error(
        "❌ MONGO_DB_URI is not defined in environment variables!"
      );
    }

    await mongoose.connect(process.env.MONGO_DB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("✅ MongoDB Connected");
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
