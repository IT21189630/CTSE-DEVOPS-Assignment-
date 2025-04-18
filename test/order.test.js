const chai = require("chai");
const chaiHttp = require("chai-http");
const { app, serverPromise } = require("../server");
const mongoose = require("mongoose");
const Order = require("../models/order.model");
const OrderClaim = require("../models/order-claim.model");
const Product = require("../models/product.model");

const expect = chai.expect;
chai.use(chaiHttp);

let server;
let testOrder;
let testOrderId;
let testProduct;

describe("Order Management API", () => {
  before(async () => {
    server = await serverPromise;

    // Create a test product
    testProduct = new Product({
      name: "Test Product",
      description: "Test product for API testing",
      price: mongoose.Types.Decimal128.fromString("10.99"),
      category: "Testing",
      imageUrl: "https://example.com/test-product.jpg",
    });
    await testProduct.save();

    // Create a test order
    testOrder = new Order({
      userId: "test123",
      products: [
        {
          productId: testProduct._id,
          quantity: 2,
        },
      ],
      totalAmount: mongoose.Types.Decimal128.fromString("21.98"),
      status: "placed",
    });
    await testOrder.save();
    testOrderId = testOrder._id;
  });

  after(async () => {
    await mongoose.disconnect();
    await server.close();
  });

  after(async () => {
    try {
      await Order.deleteMany({});
      await OrderClaim.deleteMany({});
      await Product.deleteMany({ _id: testProduct._id });
    } catch (err) {
      console.error("Error cleaning up test data:", err);
    }

    try {
      await mongoose.connection.close();

      if (server && typeof server.close === "function") {
        await new Promise((resolve, reject) => {
          server.close((err) => {
            if (err) reject(err);
            else resolve();
          });
        });
      }
    } catch (err) {
      console.error("Error shutting down server or DB connection:", err);
    }
  });

  describe("GET /api/product-management/orders/available", () => {
    it("should get all available orders", (done) => {
      chai
        .request(app)
        .get("/api/product-management/orders/available")
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an("array");
          res.body.forEach((order) => {
            expect(order.status).to.equal("placed");
          });
          done();
        });
    });
  });

  describe("GET /api/product-management/orders", () => {
    it("should get all orders regardless of status", (done) => {
      chai
        .request(app)
        .get("/api/product-management/orders")
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.be.an("array");
          expect(res.body.length).to.be.at.least(1);
          done();
        });
    });
  });

  describe("POST /api/product-management/orders/claim", () => {
    it("should create a new order claim", (done) => {
      const orderClaim = {
        orderId: testOrderId,
        driverId: new mongoose.Types.ObjectId(),
      };

      chai
        .request(app)
        .post("/api/product-management/orders/claim")
        .send(orderClaim)
        .end((err, res) => {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property("orderId");
          expect(res.body).to.have.property("driverId");
          expect(res.body).to.have.property("fulfil_status", false);

          chai
            .request(app)
            .get(`/api/product-management/orders`)
            .end((err, res) => {
              const updatedOrder = res.body.find(
                (o) => o._id === testOrderId.toString()
              );
              expect(updatedOrder.status).to.equal("claimed");
              done();
            });
        });
    });

    it("should return 400 when missing required fields", (done) => {
      chai
        .request(app)
        .post("/api/product-management/orders/claim")
        .send({})
        .end((err, res) => {
          expect(res).to.have.status(400);
          expect(res.body.message).to.include("required");
          done();
        });
    });

    it("should return 404 when order doesn't exist", (done) => {
      const orderClaim = {
        orderId: new mongoose.Types.ObjectId(),
        driverId: new mongoose.Types.ObjectId(),
      };

      chai
        .request(app)
        .post("/api/product-management/orders/claim")
        .send(orderClaim)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body.message).to.include("not found");
          done();
        });
    });
  });

  describe("PUT /api/product-management/orders/:id/mark-delivered", () => {
    it("should update order status to delivered", (done) => {
      chai
        .request(app)
        .put(`/api/product-management/orders/${testOrderId}/mark-delivered`)
        .end((err, res) => {
          expect(res).to.have.status(200);
          expect(res.body).to.have.property("status", "delivered");
          done();
        });
    });

    it("should return 404 when order doesn't exist", (done) => {
      const nonExistentId = new mongoose.Types.ObjectId();

      chai
        .request(app)
        .put(`/api/product-management/orders/${nonExistentId}/mark-delivered`)
        .end((err, res) => {
          expect(res).to.have.status(404);
          expect(res.body.message).to.include("not found");
          done();
        });
    });
  });
});
