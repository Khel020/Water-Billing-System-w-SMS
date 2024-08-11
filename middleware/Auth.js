const exp = require("express");
const mng = require("mongoose");
const jwt = require("jsonwebtoken");
const env = require("dotenv").config();
const route = exp.Router();
const BCRYPT = require("bcrypt");
const pnv = process.env;

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

module.exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.usertype)) {
      return res.status(403).json({ error: "Forbidden" });
    }
    next();
  };
};
