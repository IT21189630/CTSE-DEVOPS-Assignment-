const express = require("express");
const router = express.Router();
const orderController = require("../controllers/order.controller");
const verifyUserRoles = require("../middlewares/verifyRolesMiddleware");

// Get order details by orderId - accessible by both admin and regular users
router.get("/:orderId", orderController.getOrderById);

// Update order status (Admin confirms the order) - admin only
router.put("/:orderId/status", verifyUserRoles("admin"), orderController.updateOrderStatus);

// Notify admin about order
router.post("/:orderId/notify-admin", orderController.notifyAdmin);

// Cancel order (Admin side) - admin only
router.delete("/:orderId", verifyUserRoles("admin"), orderController.cancelOrder);

module.exports = router;