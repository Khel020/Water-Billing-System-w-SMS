const mongoose = require("mongoose");

let uploadedBills = new mongoose.Schema({
  date: { type: Date, required: true },
  consumers: { type: Number, required: true },
  zone: { type: String, required: true },
  status: { type: String, enum: ["success", "error"], required: true },
});
const UPLOADEDBILLS = mongoose.model("UploadHistory", uploadedBills);
module.exports = UPLOADEDBILLS;
