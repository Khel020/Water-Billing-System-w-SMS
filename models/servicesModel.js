const mongoose = required("mongoose");

let serviceSchema = new mongoose.Schema({
    service_name:{
        type: String,
        required: [true, "Required!"],
        unique: [true, "Service name already taken"]
    },
    service_descript:{
        type: String,
        required: [true, "Required!"],
    },
    service_price:{
        type: Number,
        required: [true, "Required!"],
    }
})
const SERVICE = mongoose.model("Services", serviceSchema);
module.exports = SERVICE;