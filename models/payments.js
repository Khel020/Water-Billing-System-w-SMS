const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);
let Payments = new mongoose.Schema({
  acc_num: {
    type: Number,
    require: true,
  },
  accountName: {
    type: String,
    require: true,
  },
  billNumber: {
    type: Number,
    require: true,
  },
  address: {
    type: String,
    require: true,
  },
  amountDue: {
    type: Number,
    require: true,
  },
  payment_amount: {
    type: Number,
    require: true,
  },
  paid: {
    type: Number,
    require: true,
  },
  balance: {
    type: Number,
  },
  change: {
    type: Number,
    require: true,
  },
  others: {
    type: String,
    require: true,
  },
  arrears: {
    type: String,
    require: true,
  },
});
Payments.plugin(AutoIncrement, { inc_field: "OR_NUM" });
const payments = mongoose.model("bills", Payments);
module.exports = payments;
