const userModel = require("../models/user.model");
const bcrypt = require("bcrypt");
const profile_pics = require("../config/defaultProfilePics");

const { student_pic } = profile_pics;

//user registration method
const createNewUser = async (req, res) => {
  const { email, username, password } = req.body;

  if (!email || !username || !password) {
    return res.status(400).json({
      message:
        "please provide the necessary details (email, password, username)",
    });
  }

  const saltRounds = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  //check provided email is already registered as any role
  let query = { email: req.body.email.toString() };
  let duplicate = await userModel.findOne(query).exec();

  if (duplicate) {
    return res
      .status(400)
      .json({ message: "This email is already registered to the system!" });
  }

  try {
    let objQuery = {
      email: req.body.email.toString(),
      username: req.body.username.toString(),
      password: hashedPassword,
      profile_picture: student_pic,
    };
    const result = await userModel.create(objQuery);

    if (result) {
      const user_role = result.user_role;
      return res.status(201).json({
        email: result.email,
        username: result.username,
        profile_picture: result.profile_picture,
        user_role,
      });
    } else {
      return res
        .status(400)
        .json({ message: "student account could not be created!" });
    }
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  createNewUser,
};
