const express = require("express");
const router = express.Router();
const auth_roles = require("../config/userRoles");
const verifyRoles = require("../middlewares/verifyRolesMiddleware");
const { createNewUser } = require("../controllers/registration.controller");

router.post("/register/user", createNewUser);

module.exports = router;
