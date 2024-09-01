const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

let billSchema = new mongoose.Schema({
  accountName: {
    type: String,
    required: [true, "Required!"],
  },
  acc_num: {
    type: String,
    required: [true, "Required!"],
  },
  reading_date: {
    type: Date,
    required: [true, "Required!"],
  },
  due_date: {
    type: Date,
    required: [true, "Required!"],
  },
  present_read: {
    type: Number,
    required: [true, "Present Reading Required"],
  },
  prev_read: {
    type: Number,
    required: [true, "Previous Reading Required"],
  },
  consumption: {
    type: Number,
    required: [true, "Required!"],
  },
  dc_date: {
    type: Date,
    required: [true, "Required!"],
  },
  currentBill: {
    type: Number,
    required: [true, "Required!"],
  },
  arrears: {
    type: Number,
    default: 0, // Default to 0 if no arrears
  },
  amountPaid: {
    type: Number,
    default: 0, // Tracking the amount paid by the client
  },
  totalDue: {
    type: Number,
    required: true,
    default: 0.0,
  },
  p_charge: {
    type: Number, // Penalty Charge Amount After Due Date
    default: 0,
  },
  payment_status: {
    type: String,
    enum: ["Unpaid", "Paid"],
    required: [true, "Required!"],
    default: "Unpaid",
  },
  others: {
    type: String,
  },
  remarks: {
    type: String,
  },
  dayPastDueDate: {
    type: Number,
  },
  rate: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    enum: ["Residential", "Commercial"],
    required: true,
  },
});

billSchema.plugin(AutoIncrement, { inc_field: "billNumber" });

const BILL = mongoose.model("bills", billSchema);
module.exports = BILL;
