const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

let PaymentsSchema = new mongoose.Schema({
  processBy: {
    type: String,
    required: true,
  },
  billNo: [Number],
  acc_num: {
    type: String,
  },
  accountName: {
    type: String,
    required: true,
  },
  address: {
    type: String,
  },
  paymentDate: {
    type: Date,
    required: [true, "Payment Date Required"],
  },
  amountDue: {
    type: Number,
    required: true,
  },
  tendered: {
    type: Number,
    required: true,
  },
  balance: {
    type: Number,
  },
  change: {
    type: Number,
    required: true,
  },
  others: {
    type: String,
  },
  arrears: {
    type: String,
  },
  OR_NUM: {
    type: Number,
    unique: true,
  },
  paymentType: {
    type: String,
    required: true,
    enum: ["inspection", "For Installation", "bill"],
  },
});

// Enable Auto Increment for OR_NUM
PaymentsSchema.plugin(AutoIncrement, { inc_field: "OR_NUM" });

const Payments = mongoose.model("Payments", PaymentsSchema);
module.exports = Payments;
