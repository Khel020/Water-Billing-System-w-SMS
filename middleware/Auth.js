const express = require("express");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const dotenv = require("dotenv").config();
const bcrypt = require("bcrypt");

const path = require("path");
const route = express.Router();
const pnv = process.env;

// Middleware and authentication logic (same as earlier)

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
  if (req.user.type == "cashier") {
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

module.exports.getUsernameFromToken = (req, res, next) => {
  // Check if authorization header is present
  if (req.headers.authorization === undefined) {
    return res.status(401).json({ error: "Invalid Credentials" });
  }

  const authHead = req.headers.authorization;
  const token = authHead.split(" ");

  // Check if the token type is Bearer
  if (token[0] !== "Bearer") {
    return res.status(401).json({ error: "Invalid Credentials" });
  }

  try {
    const decodedToken = jwt.verify(token[1], pnv.TOKEN_SECRET);

    console.log("Token", decodedToken);
    // Checking if the token is expired
    if (Math.floor(Date.now() / 1000) >= decodedToken.exp) {
      // Use decodedToken.exp
      return res
        .status(401)
        .json({ error: "Credentials Expired, Please Login" });
    }

    // If the token is valid, store the username in req object
    req.username = decodedToken.accountName; // Store username
    req.role = decodedToken.type;
    console.log("USERNAME", req.username); // Optional logging

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error("Token verification failed:", error);
    return res.status(401).json({ error: "Invalid Token" });
  }
};
