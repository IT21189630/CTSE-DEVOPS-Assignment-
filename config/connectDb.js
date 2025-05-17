const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_DB_URI;
  if (!uri)
    throw new Error("❌ MONGO_DB_URI is not defined in environment variables!");

  try {
    const conObj = await mongoose.connect(uri);
    console.log(`✅ Connected to the host: ${conObj.connection.host}`);
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:", error);
    throw error;
  }
};

module.exports = connectDB;
