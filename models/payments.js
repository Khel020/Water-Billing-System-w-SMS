const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);
let Payments = new mongoose.Schema({
  //make sure meron kang advance payment dito
  billNo: [Number],
  acc_num: {
    type: String,
    require: true,
  },
  accountName: {
    type: String,
    require: true,
  },
  address: {
    house_num: {
      type: Number,
      require: true,
    },
    purok: {
      type: Number,
      require: true,
    },
    brgy: {
      type: String,
      require: true,
    },
  },
  paymentDate: {
    type: Date,
    require: [true, "Payment Date Required"],
  },
  amountDue: {
    type: Number,
    require: true,
  },
  tendered: {
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
  OR_NUM: {
    type: Number, // Make sure this matches your increment field
    unique: true, // Ensures OR_NUM is unique
  },
});
Payments.plugin(AutoIncrement, { inc_field: "OR_NUM" });
const payments = mongoose.model("Payments", Payments);
module.exports = payments;
