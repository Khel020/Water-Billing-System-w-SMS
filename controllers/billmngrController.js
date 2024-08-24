const biller = require("../models/BillMngr");
const bills = require("../models/BillsModel");
const Rate = require("../models/ratesModel");
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
  try {
    const account = await biller.findOne({
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
            return { message: "New Biller already saved" };
          }
        })
        .catch((err) => {
          return { error: "There is an error" + err };
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

module.exports.AddBill = async (data) => {
  const rate = await Rate.findOne({
    category: data.category,
    minConsumption: { $lte: data.consumption },
    maxConsumption: { $gte: data.consumption },
  });
  const dueDate = calculateDueDate(data.reading_date);
  let totalAmount = data.consumption * rate.rate;
  let penalty = 0;

  const currentDate = new Date();
  if (currentDate > dueDate) {
    penalty = calculatePenalty(totalAmount); // Calculate penalty
    totalAmount += penalty;
  }
  const billdata = new bills();
  billdata.acc_num = data.acc_num;
  billdata.reading_date = data.reading_date;
  billdata.due_date = data.due_date;
  billdata.accountName = data.accountName;
  billdata.consumption = data.consumption;
  billdata.dc_date = data.dc_date;
  billdata.category = data.category;
  billdata.totalAmount = totalAmount;
  billdata.rate = rate.rate;
  billdata.p_charge = penalty;
  billdata.others = data.others;
  billdata.remarks = data.remarks;

  return billdata
    .save()
    .then((result) => {
      if (result) {
        return { message: "Add Bill Successfull" };
      }
    })
    .catch((err) => {
      return { error: "There is an error" + err };
    });
};

function calculateDueDate(readingDate) {
  const dueDate = new Date(readingDate);
  dueDate.setDate(dueDate.getDate() + 30);
  return dueDate;
}

function calculatePenalty(totalAmount) {
  const penaltyRate = 0.1; //Edit if iba ang ratings for penalty
  return totalAmount * penaltyRate;
}

module.exports.GetAllBills = async (data) => {
  return await bills
    .find({})
    .then((result) => {
      if (result) {
        return result;
      }
    })
    .catch((err) => {
      return { error: "There is an error" };
    });
};

module.exports.GetBillsByAccNum = async (data) => {
  try {
    const results = await bills.find({ acc_num: data.acc_number });
    if (results) {
      return results;
    } else {
      return { error: "No bills found with this account number" };
    }
  } catch (err) {
    return { error: "There is an error" };
  }
};
module.exports.GetBillsByBillNum = async (data) => {
  try {
    const results = await bills.find({ billNumber: data.billNumber });
    if (results) {
      return results;
    } else {
      return { error: "No bills found with this account number" };
    }
  } catch (err) {
    return { error: "There is an error" };
  }
};
