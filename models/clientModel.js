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
  }, // e.g., '01' for Zone 1
  book: {
    type: Number,
    required: true,
    default: 1,
  }, // Starts with Book 1
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
  install_fee: {
    type: Number,
    trim: true,
    required: [true, "Required"],
  },
  connection_fee: {
    type: Number,
    trim: true,
    required: [true, "Required"],
  },
  activation_date: {
    type: Date,
    trim: true,
    required: [true, "Required"],
  },
  activationStatus: {
    type: String,
    enum: ["pending", "activated"],
    default: "pending",
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
});

const CLIENT = mongoose.model("consumers", clientSchema);
module.exports = CLIENT;
