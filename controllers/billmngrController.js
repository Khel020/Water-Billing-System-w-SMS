const biller = require("../models/BillMngr");
const exp = require("express");
const mng = require("mongoose");
const env = require("dotenv").config();
const route = exp.Router();
const bcrypt = require("bcrypt");
const pnv = process.env;

let passHash = (password) => {
  return bcrypt.hashSync(password, parseInt(pnv.SALT));
};
exports.CreateBillingMngr = async (data) => {
  const account = await biller.findOne({
    $or: [{ username: data.username }, { email: data.email }],
  });
  if (account) {
    const errors = {};
    if (account.acc_name === data.acc_name) {
      errors.acc_name = "Account Name is already taken.";
    }
    if (account.email === data.email) {
      errors.email = "Email is already taken.";
    }
    return { success: false, errors };
  } else {
    let newBillMngr = new biller();
    newBillMngr.username = data.username;
    newBillMngr.password = passHash(data.password);
    newBillMngr.contact = data.contact;
    newBillMngr.fname = data.fname;
    newBillMngr.lastname = data.lastname;
    newBillMngr.email = data.email;
    newBillMngr.address = data.address;

    return newBillMngr
      .save()
      .then((result) => {
        if (result) {
          return { message: "Admin already saved" };
        }
      })
      .catch((err) => {
        return { error: "There is an error" + err };
      });
  }
};
