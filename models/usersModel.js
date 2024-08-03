const mongoose = require("mongoose");

let userSchema = new mongoose.Schema({
  acc_name: {
    type: String,
    trim: true,
    required: [true, "Account Name Required!"],
    unique: [true, "Account Name Already Taken!"],
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
});
const USERS = mongoose.model("users", userSchema);
module.exports = USERS;
