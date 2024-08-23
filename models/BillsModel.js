const mongoose = require("mongoose");
const AutoIncrement = require("mongoose-sequence")(mongoose);

let billSchema = new mongoose.Schema({
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
  accountName: {
    type: String,
    required: [true, "Required!"],
  },
  dc_date: {
    type: Date,
    required: [true, "Required!"],
  },
  p_charge: {
    type: Number,
    default: 0,
  },
  payment_status: {
    type: String,
    required: [true, "Required!"],
    default: "Unpaid",
  },
  others: {
    type: String,
  },
  remarks: {
    type: String,
  },
  consumption: {
    type: Number,
    required: [true, "Required!"],
  },
  rate: { type: Number, required: true },
  totalAmount: { type: Number, required: true },
  category: {
    type: String,
    enum: ["Residential", "Commercial"],
    required: true,
  },
});

billSchema.plugin(AutoIncrement, { inc_field: "billNumber" });

const BILL = mongoose.model("bills", billSchema);
module.exports = BILL;
