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
    console.log("Token", req.user);

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
module.exports.Validation = (req, res) => {
  console.log("Request Headers:", req.headers);
  const authHeader = req.headers.authorization;

  // Check if authorization header exists
  if (!authHeader) {
    return res
      .status(401)
      .json({ success: false, error: "Missing Authorization Header" });
  }

  const [tokenType, tokenValue] = authHeader.split(" ");

  // Validate token type
  if (tokenType !== "Bearer" || !tokenValue) {
    return res
      .status(401)
      .json({ success: false, error: "Invalid Token Format" });
  }

  try {
    // Verify token
    req.user = jwt.verify(tokenValue, pnv.TOKEN_SECRET);

    // Check if token is expired
    const isExpired = Math.floor(Date.now() / 1000) >= req.user.expTKN;
    if (isExpired) {
      return res
        .status(401)
        .json({ success: false, error: "Token Expired, Please Login Again" });
    }

    // Validate user role
    const validRoles = ["admin", "cashier", "users", "CS_Officer"];
    if (!validRoles.includes(req.user.type)) {
      return res
        .status(403)
        .json({ success: false, error: "Unauthorized Role" });
    }

    // Token is valid
    return res.json({
      success: true,
      message: "Valid Token",
      usertype: req.user.type,
    });
  } catch (error) {
    return res.status(401).json({ success: false, error: "Invalid Token" });
  }
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
