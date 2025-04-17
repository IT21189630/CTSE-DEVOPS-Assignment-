const mongoose = require("mongoose");
const user_roles = require("../config/userRoles");

const {Admin} = user_roles;

const adminSchema = mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, "valid email address is required!"],
    },

    username: {
      type: String,
      required: [true, "valid usernameis required!"],
    },

    password: {
      type: String,
      required: [true, "valid password is required!"],
    },

    profile_picture: {
      type: String,
      required: false,
    },

    user_role: {
      type: Number,
      default: Admin
    },

    refresh_token: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("Admin", adminSchema);
