const mongoose = require("mongoose");

const logSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
  },
  details: {
    type: String,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Kung gumagamit ka ng user model para sa authentication
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Log = mongoose.model("logs", logSchema);
module.exports = Log;
