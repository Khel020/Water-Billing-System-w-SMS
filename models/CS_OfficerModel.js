const mongoose = require("mongoose");

let CS_OfficerSchema = new mongoose.Schema({
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
    type: String, // Change to String
    trim: true,
    required: [true, "Required!"],
    maxLength: [11, "Contact number must be 11 digits"],
    validate: {
      validator: function (value) {
        // Validate that it is numeric and 11 digits long
        return /^\d{11}$/.test(value);
      },
      message: "Contact number must be 11 digits and numeric.",
    },
  },
  f_name: {
    type: String,
    trim: true,
    required: [true, "Required firstname!"],
  },
  last_name: {
    type: String,
    trim: true,
    required: [true, "Required lastname!"],
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
    default: "CS_Officer",
  },
  dateCreated: {
    type: Date,
  },
  isCS_Officer: {
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
const CS_Officer = mongoose.model("CS_Officer", CS_OfficerSchema);
module.exports = CS_Officer;
