const user = require("../models/usersModel.js");
const exp = require("express");
const mng = require("mongoose");
const env = require("dotenv").config();
const route = exp.Router();
const bcrypt = require("bcrypt");
const pnv = process.env;

let passHash = (password) => {
  return bcrypt.hashSync(password, parseInt(pnv.SALT));
};

exports.CreateUser = async (data) => {
  const account = await user.findOne({
    $or: [
      { acc_name: data.acc_name },
      { acc_num: data.acc_num },
      { meter_num: data.meter_num },
      { email: data.email },
    ],
  });
  if (account) {
    let errorMessage = "Account Already Exists: ";
    if (account.acc_name === data.acc_name) {
      errorMessage += "Account Name already taken. ";
      console.log(errorMessage);
    }
    if (account.acc_num === data.acc_num) {
      errorMessage += "Account Number already taken. ";
      console.log(errorMessage);
    }
    if (account.meter_num === data.meter_num) {
      errorMessage += "Meter Number already taken. ";
      console.log(errorMessage);
    }
    if (account.email === data.email) {
      errorMessage += "Email already taken.";
      console.log(errorMessage);
    }
    return { message: errorMessage.trim() };
  } else {
    let NewUser = new user();
    NewUser.acc_name = data.acc_name;
    NewUser.password = passHash(data.password);
    NewUser.contact = data.contact;
    NewUser.acc_num = data.acc_num;
    NewUser.meter_num = data.meter_num;
    NewUser.birthday = data.birthday;
    NewUser.email = data.email;

    return NewUser.save()
      .then((result) => {
        if (result) {
          return { message: "Account Successfully Created" };
        }
      })
      .catch((err) => {
        console.log(err);
        return { message: "An error occurred while creating the account." };
      });
  }
};
exports.GetAllUsers = async (data) => {
  return await user
    .find({})
    .then((result) => {
      if (result) {
        return result;
      }
    })
    .catch((err) => {
      return { error: "There is an error" };
    });
};
exports.UpdateUserByID = async (data) => {
  const userID = data.id;
  const updates = data.updates;

  const updatedUser = await user.findByIdAndUpdate(userID, updates);

  if (!updatedUser) {
    return { message: "Client not found" };
  }
  return updatedUser;
};
exports.DeleteClientByID = async (data) => {};
