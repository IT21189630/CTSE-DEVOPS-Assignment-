const Order = require("../models/order.model");
const OrderClaim = require("../models/order-claim.model");
const asyncHandler = require("express-async-handler");

// get all available orders
const getAllAvailableOrders = asyncHandler(async (req, res) => {
  const availableOrders = await Order.find({
    status: "placed",
  });

  if (availableOrders) {
    res.status(200).json(availableOrders);
  } else {
    res.status(400).json({ message: "Failed to fetch available orders" });
  }
});

// Create a new order claim record
const createOrderClaim = asyncHandler(async (req, res) => {
  const { orderId, driverId } = req.body;

  if (!orderId || !driverId) {
    return res
      .status(400)
      .json({ message: "Order ID and Driver ID are required" });
  }

  try {
    const order = await Order.findOne({ _id: orderId, status: "placed" });

    if (!order) {
      return res
        .status(404)
        .json({ message: "Order not found or is not available" });
    }

    const newOrderClaim = await OrderClaim.create({
      orderId: orderId,
      driverId: driverId,
      fulfil_status: false,
    });
    await Order.findByIdAndUpdate(orderId, { status: "claimed" });
    res.status(201).json(newOrderClaim);
  } catch (error) {
    res
      .status(400)
      .json({ message: "Failed to claim order", error: error.message });
  }
});

// update order status to delivered
const updateOrderStatusToDelivered = asyncHandler(async (req, res) => {
  const orderId = req.params.id;

  try {
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status: "delivered" },
      { new: true }
    );

    if (updatedOrder) {
      res.status(200).json(updatedOrder);
    } else {
      res.status(404).json({ message: "Order not found" });
    }
  } catch (error) {
    res
      .status(400)
      .json({ message: "Failed to update order status", error: error.message });
  }
});

// Get all orders regardless of status
const getAllOrders = asyncHandler(async (req, res) => {
  try {
    const orders = await Order.find({});

    if (orders.length > 0) {
      res.status(200).json(orders);
    } else {
      res.status(404).json({ message: "No orders found" });
    }
  } catch (error) {
    res
      .status(400)
      .json({ message: "Failed to fetch orders", error: error.message });
  }
});

module.exports = {
  getAllAvailableOrders,
  createOrderClaim,
  updateOrderStatusToDelivered,
  getAllOrders,
};
