const biller = require("../models/BillMngr");
const bills = require("../models/BillsModel");
const Rate = require("../models/ratesModel");
const Client = require("../models/clientModel");
const Payment = require("../models/payments");
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
      newBillMngr.name = `${data.fname} ${data.lastname}`;
      newBillMngr.email = data.email;
      newBillMngr.address = data.address;
      newBillMngr.dateCreated = new Date();

      return newBillMngr
        .save()
        .then((result) => {
          if (result) {
            return { success: true, message: "New Biller already saved" };
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
        results.push({
          error: `Client with account number ${billData.acc_num} and name ${billData.accountName} does not exist.`,
        });
        continue; // Skip to the next bill
      }

      let previousReading = 0;

      // Find the latest bill of the client, if exists
      const latestBill = await bills
        .findOne({ acc_num: billData.acc_num })
        .sort({ reading_date: -1 })
        .exec();

      if (latestBill) {
        // Use the present reading of the latest bill as the previous reading for the new bill
        previousReading = latestBill.present_read || 0;
      } else if (clientExists.initial_read) {
        // If no previous bill exists but the client has an initial reading, use it
        previousReading = clientExists.initial_read;
      }

      // Calculate consumption by subtracting previous reading from the present reading
      const consumption = billData.present_read - previousReading;

      // Ensure consumption is non-negative; otherwise, skip this bill
      if (consumption < 0) {
        results.push({
          error: `Invalid consumption: Present reading (${billData.present_read}) is less than previous reading (${previousReading}).`,
        });
        continue;
      }

      // Find the rate for the given category and consumption range
      const rate = await Rate.findOne({
        category: billData.category,
        minConsumption: { $lte: consumption },
        maxConsumption: { $gte: consumption },
      });

      if (!rate) {
        results.push({
          error: `No rate found for category ${billData.category} and consumption ${consumption}.`,
        });
        continue; // Skip to the next bill
      }

      const dueDate = calculateDueDate(billData.reading_date);
      const disconnect_Date = calculateDC(dueDate);
      let totalAmount = consumption * rate.rate;
      let penalty = 0;

      // Calculate penalty if due date has passed
      const currentDate = new Date();
      if (currentDate > dueDate) {
        penalty = calculatePenalty(totalAmount);
        totalAmount += penalty;
      }

      // Consider any advance payment by the client
      let totalAdvancePayment = clientExists.advancePayment || 0;

      // Deduct advance payment from the total amount
      if (totalAdvancePayment > 0) {
        if (totalAdvancePayment >= totalAmount) {
          totalAdvancePayment -= totalAmount; // Use the advance payment to cover the total amount
          totalAmount = 0; // No remaining balance to be paid
        } else {
          totalAmount -= totalAdvancePayment; // Subtract the advance payment from the total amount
          totalAdvancePayment = 0; // Advance payment is fully used
        }
        // Update the client's advance payment in the database
        await Client.updateOne(
          { acc_num: billData.acc_num },
          { advancePayment: totalAdvancePayment }
        );
      }

      // Create a new bill object with the calculated consumption
      const newBill = new bills({
        acc_num: billData.acc_num,
        reading_date: billData.reading_date,
        due_date: dueDate,
        accountName: billData.accountName,
        consumption: consumption, // Set calculated consumption
        dc_date: disconnect_Date,
        present_read: billData.present_read,
        prev_read: previousReading, // Set the previous reading
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
    }

    return { message: "All bills added successfully", data: results };
  } catch (err) {
    return { error: `There was an error: ${err.message}` };
  }
};

function calculateDueDate(readingDate) {
  const dueDate = new Date(readingDate);
  dueDate.setDate(dueDate.getDate() + 16);
  return dueDate;
}
function calculateDC(DUE_DATE) {
  const DC_DATE = new Date(DUE_DATE);
  DC_DATE.setDate(DC_DATE.getDate() + 7);
  return DC_DATE;
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
module.exports.findBillsPayment = async (data) => {
  try {
    // Hanapin ang client base sa account number
    const client = await Client.findOne({ acc_num: data.acc_number }).exec();

    if (client) {
      // Retrieve bills associated with the client
      const consumerBills = await bills
        .find({ acc_num: client.acc_num })
        .exec();

      // Calculate total amount and penalty charge
      const totalBill = consumerBills
        .reduce((sum, bill) => sum + bill.totalAmount, 0)
        .toFixed(2);
      const totalPenalty = consumerBills
        .reduce((sum, bill) => sum + (bill.p_charge || 0), 0)
        .toFixed(2);

      console.log("Welcome:", client.accountName);
      console.log("ADDRESS", client.c_address);
      console.log("Bills Number:", consumerBills);
      console.log("Total Bill:", totalBill);
      console.log("Total Penalty:", totalPenalty);

      // I-return ang bills at kabuuang halaga sa frontend
      return {
        consumerBills,
        totalBill,
        totalPenalty,
        consumerName: client.accountName,
        address: client.c_address,
      };
    } else {
      console.log("Client not found.");
      return {
        consumerBills: [],
        totalBill: 0,
        totalPenalty: 0,
        consumerName: null,
        address: null,
      };
    }
  } catch (error) {
    console.error("Error finding bills payment:", error);
    return {
      consumerBills: [],
      totalBill: 0,
      totalPenalty: 0,
      consumerName: null,
      address: null,
    };
  }
};
module.exports.calculateChange = async (data) => {
  try {
    // Validate input data
    if (!data.acc_num || !data.paymentAmount) {
      return { success: false, message: "Invalid input data" };
    }
    // Find the client by account number
    const client = await Client.findOne({ acc_num: data.acc_num }).exec();

    if (!client) {
      return { success: false, message: "Client not found" };
    }

    const newBalance = client.totalBalance - data.paymentAmount;
    let change = 0;

    if (newBalance < 0) {
      change = Math.abs(newBalance); // Calculate the change amount
    }
    return { success: true, change };
  } catch (error) {
    console.error("Error calculating change:", error.message);
    return { success: false, message: "Error calculating change" };
  }
};

module.exports.AddPayment = async (data) => {
  const results = [];
  try {
    const newPayment = new Payment({
      acc_num: data.acc_num,
      accountName: data.acc_name,
      address: data.address,
      paid: data.paymentAmount,
      balance: 0,
      change: data.totalChange,
    });

    // Save the new payment and add the result to the results array
    const paymentResult = await newPayment.save();
    results.push(paymentResult);

    const clientToUpdate = await Client.findOneAndUpdate(
      { acc_num: data.acc_num },
      {
        totalBalance: 0,
        advancePayment: data.advTotalAmount,
      },
      { new: true }
    ).exec();

    // Check if the client was found and updated
    if (!clientToUpdate) {
      // If not found, return early with a client not found message
      return { success: false, message: "Client not found" };
    }

    // Update bills related to the client if the client update was successful
    await bills
      .updateMany(
        { acc_num: clientToUpdate.acc_num },
        {
          totalAmount: 0,
          payment_status: "Paid",
        }
      )
      .exec();

    return {
      success: true,
      message: "Payment processed successfully",
      data: results,
    };
  } catch (error) {
    // Log the error for debugging purposes and return a failure response
    console.error("Error processing payment:", error);
    return {
      success: false,
      message: "Error processing payment",
      error: error.message,
    };
  }
};
