const exp = require("express");
const mng = require("mongoose");
const jwt = require("jsonwebtoken");
const env = require("dotenv").config();
const route = exp.Router();
const BCRYPT = require("bcrypt");
const pnv = process.env;

module.exports.tokenCheck = (req, res, next) => {
  if (req.headers.authorization === undefined) {
    res.json({ error: "Invalid Credentials" });
    return false;
  }

  const authHead = req.headers.authorization;
  const token = authHead.split(" ");

  if (token[0] !== "Bearer") {
    res.json({ error: "Invalid Credentials" });
    return false;
  }

  try {
    req.user = jwt.verify(token[1], pnv.TOKEN_SECRET);

    // Checking if the token is expired
    if (Math.floor(Date.now() / 1000) >= req.user.expTKN) {
      res.json({ error: "Credentials Expired, Please Login" });
      return false;
    }
    return true;
  } catch (error) {
    res.status(401).json({ error: "Invalid Token" });
    return false;
  }
};

module.exports.isAdmin = (req, res) => {
  if (!module.exports.tokenCheck(req, res)) {
    return false;
  }
  if (req.user.type == "admin") {
    return true;
  } else {
    return false;
  }
};

module.exports.isUser = (req, res) => {
  if (!module.exports.tokenCheck(req, res)) {
    return false;
  }
  if (req.user.type == "users") {
    return true;
  } else {
    return false;
  }
};

module.exports.isBiller = (req, res) => {
  if (!module.exports.tokenCheck(req, res)) {
    return false;
  }
  if (req.user.type == "billmngr") {
    return true;
  } else {
    return false;
  }
};

module.exports.BillerOnly = (req, res, next) => {
  if (!module.exports.isBiller(req, res)) {
    res.send({ Message: "Forbiden Action" });
    return;
  }
  next();
};
module.exports.UserOnly = (req, res, next) => {
  if (!module.exports.isUser(req, res)) {
    res.send({ Message: "Forbiden Action" });
    return;
  }
  next;
};
module.exports.AdminOnly = (req, res, next) => {
  if (!module.exports.isAdmin(req, res)) {
    res.send({ Message: "Forbiden Action" });
    return;
  }
  next();
};

// module.exports.authorizeRoles = (...roles) => {
//   return (req, res, next) => {
//     if (!roles.includes(req.user.usertype)) {
//       return res.status(403).json({ error: "Forbidden" });
//     }
//     next();
//   };
// };
