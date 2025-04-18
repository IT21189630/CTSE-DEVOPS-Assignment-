const chai = require("chai");
const chaiHttp = require("chai-http");
const { app, serverPromise } = require("../server");
const mongoose = require("mongoose");
const Order = require("../models/order.model");
const AdminNotification = require("../models/adminNotification.model");
const Product = require("../models/product.model");
const jwt = require("jsonwebtoken");
let OrderClaim;
try {
  OrderClaim = require("../models/order-claim.model");
} catch (error) {
  console.log("order-claim.model.js not found, some tests may fail");
}
require("dotenv").config();

const expect = chai.expect;
chai.use(chaiHttp);

let server;
let adminTestOrderId;
let memberTestOrderId;
let adminToken;
let testProduct;

// Sample data for admin tests
const adminTestOrder = {
  userId: "admin_user123",
  products: [
    {
      productId: new mongoose.Types.ObjectId(),
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
  roles: 9353 // Admin role value
};

describe("API Tests", function() {
  // Set timeout for all tests
  this.timeout(10000);

  before(async () => {
    console.log("Starting tests and connecting to database...");
    server = await serverPromise;
    
    // Create a test product for all tests
    testProduct = new Product({
      name: "Test Product for All Tests",
      description: "Test product for API testing",
      price: mongoose.Types.Decimal128.fromString("10.99"),
      category: "Testing",
      imageUrl: "https://example.com/test-product.jpg",
    });
    await testProduct.save();
    console.log(`Test product created with ID: ${testProduct._id}`);

    // Create a test order for admin tests
    const adminOrder = new Order(adminTestOrder);
    const savedAdminOrder = await adminOrder.save();
    adminTestOrderId = savedAdminOrder._id.toString();
    console.log(`Admin test order created with ID: ${adminTestOrderId}`);
    
    // Create a test order for member tests
    const memberOrder = new Order({
      userId: "member_test123",
      products: [
        {
          productId: testProduct._id,
          quantity: 3,
        },
      ],
      totalAmount: mongoose.Types.Decimal128.fromString("32.97"),
      status: "placed",
    });
    await memberOrder.save();
    memberTestOrderId = memberOrder._id.toString();
    console.log(`Member test order created with ID: ${memberTestOrderId}`);
    
    // Generate admin token for authenticated requests
    adminToken = jwt.sign(
      adminUser,
      process.env.ACCESS_SECRET_KEY || "fallback_secret_key_for_testing",
      { expiresIn: "1h" }
    );
    console.log("Admin token generated for auth tests");
  });

  after(async () => {
    // Clean up test data
    console.log("Cleaning up test data...");
    try {
      await Order.deleteMany({});
      console.log("Orders deleted");
      
      await AdminNotification.deleteMany({});
      console.log("Admin notifications deleted");
      
      await Product.deleteMany({});
      console.log("Products deleted");
      
      if (OrderClaim) {
        await OrderClaim.deleteMany({});
        console.log("Order claims deleted");
      }
    } catch (err) {
      console.error("Error cleaning up test data:", err);
    }

    // Close connections
    console.log("Closing database connection and server...");
    try {
      await mongoose.connection.close();
      await server.close();
      console.log("Test environment shutdown completed");
    } catch (err) {
      console.error("Error shutting down server or DB connection:", err);
    }
  });

  // ==================== User Tests ====================
  describe("User Management", () => {
    describe("User Registration API", () => {
      it("should register a new user", (done) => {
        const user = {
          email: `user_${Date.now()}@test.com`,
          username: "testuser",
          password: "secure123",
        };

        chai
          .request(app)
          .post("/api/user-management/auth/register/user")
          .send(user)
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body).to.have.property("email", user.email);
            expect(res.body).to.have.property("username", user.username);
            done();
          });
      });

      it("should return 400 when missing required fields", (done) => {
        const user = { email: "", username: "", password: "" };

        chai
          .request(app)
          .post("/api/user-management/auth/register/user")
          .send(user)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body.message).to.include("please provide");
            done();
          });
      });
    });
  });

  // ==================== Product Tests ====================
  describe("Product Management", () => {
    it("should add a new product", (done) => {
      const product = {
        name: "Test Product",
        description: "This is a test product",
        price: 19.99,
        category: "Test Category",
        imageUrl: "https://example.com/test-product.jpg",
      };

      chai
        .request(app)
        .post("/api/product-management/product/products")
        .send(product)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property("message", "Product added successfully");
          expect(res.body.product).to.have.property("name", product.name);
          done();
        });
    });

    it("should place an order", (done) => {
      const order = {
        userId: "testUser123",
        products: [
          {
            productId: testProduct._id.toString(), // Using the test product ID
            quantity: 2,
          },
        ],
        totalAmount: 39.98,
      };

      chai
        .request(app)
        .post("/api/product-management/product/orders")
        .send(order)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property("message", "Order placed successfully");
          expect(res.body.order).to.have.property("userId", order.userId);
          done();
        });
    });
    
    it("should mark an order as received", (done) => {
      // Create a new order to mark as received
      const newOrder = new Order({
        userId: "mark_received_test_user",
        products: [
          {
            productId: testProduct._id,
            quantity: 1,
          },
        ],
        totalAmount: mongoose.Types.Decimal128.fromString("10.99"),
        status: "placed",
      });
      
      newOrder.save().then(savedOrder => {
        chai
          .request(app)
          .post(`/api/product-management/product/orders/${savedOrder._id}/mark-received`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.have.property("message", "Order marked as received");
            expect(res.body.order).to.have.property("status", "received");
            done();
          });
      }).catch(err => done(err));
    });
    
    it("should fetch all orders for a specific user", (done) => {
      const userId = "testUser123"; // Using the user ID from the order we created earlier
      
      chai
        .request(app)
        .get(`/api/product-management/product/orders/user/${userId}`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property("message", "Orders fetched successfully");
          expect(res.body.orders).to.be.an("array");
          done();
        });
    });
  });

  // ==================== Admin Order Tests ====================
  describe("Admin Order Management", () => {
    // Test GET order by ID
    describe("GET /api/order-processing/orders/:orderId", () => {
      it("should get order details by ID", (done) => {
        chai
          .request(app)
          .get(`/api/order-processing/orders/${adminTestOrderId}`)
          .end((err, res) => {
            expect(res).to.have.status(200);
            expect(res.body).to.be.an("object");
            expect(res.body).to.have.property("_id", adminTestOrderId);
            expect(res.body).to.have.property("status", "placed");
            done();
          });
      });

      it("should return 404 for non-existent order ID", (done) => {
        const nonExistentId = new mongoose.Types.ObjectId();
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
          .put(`/api/order-processing/orders/${adminTestOrderId}/status`)
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
          .put(`/api/order-processing/orders/${adminTestOrderId}/status`)
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
          .put(`/api/order-processing/orders/${adminTestOrderId}/status`)
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
          .post(`/api/order-processing/orders/${adminTestOrderId}/notify-admin`)
          .send({ message: "New order requires attention" })
          .end((err, res) => {
            expect(res).to.have.status(201);
            expect(res.body).to.have.property("message", "Admin notification saved successfully");
            expect(res.body).to.have.property("notification").that.is.an("object");
            expect(res.body.notification).to.have.property("orderId", adminTestOrderId);
            done();
          });
      });

      it("should return 400 for missing message", (done) => {
        chai
          .request(app)
          .post(`/api/order-processing/orders/${adminTestOrderId}/notify-admin`)
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
          .delete(`/api/order-processing/orders/${adminTestOrderId}`)
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
          .delete(`/api/order-processing/orders/${adminTestOrderId}`)
          .set("Authorization", `Bearer ${adminToken}`)
          .end((err, res) => {
            expect(res).to.have.status(400);
            expect(res.body).to.have.property("message", "Order is already cancelled");
            done();
          });
      });
    });
  });

  // ==================== Order Management Tests ====================
  describe("Order Processing", () => {
    let claimedOrderId;
    let driverId;

    before(async () => {
      // Create a new order for claiming
      const claimTestOrder = new Order({
        userId: "claim_test_user",
        products: [
          {
            productId: testProduct._id,
            quantity: 1,
          },
        ],
        totalAmount: mongoose.Types.Decimal128.fromString("10.99"),
        status: "placed",
      });
      const savedOrder = await claimTestOrder.save();
      claimedOrderId = savedOrder._id;
      driverId = new mongoose.Types.ObjectId();
      console.log(`Created new order for claim tests: ${claimedOrderId}`);
    });

    describe("GET /api/product-management/orders/available", () => {
      it("should get all available orders", (done) => {
        chai
          .request(app)
          .get("/api/product-management/orders/available")
          .end((err, res) => {
            if (err) return done(err);
            try {
              expect(res).to.have.status(200);
              expect(res.body).to.be.an("array");
              res.body.forEach((order) => {
                expect(order.status).to.equal("placed");
              });
              done();
            } catch (error) {
              done(error);
            }
          });
      });
    });

    describe("GET /api/product-management/orders", () => {
      it("should get all orders regardless of status", (done) => {
        chai
          .request(app)
          .get("/api/product-management/orders")
          .end((err, res) => {
            if (err) return done(err);
            try {
              expect(res).to.have.status(200);
              expect(res.body).to.be.an("array");
              expect(res.body.length).to.be.at.least(1);
              done();
            } catch (error) {
              done(error);
            }
          });
      });
    });

    describe("POST /api/product-management/orders/claim", () => {
      it("should create a new order claim", function(done) {
        // Skip this test if OrderClaim is not defined
        if (!OrderClaim) {
          this.skip();
          return done();
        }

        const orderClaim = {
          orderId: claimedOrderId,
          driverId: driverId,
        };

        chai
          .request(app)
          .post("/api/product-management/orders/claim")
          .send(orderClaim)
          .end((err, res) => {
            if (err) return done(err);
            try {
              expect(res).to.have.status(201);
              expect(res.body).to.have.property("orderId");
              expect(res.body).to.have.property("driverId");
              expect(res.body).to.have.property("fulfil_status", false);

              chai
                .request(app)
                .get(`/api/product-management/orders`)
                .end((err, res) => {
                  if (err) return done(err);
                  try {
                    const updatedOrder = res.body.find(
                      (o) => o._id === claimedOrderId.toString()
                    );
                    expect(updatedOrder.status).to.equal("claimed");
                    done();
                  } catch (error) {
                    done(error);
                  }
                });
            } catch (error) {
              done(error);
            }
          });
      });

      it("should return 400 when missing required fields", function(done) {
        // Skip this test if OrderClaim is not defined
        if (!OrderClaim) {
          this.skip();
          return done();
        }

        chai
          .request(app)
          .post("/api/product-management/orders/claim")
          .send({})
          .end((err, res) => {
            if (err) return done(err);
            try {
              expect(res).to.have.status(400);
              expect(res.body.message).to.include("required");
              done();
            } catch (error) {
              done(error);
            }
          });
      });

      it("should return 404 when order doesn't exist", function(done) {
        // Skip this test if OrderClaim is not defined
        if (!OrderClaim) {
          this.skip();
          return done();
        }

        const orderClaim = {
          orderId: new mongoose.Types.ObjectId(),
          driverId: new mongoose.Types.ObjectId(),
        };

        chai
          .request(app)
          .post("/api/product-management/orders/claim")
          .send(orderClaim)
          .end((err, res) => {
            if (err) return done(err);
            try {
              expect(res).to.have.status(404);
              expect(res.body.message).to.include("not found");
              done();
            } catch (error) {
              done(error);
            }
          });
      });
    });

    describe("PUT /api/product-management/orders/:id/mark-delivered", () => {
      it("should update order status to delivered", function(done) {
        chai
          .request(app)
          .put(`/api/product-management/orders/${memberTestOrderId}/mark-delivered`)
          .end((err, res) => {
            if (err) return done(err);
            try {
              expect(res).to.have.status(200);
              expect(res.body).to.have.property("status", "delivered");
              done();
            } catch (error) {
              done(error);
            }
          });
      });

      it("should return 404 when order doesn't exist", (done) => {
        const nonExistentId = new mongoose.Types.ObjectId();

        chai
          .request(app)
          .put(`/api/product-management/orders/${nonExistentId}/mark-delivered`)
          .end((err, res) => {
            if (err) return done(err);
            try {
              expect(res).to.have.status(404);
              expect(res.body.message).to.include("not found");
              done();
            } catch (error) {
              done(error);
            }
          });
      });
    });

    // describe("POST /api/product-management/product/orders/:orderId/mark-received", () => {
    //   it("should mark an order as received", function(done) {
    //     // This test is now handled in the Product Management section
    //     this.skip();
    //     done();
    //   });
    // });

    // describe("GET /api/product-management/product/orders/user/:userId", () => {
    //   it("should fetch all orders for a specific user", (done) => {
    //     // This test is now handled in the Product Management section
    //     this.skip();
    //     done();
    //   });
    // });
  });
});