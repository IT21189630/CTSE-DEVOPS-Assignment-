const chai = require("chai");
const chaiHttp = require("chai-http");
const { app, serverPromise } = require("../server");
const mongoose = require("mongoose");
const Order = require("../models/order.model");
const AdminNotification = require("../models/adminNotification.model");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const expect = chai.expect;
chai.use(chaiHttp);

let server;
let testOrderId;
let adminToken;

// Sample data for testing
const testOrder = {
  userId: "user123",
  products: [
    {
      productId: new mongoose.Types.ObjectId(), // Fixed: Using 'new' with ObjectId
      quantity: 2
    }
  ],
  totalAmount: mongoose.Types.Decimal128.fromString("99.99"),
  status: "placed"
};

// Mock admin user for authentication
const adminUser = {
  id: "admin123",
  username: "admin",
  roles: 9353 // Admin role value - using 'roles' instead of 'user_role' to match verifyJWT
};

describe("Admin Order Management API", () => {
  before(async () => {
    server = await serverPromise;
    
    // Create a test order in the database
    const newOrder = new Order(testOrder);
    const savedOrder = await newOrder.save();
    testOrderId = savedOrder._id.toString();
    
    // Generate admin token for authenticated requests
    adminToken = jwt.sign(
      adminUser,
      process.env.ACCESS_SECRET_KEY || "fallback_secret_key_for_testing",
      { expiresIn: "1h" }
    );
  });

  after(async () => {
    // Clean up test data
    await Order.deleteOne({ _id: testOrderId });
    await AdminNotification.deleteMany({ orderId: testOrderId });
    
    // await mongoose.disconnect();
    // await server.close();
  });

  // Test GET order by ID
  describe("GET /api/order-processing/orders/:orderId", () => {
    it("should get order details by ID", (done) => {
      chai
        .request(app)
        .get(`/api/order-processing/orders/${testOrderId}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an("object");
          expect(res.body).to.have.property("_id", testOrderId);
          expect(res.body).to.have.property("status", "placed");
          done();
        });
    });

    it("should return 404 for non-existent order ID", (done) => {
      const nonExistentId = new mongoose.Types.ObjectId(); // Fixed: Using 'new' with ObjectId
      chai
        .request(app)
        .get(`/api/order-processing/orders/${nonExistentId}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property("message", "Order not found");
          done();
        });
    });

    it("should return 400 for invalid order ID", (done) => {
      chai
        .request(app)
        .get("/api/order-processing/orders/invalid-id")
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property("message", "Invalid order ID format");
          done();
        });
    });
  });

  // Test PUT update order status
  describe("PUT /api/order-processing/orders/:orderId/status", () => {
    it("should update order status to confirmed", (done) => {
      chai
        .request(app)
        .put(`/api/order-processing/orders/${testOrderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "confirmed" })
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an("object");
          expect(res.body).to.have.property("status", "confirmed");
          done();
        });
    });

    it("should return 400 for missing status", (done) => {
      chai
        .request(app)
        .put(`/api/order-processing/orders/${testOrderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({})
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property("message", "Status is required");
          done();
        });
    });

    it("should return 400 for invalid status", (done) => {
      chai
        .request(app)
        .put(`/api/order-processing/orders/${testOrderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .send({ status: "invalid-status" })
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property("message", "Invalid status");
          expect(res.body).to.have.property("validStatuses").that.is.an("array");
          done();
        });
    });
  });

  // Test POST notify admin
  describe("POST /api/order-processing/orders/:orderId/notify-admin", () => {
    it("should create an admin notification", (done) => {
      chai
        .request(app)
        .post(`/api/order-processing/orders/${testOrderId}/notify-admin`)
        .send({ message: "New order requires attention" })
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property("message", "Admin notification saved successfully");
          expect(res.body).to.have.property("notification").that.is.an("object");
          expect(res.body.notification).to.have.property("orderId", testOrderId);
          done();
        });
    });

    it("should return 400 for missing message", (done) => {
      chai
        .request(app)
        .post(`/api/order-processing/orders/${testOrderId}/notify-admin`)
        .send({})
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property("message", "Notification message is required");
          done();
        });
    });
  });

  // Test DELETE order
  describe("DELETE /api/order-processing/orders/:orderId", () => {
    it("should cancel an order", (done) => {
      chai
        .request(app)
        .delete(`/api/order-processing/orders/${testOrderId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property("message", "Order cancelled successfully");
          expect(res.body).to.have.property("order").that.is.an("object");
          expect(res.body.order).to.have.property("status", "cancelled");
          done();
        });
    });

    it("should return 400 for already cancelled order", (done) => {
      chai
        .request(app)
        .delete(`/api/order-processing/orders/${testOrderId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body).to.have.property("message", "Order is already cancelled");
          done();
        });
    });
  });
});