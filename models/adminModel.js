const mongoose = require("mongoose")

let adminSchema = new mongoose.Schema({
    username:{
        type: String,
        trim: true,
        required: [true,"Required!"],
        unique:[true,"Username Already Taken!"]
    },
    password:{
        type: String,
        trim: true,
        required: [true,"Required!"],
        minLength:[8,"Password should be at least 8-12 characters long"]
    },
    usertype:{
        type: String,
        trim: true,
        required: [true,"Required!"],
    },
    contact:{
        type: Number,
        trim: true,
        required: [true,"Required!"],
        maxLength:11
    },
    fname:{
        type: String,
        trim: true,
        required: [true,"Required!"],
    },
    lastname:{
        type: String,
        trim: true,
        required: [true,"Required!"],
    },
    email:{
        type: String,
        trim: true,
        unique:[true,"Email Already Taken!"],
        sparse: true
    },
    address:{
        house_num:{
            type:Number,
        },
        purok:{
            type:String,
            trim: true
        },
        brgy:{
            type:String,
            trim: true
        },
        municipality:{
            type:String,
            trim: true
        },
        province:{
            type:String,
            trim: true
        }
    }
})
const ADMIN = mongoose.model("admin", adminSchema);
module.exports = ADMIN;