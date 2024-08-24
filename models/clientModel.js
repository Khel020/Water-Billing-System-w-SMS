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
  contact: {
    type: Number,
    trim: true,
    required: [true, "Required!"],
    maxLength: 11,
  },
  meter_num: {
    type: Number,
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
  email: {
    type: String,
    trim: true,
    required: [true, "Email Required!"],
  },
  last_billDate: {
    type: Date,
    trim: true,
  },
  totalBalance: {
    type: Number,
  },
  install_date: {
    type: Date,
    trim: true,
    required: [true, "Required"],
  },
  isArchive: {
    type: Boolean,
  },
});
const CLIENT = mongoose.model("consumers", clientSchema);
module.exports = CLIENT;
