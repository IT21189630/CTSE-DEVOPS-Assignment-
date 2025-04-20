const express = require("express");
const router = express.Router();
const adminController = require("../controllers/adminOrder.controller");
const verifyUserRoles = require("../middlewares/verifyRolesMiddleware");
const verifyJWT = require("../middlewares/verifyJWTMiddleware");
const user_roles_list = require("../config/userRoles");

// Admin role verification middleware
const verifyAdmin = verifyUserRoles(user_roles_list.Admin);

// For admin routes that require authentication, apply verifyJWT middleware to each route individually
// instead of globally in server.js

// Admin confirms the order
router.put(
  "/:orderId/status",
  verifyJWT,
  verifyAdmin,
  adminController.updateOrderStatus
);

// POST /orders/{orderId}/notify-admin - Handles notification logic (no auth required)
router.post("/:orderId/notify-admin", adminController.notifyAdmin);

// DELETE /orders/{orderId} - Cancel order (Admin side)
router.delete("/:orderId", verifyJWT, verifyAdmin, adminController.cancelOrder);

// GET /orders/{orderId} - Get order details by orderId (no auth required)
router.get("/:orderId", adminController.getOrderById);

module.exports = router;
