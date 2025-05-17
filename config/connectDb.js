const mongoose = require("mongoose");

const connectDB = async () => {
  const uri =
    "mongodb+srv://maleeshaweerasinghe27233:CSTE_2025@csteassignment.qzo29xs.mongodb.net/?retryWrites=true&w=majority&appName=CSTEassignment";
  if (!uri)
    throw new Error("❌ MONGO_DB_URI is not defined in environment variables!");

  try {
    const conObj = await mongoose.connect(uri);
    console.log(`✅ Connected to the host: ${conObj.connection.host}`);
  } catch (error) {
    console.error("❌ MongoDB Connection Error:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
