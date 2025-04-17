const chai = require("chai");
const chaiHttp = require("chai-http");
const { app, serverPromise } = require("../server");
const mongoose = require("mongoose");
const Order = require("../models/order.model");
const AdminNotification = require("../models/notification.model");
const jwt = require("jsonwebtoken");

const expect = chai.expect;
chai.use(chaiHttp);

let server;
let testOrder;
let adminToken;
let userToken;
let testOrderId;

describe("Order Processing API", () => {
  before(async () => {
    server = await serverPromise;
    
    // Create mock admin token
    adminToken = jwt.sign(
      { userId: "adminUserId", user_role: "admin" },
      process.env.JWT_SECRET || "test_secret",
      { expiresIn: "1h" }
    );
    
    // Create mock user token
    userToken = jwt.sign(
      { userId: "regularUserId", user_role: "user" },
      process.env.JWT_SECRET || "test_secret",
      { expiresIn: "1h" }
    );
    
    // Create a test order in the database
    testOrder = new Order({
      userId: "regularUserId", 
      products: [
        {
          productId: mongoose.Types.ObjectId(),
          quantity: 2
        }
      ],
      totalAmount: mongoose.Types.Decimal128.fromString("99.99"),
      status: "placed"
    });
    
    await testOrder.save();
    testOrderId = testOrder._id;
  });

  after(async () => {
    // Clean up test data
    await Order.deleteMany({});
    await AdminNotification.deleteMany({});
    await mongoose.disconnect();
    await server.close();
  });

  describe("GET /api/order-processing/orders/:orderId", () => {
    it("should get order details by orderId", (done) => {
      chai
        .request(app)
        .get(`/api/order-processing/orders/${testOrderId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property("_id");
          expect(res.body).to.have.property("userId", "regularUserId");
          expect(res.body).to.have.property("status", "placed");
          expect(res.body).to.have.property("products").that.is.an("array");
          done();
        });
    });

    it("should return 404 when order not found", (done) => {
      const nonExistentId = mongoose.Types.ObjectId();
      chai
        .request(app)
        .get(`/api/order-processing/orders/${nonExistentId}`)
        .set("Authorization", `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property("message", "Order not found");
          done();
        });
    });

    it("should return 500 for invalid orderId format", (done) => {
      chai
        .request(app)
        .get(`/api/order-processing/orders/invalid-id`)
        .set("Authorization", `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(500);
          expect(res.body).to.have.property("message", "Server error");
          done();
        });
    });
  });

  describe("PUT /api/order-processing/orders/:orderId/status", () => {
    it("should set order status to confirmed when admin", (done) => {
      chai
        .request(app)
        .put(`/api/order-processing/orders/${testOrderId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property("message", "Order confirmed successfully");
          expect(res.body.order).to.have.property("status", "confirmed");
          done();
        });
    });

    it("should return 401 when non-admin tries to confirm order", (done) => {
      chai
        .request(app)
        .put(`/api/order-processing/orders/${testOrderId}/status`)
        .set("Authorization", `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(401);
          done();
        });
    });

    it("should return 404 when order not found", (done) => {
      const nonExistentId = mongoose.Types.ObjectId();
      chai
        .request(app)
        .put(`/api/order-processing/orders/${nonExistentId}/status`)
        .set("Authorization", `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property("message", "Order not found");
          done();
        });
    });
  });

  describe("POST /api/order-processing/orders/:orderId/notify-admin", () => {
    it("should save admin notification to database", (done) => {
      chai
        .request(app)
        .post(`/api/order-processing/orders/${testOrderId}/notify-admin`)
        .set("Authorization", `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property("message", "Admin notification saved successfully");
          expect(res.body).to.have.property("notification");
          expect(res.body.notification).to.have.property("id");
          expect(res.body.notification).to.have.property("orderId");
          expect(res.body.notification).to.have.property("status", "unread");
          
          // Verify notification was saved to database
          AdminNotification.findById(res.body.notification.id).then(notification => {
            expect(notification).to.not.be.null;
            expect(notification.orderId.toString()).to.equal(testOrderId.toString());
            expect(notification.status).to.equal("unread");
            expect(notification).to.have.property("message").that.includes(testOrderId.toString());
            done();
          }).catch(err => done(err));
        });
    });

    it("should return 404 when order not found", (done) => {
      const nonExistentId = mongoose.Types.ObjectId();
      chai
        .request(app)
        .post(`/api/order-processing/orders/${nonExistentId}/notify-admin`)
        .set("Authorization", `Bearer ${userToken}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property("message", "Order not found");
          done();
        });
    });
  });

  describe("DELETE /api/order-processing/orders/:orderId", () => {
    it("should delete order when admin", (done) => {
      chai
        .request(app)
        .delete(`/api/order-processing/orders/${testOrderId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property("message", "Order deleted successfully");
          expect(res.body).to.have.property("orderId");
          
          // Verify the order no longer exists in the database
          Order.findById(testOrderId).then(order => {
            expect(order).to.be.null;
            done();
          }).catch(err => done(err));
        });
    });

    it("should return 401 when non-admin tries to delete order", (done) => {
      // Create another test order for this test
      const anotherOrder = new Order({
        userId: "regularUserId",
        products: [{ productId: mongoose.Types.ObjectId(), quantity: 1 }],
        totalAmount: mongoose.Types.Decimal128.fromString("49.99"),
        status: "placed"
      });
      
      anotherOrder.save().then((order) => {
        chai
          .request(app)
          .delete(`/api/order-processing/orders/${order._id}`)
          .set("Authorization", `Bearer ${userToken}`)
          .end((err, res) => {
            expect(res).to.have.status(401);
            done();
          });
      });
    });

    it("should return 404 when order not found", (done) => {
      const nonExistentId = mongoose.Types.ObjectId();
      chai
        .request(app)
        .delete(`/api/order-processing/orders/${nonExistentId}`)
        .set("Authorization", `Bearer ${adminToken}`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body).to.have.property("message", "Order not found");
          done();
        });
    });
  });
});