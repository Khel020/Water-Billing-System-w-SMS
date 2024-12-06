const IT_ACCOUNT = require("../models/IT_Model.js");
const exp = require("express");
const mng = require("mongoose");
const env = require("dotenv").config();
const route = exp.Router();
const bcrypt = require("bcrypt");
const pnv = process.env;

//Upload Bulk Consumers In System
let passHash = (password) => {
  console.log("Password", password);
  return bcrypt.hashSync(password, parseInt(pnv.SALT));
};

exports.CreateITAccount = async (data) => {
  try {
    const existingAccount = await IT_ACCOUNT.findOne({
      $or: [{ username: data.username }, { email: data.email }],
    });

    if (existingAccount) {
      const errors = {};
      if (existingAccount.username === data.username) {
        errors.username = "Username is already taken.";
      }
      if (existingAccount.email === data.email) {
        errors.email = "Email is already taken.";
      }
      return { success: false, errors };
    }

    // Create a new IT account
    const newITAccount = new IT_ACCOUNT();
    newITAccount.username = data.username;
    newITAccount.password = passHash(data.password);
    newITAccount.contact = data.contact;
    newITAccount.name = `${data.fname} ${data.lastname}`;
    newITAccount.email = data.email;
    newITAccount.f_name = data.fname;
    newITAccount.last_name = data.lastname;
    newITAccount.address = data.address;
    newITAccount.dateCreated = new Date();

    const result = await newITAccount.save();
    return {
      success: true,
      message: "IT Account successfully created.",
      data: result,
    };
  } catch (err) {
    console.error("Error creating IT account:", err);
    return {
      success: false,
      error: "An error occurred while creating the IT account.",
      details: err.message,
    };
  }
};
