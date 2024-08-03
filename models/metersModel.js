const mongoose  = require("mongoose")

let meterSchema = new mongoose.Schema({
    acc_num:{
        type: String,
        trim: true,
        required: [true,"Required!"],
        unique:[true,"Account Number Already Taken"]
    },
    meter_num:{
        type: Number,
        trim: true,
        required: [true,"Required!"],
        unique:[true,"Meter Number Already Taken!"]
    },
    meter_brand:{
        type: String,
        trim: true,
    },
    install_date:{
        type: Date,
        required: [true,"Required!"]
    },
    install_price:{
        type: Number,
        required: [true,"Required!"]
    },
    activation_date:{
        type: Date,
        required: [true,"Required!"]
    },
    initial_reading:{
        type: Number,
        required: [true,"Required!"]
    },
    pipe_size:{
        type: Number,
        required: [true,"Required!"]
    }
})
const METER = mongoose.model('meters', meterSchema);
module.exports = METER;