const mongoose = require("mongoose");
const user_roles = require("../config/userRoles");

const { User } = user_roles;

const userSchema = mongoose.Schema(
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
      default: User,
    },

    refresh_token: String,
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userSchema);
