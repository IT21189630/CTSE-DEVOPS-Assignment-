const express = require("express");
const router = express.Router();
const {
  getAllAvailableOrders,
  getAllOrders,
  createOrderClaim,
  updateOrderStatusToDelivered,
} = require("../controllers/orders.controller");

// Route to get all available orders
router.get("/available", getAllAvailableOrders);

// Route to get all orders (without regarding status)
router.get("/", getAllOrders);

// Route for customers to place an order
router.post("/claim", createOrderClaim);

// Route for update order status as delivered
router.put("/:id/mark-delivered", updateOrderStatusToDelivered);

module.exports = router;
