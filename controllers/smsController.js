const sms = require("../models/smsModel.js");
const exp = require('express');
const mng = require('mongoose');
const env = require('dotenv').config();
const route = exp.Router();
const bcrypt = require('bcrypt');
const pnv = process.env;

exports.CreateSMS = async(data) => {
    let newSMS = new sms();
    newSMS.sms_type = data.sms_type
    newSMS.sms_descript = data.sms_descript

    return newSMS.save().then(result=>{
        if(result){
            return {message:"Rate Already saved"}
        }
    }).catch(err=>{
       return console.log(err);
    })
}
exports.GetSMS = async(data) => {
    return await sms.find({}).then(result=>{
        if(result){
            return result;
        }
    }).catch(err => {
        return{error:"There is an error"};
    })
}
exports.UpdateSMS = async(data) => {
    const SMSID = data.id
    const updates = data.body

    const updateSMS = await sms.findByIdAndUpdate(SMSID, updates);

    if (!updateSMS) {
        return ({message: 'Rate not found'});
    }
    return updateSMS;
}
exports.DeleteSMS = async(data) => {
    
}