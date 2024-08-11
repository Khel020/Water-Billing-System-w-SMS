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
    const errors = {};
    if (account.acc_name === data.acc_name) {
      errors.acc_name = "Account Name is already taken.";
    }
    if (account.acc_num === data.acc_num) {
      errors.acc_num = "Account Number is already taken.";
    }
    if (account.meter_num === data.meter_num) {
      errors.meter_num = "Meter Number is already taken.";
    }
    if (account.email === data.email) {
      errors.email = "Email is already taken.";
    }

    return { success: false, errors };
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
