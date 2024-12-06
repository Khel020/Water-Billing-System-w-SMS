const mongoose = require("mongoose");

let CashierSchema = new mongoose.Schema({
  username: {
    type: String,
    trim: true,
    required: [true, "Required!"],
    unique: [true, "Username Already Taken!"],
  },
  password: {
    type: String,
    trim: true,
    required: [true, "Required!"],
    minLength: [8, "Password should be at least 8-12 characters long"],
  },
  contact: {
    type: Number,
    trim: true,
    required: [true, "Required!"],
    maxLength: 11,
  },
  name: {
    type: String,
    trim: true,
    required: [true, "Required!"],
  },
  email: {
    type: String,
    trim: true,
    unique: [true, "Email Already Taken!"],
    sparse: true,
  },
  address: {
    type: String,
    trim: true,
  },
  usertype: {
    type: String,
    required: true,
    default: "cashier",
  },
  dateCreated: {
    type: Date,
  },
  isCashier: {
    type: Boolean,
    default: true,
  },
  status: {
    type: String,
    enum: ["active", "deactivated"],
    default: "active",
  },
  isArchive: {
    type: Boolean,
    default: false,
  },
});
const CASHIERS = mongoose.model("Cashiers", CashierSchema);
module.exports = CASHIERS;
