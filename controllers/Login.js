const admin = require("../models/adminModel");
const user = require("../models/usersModel");
const exp = require("express");
const mng = require("mongoose");
const jwt = require("jsonwebtoken");
const env = require("dotenv").config();
const route = exp.Router();
const bcrypt = require("bcrypt");
const pnv = process.env;

let makeToken = (data) => {
  return jwt.sign(data, pnv.TOKEN_SECRET, { expiresIn: "24h" });
};

module.exports.login = (acc_name, password, usertype, returnbody) => {
  let acc;
  if (usertype == "user") {
    acc = user;
  } else if (usertype == "admin") {
    acc = admin;
  }
  console.log(usertype);

  return acc
    .findOne({ $or: [{ acc_name: acc_name }, { email: acc_name }] })
    .then((result) => {
      if (result) {
        return bcrypt.compare(password, result.password).then((valid) => {
          if (valid) {
            returnbody.token = makeToken({
              acc_name: result.acc_name,
              isAdmin: result.isAdmin,
              isBillingMng: result.isBillingMng,
              isServiceOff: result.isServiceOff,
            });
            returnbody.name = result.firstname + " " + result.lastname;

            return returnbody;
          }
        });
      }
    });
};
