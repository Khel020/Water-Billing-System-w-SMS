const mongoose = require("mongoose");

let LogSchema = new mongoose.Schema({
    //need ID admin ID
    log_type:{
        type: String,
        required: [true, "Required"]
    },
    log_descript:{
        type: String,
        required: [true, "Required"]
    },
    log_date:{
        type: Date,
        required: [true, "Required"]
    },
})
const LOGS = mongoose.model("logs", LogSchema);
module.exports = LOGS;