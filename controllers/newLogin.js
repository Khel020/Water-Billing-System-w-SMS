const admin = require("../models/adminModel");
const user = require("../models/usersModel");
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
            returnbody.accountName = result.acc_name;
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
// module.exports.login = (username, password, returnbody) => {
//   return admin.findOne({ $or: [{ username: username }] }).then((result) => {
//     if (result) {
//       return bcrypt.compare(password, result.password).then((valid) => {
//         if (valid) {
//           const usertype = user.usertype;
//           console.log(usertype);
//           if (usertype === "admin") {
//             returnbody.token = makeToken({
//               acc_num: result.acc_num,
//               accoutName: result.acc_name,
//               isUser: result.usertype,
//             });
//             returnbody.accountName = result.acc_name;
//             returnbody.type = usertype;
//           }

//           return returnbody;
//         }
//       });
//     }
//   });
// };
