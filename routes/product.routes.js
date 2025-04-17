const express = require("express");
const router = express.Router();
const {
  addProduct,
  placeOrder,
  markOrderReceived,
  getUserOrders,
} = require("../controllers/product.controller");

// Route to add a new product
router.post("/products", addProduct);

// Route for customers to place an order
router.post("/orders", placeOrder);

// Route for customers to confirm receipt of an order
router.post("/orders/:orderId/mark-received", markOrderReceived);

// Route to get all orders placed by a specific user
router.get("/orders/user/:userId", getUserOrders);

module.exports = router;