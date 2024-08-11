const mongoose = require("mongoose");

let smsSchema = new mongoose.Schema({
  sms_type: {
    type: Number,
    required: [true, "Required!"],
  },
  sms_descript: {
    type: Number,
    required: [true, "Required!"],
  },
});
const SMS = mongoose.model("sms", smsSchema);
module.exports = SMS;
