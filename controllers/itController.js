const IT_ACCOUNT = require("../models/IT_Model.js");
const AD_ACCOUNT = require("../models/adminModel.js");
const CASH_ACCOUNT = require("../models/Cashiers.js");
const UPLOAD_ACCOUNT = require("../models/dataEntry.js");
const CS_ACCOUNT = require("../models/CS_OfficerModel.js");
const exp = require("express");
const mng = require("mongoose");
const env = require("dotenv").config();
const route = exp.Router();
const bcrypt = require("bcrypt");
const pnv = process.env;

//Upload Bulk Consumers In System
let passHash = (password) => {
  console.log("Password", password);
  return bcrypt.hashSync(password, parseInt(pnv.SALT));
};
//TODO: FOR USERMANAGEMENT ACCOUNTS
exports.CreateITAccount = async (data) => {
  try {
    const existingAccount = await IT_ACCOUNT.findOne({
      $or: [{ username: data.username }, { email: data.email }],
    });

    if (existingAccount) {
      const errors = {};
      if (existingAccount.username === data.username) {
        errors.username = "Username is already taken.";
      }
      if (existingAccount.email === data.email) {
        errors.email = "Email is already taken.";
      }
      return { success: false, errors };
    }

    // Create a new IT account
    const newITAccount = new IT_ACCOUNT();
    newITAccount.username = data.username;
    newITAccount.password = passHash(data.password);
    newITAccount.contact = data.contact;
    newITAccount.name = `${data.fname} ${data.lastname}`;
    newITAccount.email = data.email;
    newITAccount.f_name = data.fname;
    newITAccount.last_name = data.lastname;
    newITAccount.address = data.address;
    newITAccount.dateCreated = new Date();

    const result = await newITAccount.save();
    return {
      success: true,
      message: "Account already saved.",
      data: result,
    };
  } catch (err) {
    console.error("Error creating IT account:", err);
    return {
      success: false,
      error: "An error occurred while creating the IT account.",
      details: err.message,
    };
  }
};
exports.CreateAdmin = async (data) => {
  const account = await AD_ACCOUNT.findOne({
    $or: [{ username: data.username }, { email: data.email }],
  });
  if (account) {
    const errors = {};
    if (account.username === data.username) {
      errors.acc_name = "Username Name is already taken.";
    }
    if (account.email === data.email) {
      errors.email = "Email is already taken.";
    }
    return { success: false, errors };
  } else {
    let newAdmin = new AD_ACCOUNT();
    newAdmin.username = data.username;
    newAdmin.password = passHash(data.password);
    newAdmin.contact = data.contact;
    newAdmin.name = `${data.fname} ${data.lastname}`;
    newAdmin.email = data.email;
    newAdmin.address = data.address;
    newAdmin.dateCreated = new Date();
    return newAdmin
      .save()
      .then((result) => {
        if (result) {
          return { success: true, message: "Account already saved" };
        }
      })
      .catch((err) => {
        return { success: false, error: "There is an error" + err };
      });
  }
};
exports.CreateCashier = async (data) => {
  try {
    const account = await CASH_ACCOUNT.findOne({
      $or: [{ username: data.username }, { email: data.email }],
    });
    if (account) {
      const errors = {};
      if (account.username === data.username) {
        errors.acc_name = "Username is already taken.";
      }
      if (account.email === data.email) {
        errors.email = "Email is already taken.";
      }
      return { success: false, errors };
    } else {
      let newCashier = new CASH_ACCOUNT();
      newCashier.username = data.username;
      newCashier.password = passHash(data.password);
      newCashier.contact = data.contact;
      newCashier.name = `${data.fname} ${data.lastname}`;
      newCashier.email = data.email;
      newCashier.address = data.address;
      newCashier.dateCreated = new Date();

      return newCashier
        .save()
        .then((result) => {
          if (result) {
            return { success: true, message: "Account already saved" };
          }
        })
        .catch((err) => {
          return { success: false, error: "There is an error" + err };
        });
    }
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "An error occurred while creating the account.",
    };
  }
};
exports.CreateDataEntry = async (data) => {
  const account = await UPLOAD_ACCOUNT.findOne({
    $or: [
      { username: data.username },
      { email: data.email },
      { contact: data.contact },
    ],
  });
  console.log("account", account);
  if (account) {
    const errors = {};
    if (account.username === data.username) {
      errors.acc_name = "Username Name is already taken.";
    }
    if (account.email === data.email) {
      errors.email = "Email is already taken.";
    }
    if (account.contact === data.contact) {
      errors.acc_name = "Contact is already taken.";
    }
    return { success: false, errors };
  } else {
    let newUploader = new UPLOAD_ACCOUNT();
    newUploader.username = data.username;
    newUploader.password = passHash(data.password);
    newUploader.contact = data.contact;
    newUploader.name = `${data.fname} ${data.lastname}`;
    newUploader.email = data.email;
    newUploader.address = data.address;
    newUploader.dateCreated = new Date();
    return newUploader
      .save()
      .then((result) => {
        if (result) {
          return { success: true, message: "Account already saved" };
        }
      })
      .catch((err) => {
        return { success: false, error: "There is an error" + err };
      });
  }
};
exports.CreateCS_Officer = async (data) => {
  console.log("Data", data);
  const account = await CS_ACCOUNT.findOne({
    $or: [
      { username: data.username },
      { email: data.email },
      { contact: data.contact },
    ],
  });
  if (account) {
    const errors = {};
    if (account.username === data.username) {
      errors.acc_name = "Username Name is already taken.";
    }
    if (account.email === data.email) {
      errors.email = "Email is already taken.";
    }
    if (account.contact === data.contact) {
      errors.acc_name = "Contact is already taken.";
    }

    return { success: false, errors };
  } else {
    let newCS_Officer = new CS_ACCOUNT();
    newCS_Officer.username = data.username;
    newCS_Officer.password = passHash(data.password);
    newCS_Officer.contact = data.contact;
    newCS_Officer.name = `${data.fname} ${data.lastname}`;
    newCS_Officer.f_name = data.fname;
    newCS_Officer.last_name = data.lastname;
    newCS_Officer.email = data.email;
    newCS_Officer.address = data.address;
    newCS_Officer.dateCreated = new Date();
    return newCS_Officer
      .save()
      .then((result) => {
        if (result) {
          return { success: true, message: "Account already saved" };
        }
      })
      .catch((err) => {
        return { success: false, error: "There is an error" + err };
      });
  }
};
