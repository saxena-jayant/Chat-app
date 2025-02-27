const asyncHandler = require("express-async-handler");
const User = require("../models/userModel");
const Chat = require("../models/chatModel");

const getUsersForSidebar = asyncHandler(async (req, res) => {
  const { user_id } = req.body;
  if (!user_id) {
    res.status(400).json("All fields are mandatory");
    throw new Error("All fields are mandatory");
  }
  const filteredUsers = await User.find(
    { _id: { $ne: user_id } },
    { user_name: 1, email: 1, picture: 1 }
  );
  if (filteredUsers) {
    res.status(200).json(filteredUsers);
  } else {
    res.status(400).json("User id is not valid");
    throw new Error("User id is not valid");
  }
});

const getMessages = asyncHandler(async (req, res) => {
  const { sender_id, receiver_id } = req.body;
  if (!sender_id || !receiver_id) {
    res.status(400).json("All fields are mandatory");
    throw new Error("All fields are mandatory");
  }
  const messages = await Chat.find(
    {
      $or: [
        { sender_id: sender_id, receiver_id: receiver_id },
        { sender_id: receiver_id, receiver_id: sender_id },
      ],
    },
    {
      sender_id: 1,
      receiver_id: 1,
      document: 1,
      message: 1,
      status: 1,
      time_stamp: 1,
    }
  );
  if (messages) {
    res.status(200).json(messages);
  } else {
    res.status(400).json("Sender id or receiver id is not valid");
    throw new Error("Sender id or receiver id is not valid");
  }
});

module.exports = { getUsersForSidebar, getMessages };
