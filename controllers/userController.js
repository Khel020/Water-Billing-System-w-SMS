const user = require("../models/usersModel.js");
const client = require("../models/clientModel.js");
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
    // Step 1: Check if the user is a valid consumer (exists in the client collection)
    const checkInClient = await client.findOne({
      accountName: data.username,
      acc_num: data.acc_num,
    });

    if (!checkInClient || checkInClient === null) {
      console.log("User not found in the client collection.");
      return { success: false, message: "You're not a consumer" };
    }

    // Step 2: Check if the user already exists in the user collection
    const account = await user.findOne({
      $or: [
        { username: data.username },
        { name: `${data.fname} ${data.lastname}` },
        { acc_num: data.acc_num },
        { meter_num: data.meter_num },
        { email: data.email },
      ],
    });

    // Step 3: Handle duplicate entries
    if (account) {
      const errors = {};
      if (account.username === data.username) {
        errors.username = "Account Name is already taken.";
      }
      if (account.acc_num === data.acc_num) {
        errors.acc_num = "Account Number is already taken.";
      }
      if (account.name === `${data.fname} ${data.lastname}`) {
        errors.name = "This name is already registered.";
      }

      if (account.email === data.email) {
        errors.email = "Email is already taken.";
      }

      return { success: false, errors };
    }

    // Step 4: Create a new user if no conflicts
    const NewUser = new user({
      username: data.username,
      password: passHash(data.password),
      lastname: data.lastname,
      fname: data.fname,
      name: `${data.fname} ${data.lastname}`, // Concatenate first and last name
      contact: data.contact,
      acc_num: data.acc_num,
      meter_num: data.meter_num,
      birthday: data.birthday,
      email: data.email,
      dateCreated: new Date(),
    });

    // Step 5: Save the new user to the database
    const result = await NewUser.save();

    if (result) {
      return { success: true, message: "User registered successfully!" };
    } else {
      return { success: false, message: "Failed to save the new user." };
    }
  } catch (err) {
    console.error("Error in CreateUser:", err);
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
