const userModel = require("../models/user.model");
const jwt = require("jsonwebtoken");
const { generateAccessToken } = require("../controllers/tokenGenerator");

const refreshTokenHandler = async (req, res) => {
  const cookie = req.cookies;
  if (!cookie?.jwt) {
    return res.sendStatus(401);
  }

  const refresh_token = cookie.jwt;
  let foundUser = await userModel.findOne({ refresh_token }).exec();

  if (!foundUser) {
    return res.status(403).send("Your token is mismatch with the one in db!");
  }

  const user_role = foundUser.user_role;
  const { username, _id } = foundUser;

  jwt.verify(refresh_token, process.env.REFRESH_SECRET_KEY, (err, decoded) => {
    if (err || foundUser.username !== decoded.username) {
      return res.sendStatus(403);
    }
    const accessToken = generateAccessToken({ username, user_role, _id });
    res.json({ accessToken });
  });
};

module.exports = { refreshTokenHandler };
