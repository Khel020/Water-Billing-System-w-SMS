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

      // Assigning Amount to previous
      if (latestBill) {
        previousReading = latestBill.present_read || 0;
      } else if (clientExists.initial_read) {
        previousReading = clientExists.initial_read;
      }

      // Calculate consumption
      const consumption = billData.present_read - previousReading;

      // Ensure consumption is non-negative
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

      const readingDate = new Date(billData.reading_date);
      const dueDate = calculateDueDate(readingDate);
      const disconnect_Date = calculateDC(dueDate);
      let currentBillAmount = consumption * rate.rate;
      let penalty = 0;
      let daysPastDue = 0;

      const currentDate = new Date();
      if (currentDate > dueDate) {
        daysPastDue = Math.floor(
          (currentDate - dueDate) / (1000 * 60 * 60 * 24)
        );
        penalty = calculateDailyPenalty(currentBillAmount, daysPastDue);
        currentBillAmount += penalty;
      }

      // Check if there are any unpaid bills before the current bill date
      const latestUnpaidBill = await bills
        .findOne({
          acc_num: billData.acc_num,
          reading_date: { $lt: readingDate }, // Only consider bills before the current bill date
          payment_status: "Unpaid",
        })
        .sort({ reading_date: -1 });

      let arrears = 0;
      if (latestUnpaidBill) {
        arrears = latestUnpaidBill.totalDue;
      }

      // Check if client has installation and connection fees
      let additionalFees = 0;
      if (clientExists.totalBalance > 0 && !latestBill) {
        // If the client has fees but no previous bill, add these fees to the totalDue
        additionalFees = clientExists.totalBalance;
      }

      // Calculate the total due amount
      const totalDue = currentBillAmount + arrears + additionalFees;

      // Handle advance payment
      let remainingAdvancePayment = clientExists.advancePayment || 0;
      let newTotalBalance = totalDue;

      if (remainingAdvancePayment > 0) {
        if (remainingAdvancePayment >= totalDue) {
          remainingAdvancePayment -= totalDue;
          newTotalBalance = 0; // Entire bill is covered by advance payment
        } else {
          newTotalBalance = totalDue - remainingAdvancePayment;
          remainingAdvancePayment = 0; // Advance payment is fully used
        }
      }

      // Create a new bill object with the calculated values
      const newBill = new bills({
        acc_num: billData.acc_num,
        reading_date: readingDate,
        due_date: dueDate,
        accountName: billData.accountName,
        consumption: consumption,
        dc_date: disconnect_Date,
        present_read: billData.present_read,
        prev_read: previousReading,
        category: billData.category,
        currentBill: currentBillAmount,
        arrears: arrears,
        rate: rate.rate,
        totalDue: newTotalBalance,
        p_charge: penalty,
        dayPastDueDate: daysPastDue,
        others: billData.others,
        remarks: billData.remarks,
        payment_status: newTotalBalance === 0 ? "Paid" : "Unpaid",
      });

      // Save the bill to the database
      const result = await newBill.save();
      results.push(result); // Store the result for each bill

      // Update the client's total balance and remaining advance payment
      await Client.findOneAndUpdate(
        { acc_num: billData.acc_num },
        {
          totalBalance: newTotalBalance,
          advancePayment: remainingAdvancePayment,
        }
      );
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

function calculateDailyPenalty(totalAmount, daysPastDue) {
  const dailyPenaltyRate = 0.01; // Example: 1% daily penalty
  return totalAmount * dailyPenaltyRate * daysPastDue;
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
    const client = await Client.findOne({ acc_num: data.acc_number }).exec();

    if (client) {
      const consumerBills = await bills
        .find({ acc_num: client.acc_num })
        .exec();

      // If no bills exist, return the totalBalance from the client
      if (consumerBills.length === 0) {
        return {
          totalAmountDue: client.totalBalance,
          totalPenalty: 0,
          consumerName: client.accountName,
          address: client.c_address,
        };
      }

      const latestBill = await bills
        .findOne({ acc_num: client.acc_num })
        .sort({ reading_date: -1 })
        .exec();

      // Calculate totalAmountDue based on the latest bill
      let billAmount = latestBill.currentBill;
      let arrears = latestBill.arrears;
      let totalAmountDue = latestBill.totalDue;
      let totalPenalty = latestBill.p_charge;
      // Calculate total penalties from all unpaid bills

      return {
        arrears,
        billAmount,
        totalAmountDue,
        totalPenalty,
        consumerName: client.accountName,
        address: client.c_address,
      };
    } else {
      console.log("Client not found.");
      return {
        consumerBills: [],
        totalAmountDue: 0,
        totalPenalty: 0,
        consumerName: null,
        address: null,
      };
    }
  } catch (error) {
    console.error("Error finding bills payment:", error);
    return {
      consumerBills: [],
      totalAmountDue: 0,
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
      paymentDate: data.p_date,
      tendered: data.paymentAmount,
      amountDue: data.balance,
      change: data.totalChange,
      balance: 0.0,
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
          totalDue: 0,
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
module.exports.GetPaymentsAccNum = async (acc_num) => {
  try {
    const result = await Payment.find({ acc_num: acc_num }).exec();
    return result;
  } catch (error) {
    console.error("Error fetching payments:", error);
    throw new Error("Error fetching payments");
  }
};
