const admin = require("../models/adminModel");
const client = require("../models/usersModel");
const billmngr = require("../models/BillMngr");
const exp = require("express");
const mng = require("mongoose");
const jwt = require("jsonwebtoken");
const env = require("dotenv").config();
const route = exp.Router();
const BCRYPT = require("bcrypt");
const { IsBiller } = require("../middleware/Auth");
const pnv = process.env;

let makeToken = (data) => {
  return jwt.sign(data, pnv.TOKEN_SECRET, { expiresIn: "24h" });
};
// // authorizeRoles.js
// module.exports.authorizeRoles = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.usertype)) {
//       return res.status(403).json({ error: "Forbidden" });
//     }
//     next();
//   };
// };
//TODO: CLIENT LOGIN TOKEN
module.exports.login = async (req, res) => {
  try {
    console.log("TEMPORARY LOGIN", req.username, req.password);
    let username = req.username;
    let password = req.password;
    console.log("TESTING ", username, password);

    let user;
    let t;

    user = await billmngr.findOne({ username });
    if (user) {
      t = user.usertype;
    }
    if (!user) {
      user = await admin.findOne({ username });
      if (user) {
        t = user.usertype;
      }
    }
    if (!user) {
      user = await client.findOne({ username });
      if (user) {
        t = user.usertype;
      }
    }
    if (!user) {
      return res
        .status(401)
        .json({ message: "Invalid account name or password" });
    }
    if (user) {
      return BCRYPT.compare(password, user.password).then((valid) => {
        if (valid) {
          console.log("YOUR TYPE IS", t);
          const returnbody = {};
          //TODO: TOKEN FOR BILLER ADMIN
          if (t === "users") {
            returnbody.token = makeToken({
              user_id: user._id,
              acc_num: user.acc_num,
              accountName: user.username,
              type: t,
              isUser: user.usertype,
            });
            returnbody.expTKN = new Date(
              new Date().getTime() + 23 * 60 * 60 * 1000
            );
            returnbody.name = user.username;
            returnbody.type = t;
            return returnbody; // Return the response object
          }
          //TODO: TOKEN FOR BILLER MANAGER
          else if (t === "billmngr") {
            returnbody.token = makeToken({
              user_id: user._id,
              accountName: user.name,
              type: t,
              IsBiller: user.isBiller,
            });
            returnbody.expTKN = new Date(
              new Date().getTime() + 23 * 60 * 60 * 1000
            );
            returnbody.type = t;
            return returnbody;
          }
          //TODO: TOKEN FOR ADMIN
          else if (t === "admin") {
            returnbody.token = makeToken({
              user_id: user._id,
              accountName: user.name,
              type: t,
              isAdmin: user.isAdmin,
            });
            returnbody.type = t;
            returnbody.expTKN = new Date(
              new Date().getTime() + 23 * 60 * 60 * 1000
            );
            return returnbody;
          } else {
            return { err: "Invalid User" };
          }
        } else {
          return { err: "Invalid Password" };
        }
      });
    }
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ message: "Server error" });
  }
};
