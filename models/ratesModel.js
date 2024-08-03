const mongoose = require("mongoose");

let rateSchema = new mongoose.Schema({
    rates_value:{
        type: Number,
        required: [true,"Required!"],
    },
    cubic_meter:{
        type: Number,
        required: [true,"Required!"],
    },
    category:{
        type: String,
        required: [true,"Required!"],
    },
})
const RATES = mongoose.model("rates", rateSchema);
module.exports = RATES;
