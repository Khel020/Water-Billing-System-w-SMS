const admin = require("../models/adminModel");
const user = require("../models/usersModel");
const billmngr = require("../models/BillMngr");
const exp = require("express");
const mng = require("mongoose");
const jwt = require("jsonwebtoken");
const env = require("dotenv").config();
const route = exp.Router();
const BCRYPT = require("bcrypt");
const pnv = process.env;

let makeToken = (data) => {
  return jwt.sign(data, pnv.TOKEN_SECRET, { expiresIn: "24h" });
};
module.exports.isAdmin = (req, res, next) => {
  if (!module.exports.tokenCheck(req, res)) {
    return false;
  }
  if (req.user.type === "admin") {
    next();
  } else {
    return false;
  }
};
module.exports.isUser = (req, res, next) => {
  if (!module.exports.tokenCheck(req, res)) {
    return false;
  }
  if (req.user.type === "user") {
    next();
  } else {
    false;
  }
};
module.exports.IsBiller = (req, res, next) => {
  if (!module.exports.tokenCheck(req, res)) {
    return false;
  }
  if (req.user.type === "biller") {
    next();
  } else {
    false;
  }
};
module.exports.tokenCheck = (req, res, next) => {
  if (req.headers.authorization === undefined) {
    res.json({ error: "Invalid Credentials" });
    return false;
  }
  const authHeader = req.headers.authorization;
  const token = authHeader.split(" ");
  //Check if Autorization type is Bearer
  if (token[0] != "Bearer") {
    res.json({ error: "Invalid Credentials" });
    return false;
  }
  try {
    const decodedToken = jwt.verify(token[1], pnv.TOKEN_SECRET);
    req.user = decodedToken;
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid Token" });
  }
};
// authorizeRoles.js
module.exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.usertype)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};

//TODO: CLIENT LOGIN TOKEN
module.exports.login = (data) => {
  return user.findOne({ acc_name: data.acc_name }).then((result) => {
    if (result) {
      console.log(result);
      return BCRYPT.compare(data.password, result.password).then((valid) => {
        if (valid) {
          const usertype = result.usertype; // Access usertype from result
          const returnbody = {}; // Define returnbody
          console.log(usertype);
          if (usertype === "users") {
            returnbody.token = makeToken({
              user_id: result._id,
              acc_num: result.acc_num,
              accountName: result.acc_name,
              isUser: result.usertype,
            });
            returnbody.expTKN = new Date(
              new Date().getTime() + 23 * 60 * 60 * 1000
            );
            returnbody.name = result.acc_name;
            returnbody.acc_num = result.acc_num;
            returnbody.type = usertype;
            return returnbody; // Return the response object
          } else {
            return { err: "Invalid User" };
          }
        } else {
          return { err: "Invalid Password" };
        }
      });
    } else {
      return { err: "User not found" }; // Handle case where user is not found
    }
  });
};

module.exports.adminLogin = (username, password) => {
  return admin.findOne({ username: username }).then((result) => {
    if (result) {
      return BCRYPT.compare(password, result.password).then((valid) => {
        if (valid) {
          const usertype = result.usertype;
          const returnbody = {};
          console.log(usertype);
          if (usertype === "admin") {
            returnbody.token = makeToken({
              Name: result.fname + " " + result.lastname,
              isAdmin: result.usertype,
            });
            returnbody.name = result.fname + " " + result.lastname;
            returnbody.type = result.usertype;
            return returnbody;
          } else {
            return { err: "Invalid User Type" };
          }
        } else {
          return { err: "Invalid Password" };
        }
      });
    } else {
      return { err: "User not found" };
    }
  });
};

// BILLING MANAGER LOGIN TOKEN
module.exports.billMngrLogin = (username, password) => {
  return billmngr.findOne({ username: username }).then((result) => {
    if (result) {
      return BCRYPT.compare(password, result.password).then((valid) => {
        if (valid) {
          const usertype = result.usertype;
          const returnbody = {};
          console.log(usertype);
          if (usertype === "billmngr") {
            returnbody.token = makeToken({
              Name: result.fname + " " + result.lastname,
              isAdmin: result.usertype,
            });
            returnbody.name = result.fname + " " + result.lastname;
            returnbody.type = result.usertype;
            return returnbody;
          } else {
            return { err: "Invalid User Type" };
          }
        } else {
          return { err: "Invalid Password" };
        }
      });
    } else {
      return { err: "User not found" };
    }
  });
};
