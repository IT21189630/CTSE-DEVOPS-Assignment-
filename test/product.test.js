const chai = require("chai");
const chaiHttp = require("chai-http");
const { app, serverPromise } = require("../server");
const mongoose = require("mongoose");

const expect = chai.expect;
chai.use(chaiHttp);

let server;

describe("Product and Order API", () => {
  before(async () => {
    server = await serverPromise;
  });


  // Test for adding a product
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

  // Test for placing an order
  it("should place an order", (done) => {
    const order = {
      userId: "testUser123",
      products: [
        {
          productId: "68020f977348ab2429443f83", // Replace with a valid Product ID
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

  // Test for marking an order as received
  it("should mark an order as received", (done) => {
    const orderId = "6802300de2ef8d8047f57c0d"; // Replace with a valid Order ID

    chai
      .request(app)
      .post(`/api/product-management/product/orders/${orderId}/mark-received`)
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body).to.have.property("message", "Order marked as received");
        expect(res.body.order).to.have.property("status", "received");
        done();
      });
  });

  // Test for fetching all orders by a specific user
  it("should fetch all orders for a specific user", (done) => {
    const userId = "testUser123"; // Replace with a valid User ID

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