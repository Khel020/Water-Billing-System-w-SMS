const admin = require("../models/adminModel");
const client = require("../models/usersModel");
const billmngr = require("../models/BillMngr");
const exp = require("express");
const jwt = require("jsonwebtoken");
const env = require("dotenv").config();
const route = exp.Router();
const BCRYPT = require("bcrypt");
const pnv = process.env;

let makeToken = (data) => {
  return jwt.sign(data, pnv.TOKEN_SECRET, { expiresIn: "24h" });
};

//TODO: CLIENT LOGIN TOKEN
module.exports.login = async (req) => {
  console.log("Request", req); // Use req.body here
  try {
    const username = req.username; // Correctly access req.body
    const password = req.password;

    console.log("Username and password", username, password);

    let user;
    let userType;

    // Check bill manager first
    user = await billmngr.findOne({ username });
    if (user) {
      userType = user.usertype;
    }

    // If not found, check admin
    if (!user) {
      user = await admin.findOne({ username });
      if (user) {
        userType = user.usertype;
      }
    }

    // If still not found, check client
    if (!user) {
      user = await client.findOne({ username });
      if (user) {
        userType = user.usertype;
      }
    }

    // If user still not found, return invalid username message
    if (!user) {
      return {
        success: false,
        message: "Account Name not found. Please try again.",
      };
    }

    // Check if password is valid
    const isPasswordValid = await BCRYPT.compare(password, user.password);
    if (!isPasswordValid) {
      return { success: false, message: "Access denied: Incorrect password." };
    }

    // Password is valid, generate the token
    const returnBody = {};

    if (userType === "users") {
      returnBody.token = makeToken({
        user_id: user._id,
        acc_num: user.acc_num,
        accountName: user.username,
        type: userType,
        isUser: user.usertype,
      });
      returnBody.expTKN = new Date(new Date().getTime() + 23 * 60 * 60 * 1000);
      returnBody.name = user.username;
      returnBody.type = userType;
      return { success: true, returnBody: returnBody };
    } else if (userType === "billmngr") {
      returnBody.token = makeToken({
        user_id: user._id,
        accountName: user.name,
        type: userType,
        IsBiller: user.isBiller,
      });
      returnBody.expTKN = new Date(new Date().getTime() + 23 * 60 * 60 * 1000);
      returnBody.type = userType;
      return { success: true, returnBody: returnBody };
    } else if (userType === "admin") {
      returnBody.token = makeToken({
        user_id: user._id,
        accountName: user.name,
        type: userType,
        isAdmin: user.isAdmin,
      });
      returnBody.expTKN = new Date(new Date().getTime() + 23 * 60 * 60 * 1000);
      returnBody.type = userType;
      return { success: true, returnBody: returnBody };
    } else {
      return { success: false, message: "Invalid User Type" };
    }
  } catch (error) {
    console.error("Login Error:", error);
    throw new Error("Server error"); // Throw error to be caught in route
  }
};
