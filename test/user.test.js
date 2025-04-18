const chai = require("chai");
const chaiHttp = require("chai-http");
const { app, serverPromise } = require("../server");
const mongoose = require("mongoose");

const expect = chai.expect;
chai.use(chaiHttp);

let server;

describe("User Registration API", () => {
  before(async () => {
    server = await serverPromise;
  });

  after(async () => {
    await mongoose.disconnect();
    await server.close();
  });

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
        if (err) {
          done(err);
          return;
        }

        try {
          expect(res).to.have.status(201);
          expect(res.body).to.have.property("email", user.email);
          expect(res.body).to.have.property("username", user.username);
          done();
        } catch (error) {
          done(error);
        }
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
