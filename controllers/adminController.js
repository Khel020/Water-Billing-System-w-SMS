const admin = require("../models/adminModel.js");
const exp = require('express');
const mng = require('mongoose');
const env = require('dotenv').config();
const route = exp.Router();
const bcrypt = require('bcrypt');
const pnv = process.env;


exports.CreateAdmin = async(data) =>{
    let newAdmin = new admin();
    newAdmin.username = data.username;
    newAdmin.password= data.password;
    newAdmin.usertype= data.usertype;
    newAdmin.contact= data.contact;
    newAdmin.fname= data.fname;
    newAdmin.lastname= data.lastname;
    newAdmin.email= data.email;
    newAdmin.address = data.address;

    return newAdmin.save().then(result=>{
        if(result){
            return {message:"Admin already saved"}
        }
    }).catch(err=>{
       return{error:"There is an error" + err};
    })
}
exports.GetAdmin = async(data) => {

    return await admin.find({}).then(result=>{
        if(result){
            return result;
        }
    }).catch(err => {
        return{error:"There is an error"};
    })
}
exports.UpdateAdminByID = async(data) => {
    const adminID = data.id;
    const updates = data.updates;

    const updatedAdmin = await admin.findByIdAndUpdate(adminID, updates);

    if (!updatedAdmin) {
        return ({message: 'Client not found'});
    }
    return updatedAdmin;
}

