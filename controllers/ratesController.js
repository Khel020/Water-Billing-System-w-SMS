const rates = require("../models/ratesModel.js");
const exp = require('express');
const mng = require('mongoose');
const env = require('dotenv').config();
const route = exp.Router();
const bcrypt = require('bcrypt');
const pnv = process.env;

exports.CreateRates = async(data) => {
    let NewRate = new rates();
    NewRate.rates_value = data.rates_value
    NewRate.cubic_meter = data.cubic_meter
    NewRate.category = data.category

    return NewRate.save().then(result=>{
        if(result){
            return {message:"Rate Already saved"}
        }
    }).catch(err=>{
       return console.log(err);
    })
}
exports.GetRates = async(data) => {
    return await rates.find({}).then(result=>{
        if(result){
            return result;
        }
    }).catch(err => {
        return{error:"There is an error"};
    })
}
exports.UpdateRate = async(data) => {
    const rateID = data.id
    const updates = data.body

    const updateRate = await user.findByIdAndUpdate(rateID, updates);

    if (!updateRate) {
        return ({message: 'Rate not found'});
    }
    return updateRate;
}
exports.DeleteRate = async(data) => {
    
}
