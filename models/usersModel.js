const mongoose = require("mongoose");

let userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: [true, "Username Required!"],
    unique: [true, "Username Already Taken!"],
  },
  password: {
    type: String,
    trim: true,
    required: [true, "Required!"],
  },
  contact: {
    type: Number,
    trim: true,
    required: [true, "Required!"],
    maxLength: 11,
  },
  acc_num: {
    type: String,
    trim: true,
    required: [true, "Required!"],
    unique: [true, "Account Number Already Taken!"],
  },
  meter_num: {
    type: Number,
    trim: true,
    required: [true, "Required!"],
    unique: [true, "Meter Number Already Taken!"],
  },
  birthday: {
    type: Date,
    required: [true, "Required!"],
  },
  email: {
    type: String,
    trim: true,
    unique: [true, "Email Already Taken!"],
    sparse: true,
  },
  usertype: {
    type: String,
    required: true,
    default: "users",
  },
});

const USERS = mongoose.model("users", userSchema);
module.exports = USERS;
