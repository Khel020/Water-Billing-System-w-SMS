const mongoose = require("mongoose");

let clientSchema = new mongoose.Schema({
  dateApplied: {
    type: Date,
    required: true,
  },
  acc_num: {
    type: String,

    unique: true,
  },
  accountName: {
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
    required: true, // Fixed typo (require → required)
  },
  meter_brand: {
    type: String,
  },
  meter_num: {
    type: String, // Changed from Number to String (to preserve leading zeros)
    trim: true,
  },
  pipe_size: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    trim: true,
    enum: ["Pending", "Active", "Inactive"],
    default: "Pending",
  },
  disconnection_status: {
    type: String,
    enum: ["None", "For Disconnection", "Disconnected", "Paid"],
    default: "None",
  },
  dc_date: {
    type: Date,
  },
  contact: {
    type: String,
    trim: true,
    required: [true, "Required!"],
    maxLength: [11, "Contact number must be 11 digits"],
    validate: {
      validator: function (value) {
        return /^\d{11}$/.test(value); // Ensures it's numeric and 11 digits
      },
      message: "Contact number must be 11 digits and numeric.",
    },
  },
  client_type: {
    type: String,
    trim: true,
  },
  initial_read: {
    type: Number,
  },
  install_date: {
    type: Date,
  },
  installer: {
    type: String,
  },
  install_fee: {
    type: Number,
  },
  inspec_fee: {
    type: Number,
  },
  inspection_date: {
    type: Date,
  },
  paidInspection: {
    type: Boolean,
    default: false, // Updated when inspection fee is paid
  },
  paidInstallation: {
    type: Boolean,
    default: false, // Updated when installation fee is paid
  },
  activation_date: {
    type: Date,
  },
  advancePayment: {
    type: Number,
    default: 0,
  },
  last_billDate: {
    type: Date,
    default: null,
  },
  latest_billDue: {
    type: Date,
    default: null,
  },
  last_billStatus: {
    type: String,
    enum: ["Paid", "Unpaid", "Overdue"], // Optional: Add enum for clarity
  },
  totalBalance: {
    type: Number,
    default: 0, // Simplified from 0.0
  },
  isArchive: {
    type: Boolean,
    default: false,
  },
  sequenceNumber: {
    type: Number, // Sequential number (001-999)
  },
  unpaidBills: {
    type: Number,
  },
  dateCreated: {
    type: Date,
    default: Date.now,
  },
  dateActivated: {
    type: Date,
  },
});

const CLIENT = mongoose.model("consumers", clientSchema);
module.exports = CLIENT;
