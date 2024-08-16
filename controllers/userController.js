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
  try {
    const account = await user.findOne({
      $or: [
        { username: data.username },
        { acc_num: data.acc_num },
        { meter_num: data.meter_num },
        { email: data.email },
      ],
    });
    console.log("Account found: ", account);
    console.log("Data received: ", data);
    if (account) {
      const errors = {};
      if (account.username === data.username) {
        errors.username = "Account Name is already taken.";
      }
      if (account.acc_num === data.acc_num) {
        errors.acc_num = "Account Number is already taken.";
      }
      if (String(account.meter_num) === data.meter_num) {
        errors.meter_num = "Meter Number is already taken.";
      }
      if (account.email === data.email) {
        errors.email = "Email is already taken.";
      }
      console.log({ errors });
      return { success: false, errors };
    }

    const NewUser = new user({
      username: data.username,
      password: passHash(data.password),
      contact: data.contact,
      acc_num: data.acc_num,
      meter_num: data.meter_num,
      birthday: data.birthday,
      email: data.email,
    });

    const result = await NewUser.save();
    if (result) {
      return { success: true };
    } else {
      return { message: "No result" };
    }
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "An error occurred while creating the account.",
    };
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
