const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");

const loginUser = asyncHandler(async (req, res) => {
  const { user_name, email, picture } = req.body;
  if (!user_name || !email) {
    res.status(400).json("All fields are mandatory");
    throw new Error("All fields are mandatory");
  }
  const user = await User.findOne({ email: email });
  if (!user) {
    const user = await User.create({
      user_name,
      email,
      picture,
    });
    if (user) {
      res.status(201).json({ user_id: user.id });
    } else {
      res.status(400).json("User data is not valid");
      throw new Error("User data is not valid");
    }
  } else if (user) {
    res.status(200).json({ user_id: user.id });
  } else {
    res.status(400).json("User name or email is not valid");
    throw new Error("User name or email is not valid");
  }
});

module.exports = { loginUser };
