const Product = require("../models/product.model");
const Order = require("../models/order.model");
const asyncHandler = require("express-async-handler");

// Add Product
const addProduct = asyncHandler(async (req, res) => {
  const { name, description, price, category, imageUrl } = req.body;

  const product = await Product.create({
    name,
    description,
    price,
    category,
    imageUrl,
  });

  if (product) {
    res.status(201).json({ message: "Product added successfully", product });
  } else {
    res.status(400).json({ message: "Failed to add product" });
  }
});

// Customer places an order
const placeOrder = asyncHandler(async (req, res) => {
  const { userId, products, totalAmount } = req.body;

  // Validate products
  for (const item of products) {
    const product = await Product.findById(item.productId);
    if (!product) {
      return res.status(404).json({ message: `Product with ID ${item.productId} not found` });
    }
  }

  // Create the order
  const order = await Order.create({
    userId,
    products,
    totalAmount,
  });

  if (order) {
    res.status(201).json({ message: "Order placed successfully", order });
  } else {
    res.status(400).json({ message: "Failed to place order" });
  }
});

// Customer confirms receipt of order
const markOrderReceived = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  const order = await Order.findById(orderId);
  if (!order) {
    return res.status(404).json({ message: "Order not found" });
  }

  order.status = "received";
  order.updatedAt = new Date();
  await order.save();

  res.status(200).json({ message: "Order marked as received", order });
});

// Get all orders placed by a specific user
const getUserOrders = asyncHandler(async (req, res) => {
  const { userId } = req.params;

  const orders = await Order.find({ userId }).populate("products.productId");

  if (orders.length > 0) {
    res.status(200).json({ message: "Orders fetched successfully", orders });
  } else {
    res.status(404).json({ message: "No orders found for this user" });
  }
});

module.exports = {
  addProduct,
  placeOrder,
  markOrderReceived,
  getUserOrders,
};