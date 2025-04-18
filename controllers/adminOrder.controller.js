const Order = require("../models/order.model");
const mongoose = require("mongoose");

// Use the AdminNotification model from separate file
const AdminNotification = require("../models/adminNotification.model");

// Update order status (Admin confirms order)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // Validate input
    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    // Validate orderId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }

    // Valid statuses for orders
    const validStatuses = ["placed", "confirmed", "processing", "shipped", "delivered", "cancelled"];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        message: "Invalid status",
        validStatuses
      });
    }

    // Find and update the order
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      { status },
      { new: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json(updatedOrder);
  } catch (error) {
    console.error("Error updating order status:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Notify admin about an order
const notifyAdmin = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { message } = req.body;

    // Validate input
    if (!message) {
      return res.status(400).json({ message: "Notification message is required" });
    }

    // Validate orderId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }

    // Check if order exists
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Create notification
    const notification = new AdminNotification({
      orderId,
      message
    });

    await notification.save();

    return res.status(201).json({
      message: "Admin notification saved successfully",
      notification
    });
  } catch (error) {
    console.error("Error notifying admin:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Cancel order (Admin side)
const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate orderId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }

    // Find the order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // Check if order is already cancelled
    if (order.status === "cancelled") {
      return res.status(400).json({ message: "Order is already cancelled" });
    }

    // Update status to cancelled
    order.status = "cancelled";
    await order.save();

    // Create a notification that order was cancelled
    const notification = new AdminNotification({
      orderId,
      message: `Order ${orderId} has been cancelled`
    });
    
    await notification.save();

    return res.status(200).json({ 
      message: "Order cancelled successfully",
      order
    });
  } catch (error) {
    console.error("Error cancelling order:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

// Get order details by orderId
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;

    // Validate orderId is a valid ObjectId
    if (!mongoose.Types.ObjectId.isValid(orderId)) {
      return res.status(400).json({ message: "Invalid order ID format" });
    }

    // Find the order and populate product details
    const order = await Order.findById(orderId).populate("products.productId");
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    return res.status(200).json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return res.status(500).json({ message: "Internal server error", error: error.message });
  }
};

module.exports = {
  updateOrderStatus,
  notifyAdmin,
  cancelOrder,
  getOrderById,
  AdminNotification // Export the model for testing
};