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
});
const CLIENT = mongoose.model("client", clientSchema);
module.exports = CLIENT;
