const mongoose = require("mongoose");

let clientSchema = new mongoose.Schema({
  acc_num: {
    type: String,
    required: true,
    unique: true,
  },
  accountName: {
    type: String,
    required: true,
  },
  c_address: {
    house_num: {
      type: Number,
    },
    purok: {
      type: String,
      trim: true,
    },
    brgy: {
      type: String,
      trim: true,
    },
  },
  brand_num: {
    type: Number,
  },
  meter_num: {
    type: Number,
    trim: true,
    required: [true, "Required!"],
  },
  pipe_size: {
    type: String,
    trim: true,
    required: [true, "Required!"],
  },
  status: {
    type: String,
    trim: true,
    required: [true, "Required!"],
  },
  client_type: {
    type: String,
    trim: true,
    required: [true, "Required!"],
  },
  initial_read: {
    type: Number,
  },
  install_date: {
    type: Date,
    trim: true,
    required: [true, "Required"],
  },
  activation_date: {
    type: Date,
    trim: true,
    required: [true, "Required"],
  },
  meter_installer: {
    type: String,
    trim: true,
    required: [true, "Required"],
  },
  last_billDate: {
    type: Date,
    default: null, // Set default to null
  },
  totalBalance: {
    type: Number,
    default: 0.0, // Set default to 0.0
  },
  isArchive: {
    type: Boolean,
    default: false, // Default value for isArchive
  },
});

const CLIENT = mongoose.model("consumers", clientSchema);
module.exports = CLIENT;
