const mongoose = require("mongoose");

let feesSchema = new mongoose.Schema({
  acc_num: String,
  accountName: String,
  installation_fee: Number,
  connection_fee: Number,
});
const FEES = mongoose.model("Fees", feesSchema);
module.exports = FEES;
