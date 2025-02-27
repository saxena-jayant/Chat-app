const express = require("express");
const router = express.Router();
const {
  getUsersForSidebar,
  getMessages,
} = require("../controllers/chatController");

router.route("/get-users").post(getUsersForSidebar);
router.route("/get-messages").post(getMessages);

module.exports = router;
