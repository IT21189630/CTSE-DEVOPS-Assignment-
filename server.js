require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const errorHandler = require("./middlewares/errorMiddleware");
const connectDB = require("./config/connectDb");
const verifyJWT = require("./middlewares/verifyJWTMiddleware");

connectDB();
const app = express();
const PORT = process.env.PORT || 4000;

app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/api/order-processing", (req, res) => {
  res.send("order processing service responded");
});

// to handle user auth related requests
app.use("/api/user-management/auth", require("./routes/auth-login.routes"));
app.use("/api/user-management/auth", require("./routes/auth-register.routes"));

// member 2 routes
app.use("/api/product-management/product", require("./routes/product.routes"));

// member 3 routes

// member 4 routes

app.use(verifyJWT);
app.use(errorHandler);

let serverPromise = new Promise((resolve, reject) => {
  mongoose.connection.once("open", () => {
    console.log(`🚀 data connection with users collection established! 🚀`);
    const server = app.listen(PORT, () => {
      console.log(
        `🛵 Order processing service is up and running on port: ${PORT} 🛵`
      );
      resolve(server);
    });
  });
});

module.exports = { app, serverPromise };
