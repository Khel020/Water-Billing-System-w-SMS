const biller = require("../models/BillMngr");
const bills = require("../models/BillsModel");
const Rate = require("../models/ratesModel");
const Client = require("../models/clientModel");
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
  const results = [];

  try {
    for (const billData of data) {
      // Validate if the client exists with the given acc_num and accountName
      const clientExists = await Client.findOne({
        acc_num: billData.acc_num,
        accountName: billData.accountName,
      });

      if (!clientExists) {
        // If the client does not exist, skip adding the bill and log an error message
        results.push({
          error: `Client with account number ${billData.acc_num} and name ${billData.accountName} does not exist.`,
        });
        continue; // Skip to the next bill
      }

      // Find the rate for the given category and consumption range
      const rate = await Rate.findOne({
        category: billData.category,
        minConsumption: { $lte: billData.consumption },
        maxConsumption: { $gte: billData.consumption },
      });

      if (!rate) {
        // If no rate is found, skip adding the bill and log an error message
        results.push({
          error: `No rate found for category ${billData.category} and consumption ${billData.consumption}.`,
        });
        continue; // Skip to the next bill
      }

      const dueDate = calculateDueDate(billData.reading_date);
      let totalAmount = billData.consumption * rate.rate;
      let penalty = 0;

      const currentDate = new Date();
      if (currentDate > dueDate) {
        penalty = calculatePenalty(totalAmount);
        totalAmount += penalty;
      }

      // Create a new bill object
      const newBill = new bills({
        acc_num: billData.acc_num,
        reading_date: billData.reading_date,
        due_date: billData.due_date,
        accountName: billData.accountName,
        consumption: billData.consumption,
        dc_date: billData.dc_date,
        present_read: billData.present_read,
        category: billData.category,
        totalAmount: totalAmount,
        rate: rate.rate,
        p_charge: penalty,
        others: billData.others,
        remarks: billData.remarks,
      });

      // Save the bill to the database
      const result = await newBill.save();
      results.push(result); // Store the result for each bill
      return { message: "All bills added successfully", data: results };
    }
    return { message: "Not Successfull", data: results };
  } catch (err) {
    return { error: "There was an error: " + err };
  }
};
function calculateDueDate(readingDate) {
  const dueDate = new Date(readingDate);
  dueDate.setDate(dueDate.getDate() + 30); // Example: Set due date 30 days after the reading date
  return dueDate;
}
function calculatePenalty(totalAmount) {
  const penaltyRate = 0.1; // Example: 10% penalty
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
