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
  zone: {
    type: String,
    required: true,
  },
  book: {
    type: Number,
    required: true,
    default: 1,
  },
  c_address: {
    type: String,
    require: true,
  },
  meter_brand: {
    type: String,
    require: true,
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
    enum: ["Active", "Inactive", "Pending"],
    default: "Pending",
  },
  disconnection_status: {
    type: String,
    enum: ["None", "For Disconnection", "Disconnected", "Paid"],
    default: "None", // Default status if the client is not set for disconnection
  },
  dc_date: {
    type: Date,
  },
  contact: {
    type: Number,
    required: true,
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
  install_fee: {
    type: Number,
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
  advancePayment: {
    type: Number,
    default: 0,
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
  sequenceNumber: {
    type: Number,
  }, // Sequential number (001-999)
  unpaidBills: {
    type: Number,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
});

const CLIENT = mongoose.model("consumers", clientSchema);
module.exports = CLIENT;
