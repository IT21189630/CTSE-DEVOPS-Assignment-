const mongoose = require("mongoose");

const NotificationSchema = mongoose.Schema(
  {
    orderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Order",
      required: true
    },
    message: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ["unread", "read"],
      default: "unread"
    }
  },
  {
    timestamps: true // Automatically adds createdAt and updatedAt fields
  }
);

module.exports = mongoose.model("AdminNotification", NotificationSchema, "adminNotification");