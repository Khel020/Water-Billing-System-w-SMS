const mongoose = require("mongoose");

let paymentHistory = new mongoose.Schema({
  payment_date: {
    type: Date,
    required: [true, "Required!"],
  },
  amount: {
    type: Number,
    required: [true, "Required!"],
  },
  last_update: {
    type: Date,
    required: [true, "Required!"],
  },
});
const PAYMENT = mongoose.model("paymentHistory", paymentHistory);
module.exports = PAYMENT;
