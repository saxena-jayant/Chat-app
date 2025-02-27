const mongoose = require("mongoose");

const userSchema = mongoose.Schema(
  {
    user_name: {
      type: String,
      required: [true, "Invalid number"],
    },
    email: {
      type: String,
      required: [true, "Invalid email"],
    },
  },
  {
    timestamps: true,
    strict: false,
  }
);

module.exports = mongoose.model("User", userSchema);
