const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

let billSchema = new mongoose.Schema({
  billNumber: {
    type: Number,
    unique: true,
  },
  accountName: {
    type: String,
    required: [true, "Account Name is required!"],
  },
  acc_num: {
    type: String,
    required: [true, "Account Number is required!"],
  },
  reading_date: {
    type: Date,
    required: [true, "Reading Date is required!"],
  },
  due_date: {
    type: Date,
    required: [true, "Due Date is required!"],
    validate: {
      validator: function (value) {
        // Ensure the due date is after the reading date
        return this.reading_date < value;
      },
      message: "Due date must be after the reading date!",
    },
  },
  present_read: {
    type: Number,
    required: [true, "Present Reading is required!"],
    min: [0, "Present Reading cannot be negative"],
  },
  prev_read: {
    type: Number,
    required: [true, "Previous Reading is required!"],
    min: [0, "Previous Reading cannot be negative"],
  },
  consumption: {
    type: Number,
    required: [true, "Consumption is required!"],
    min: [0, "Consumption cannot be negative"],
  },
  dc_date: {
    type: Date,
  },
  currentBill: {
    type: Number,
    required: [true, "Current Bill is required!"],
    min: [0, "Current Bill cannot be negative"],
  },
  arrears: {
    type: Number,
    default: 0, // Default to 0 if no arrears
    min: [0, "Arrears cannot be negative"],
  },
  amountPaid: {
    type: Number,
    default: 0, // Tracking the amount paid by the client
    min: [0, "Amount Paid cannot be negative"],
  },
  totalDue: {
    type: Number,
    required: true,
    default: 0.0,
    min: [0, "Total Due cannot be negative"],
  },
  p_charge: {
    type: Number, // Penalty Charge Amount After Due Date
    default: 0,
    min: [0, "Penalty Charge cannot be negative"],
  },
  payment_status: {
    type: String,
    enum: ["Unpaid", "Paid", "Partial"],
    required: [true, "Payment Status is required!"],
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
    default: 0,
    min: [0, "Days past due cannot be negative"],
  },
  category: {
    type: String,
    enum: [
      "Residential",
      "Commercial",
      "Commercial_A",
      "Commercial_B",
      "Commercial_C",
      "Government",
      "Industrial",
    ],
    required: [true, "Category is required!"],
  },
  payment_date: {
    type: Date,
    validate: {
      validator: function (value) {
        // Ensure the payment date is after or on the reading date
        return this.reading_date <= value;
      },
      message: "Payment date must be after or on the reading date!",
    },
  },
});

// Automatically increment the billNumber field
billSchema.plugin(AutoIncrement, { inc_field: "billNumber" });

const BILL = mongoose.model("bills", billSchema);
module.exports = BILL;
