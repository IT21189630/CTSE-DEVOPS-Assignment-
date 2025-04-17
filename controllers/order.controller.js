const Order = require("../models/order.model");
const AdminNotification = require("../models/notification.model");

// Get order details by orderId
const getOrderById = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId)
      .populate("products.productId", "name price description");
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    res.status(200).json(order);
  } catch (error) {
    console.error("Error fetching order:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Update order status (Admin confirms the order)
const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    
    // Set status directly to 'confirmed'
    order.status = "confirmed";
    const updatedOrder = await order.save();
    
    res.status(200).json({
      message: "Order confirmed successfully",
      order: updatedOrder
    });
  } catch (error) {
    console.error("Error confirming order:", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

// Notify admin about order
const notifyAdmin = async (req, res) => {
    try {
      const { orderId } = req.params;
      
      const order = await Order.findById(orderId)
        .populate("products.productId", "name price");
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Get order details for notification
      const orderDetails = {
        orderId: order._id,
        userId: order.userId,
        orderStatus: order.status,
        totalAmount: order.totalAmount.toString(),
        orderDate: order.createdAt,
        productCount: order.products.length
      };
      
      // Create notification message
      const notificationMessage = `New order #${orderDetails.orderId} requires attention. Status: ${orderDetails.orderStatus}, Amount: $${orderDetails.totalAmount}`;
      
      // Save notification to database
      const notification = new AdminNotification({
        orderId: orderDetails.orderId,
        message: notificationMessage,
        status: "unread"
      });
      
      // Save the notification to database
      const savedNotification = await notification.save();
      
      // Log for debugging
      console.log("Admin notification saved to database:", savedNotification._id);
      
      // Return success response with notification info
      res.status(200).json({
        message: "Admin notification saved successfully",
        notification: {
          id: savedNotification._id,
          orderId: savedNotification.orderId,
          createdAt: savedNotification.createdAt,
          status: savedNotification.status
        }
      });
    } catch (error) {
      console.error("Error creating admin notification:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };

// Cancel order (Admin side) - delete order
const cancelOrder = async (req, res) => {
    try {
      const { orderId } = req.params;
      
      const order = await Order.findById(orderId);
      
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      // Delete the order from database
      await Order.findByIdAndDelete(orderId);
      
      // Log the deletion
      console.log(`Order ${orderId} has been deleted by admin`);
      
      res.status(200).json({
        message: "Order deleted successfully",
        orderId
      });
    } catch (error) {
      console.error("Error deleting order:", error.message);
      res.status(500).json({ message: "Server error", error: error.message });
    }
  };

module.exports = {
  getOrderById,
  updateOrderStatus,
  notifyAdmin,
  cancelOrder
};