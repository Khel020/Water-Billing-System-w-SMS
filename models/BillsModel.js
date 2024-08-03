const mongoose = require("mongoose")

let billSchema = new mongoose.Schema({
    //Need Bill Number
    reading_date:{
        type: Date,
        required: [true, "Required!"],
    },
    due_date:{
        type: Date,
        required: [true, "Required!"],
    },
    fullname:{
        type: String,
        required: [true, "Required!"],
    },
    consumption:{
        type: Number,
        required: [true, "Required!"],
    },
    dc_date:{ // Disconnection date
        type: Date,
        required: [true, "Required!"],
    },
    p_charge:{ //penalty charge
        type: Number,
        required: [true, "Required!"],
    },
    others:{ 
        type: String,
        required: [true, "Required!"],
    },
    remarks:{ 
        type: String,
        required: [true, "Required!"],
    }
})
const BILL = mongoose.model("bills", billSchema);
module.exports = BILL;