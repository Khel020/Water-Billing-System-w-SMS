const Client = require("../models/clientModel.js");
const bills = require("../models/BillsModel.js");
const UploadHistory = require("../models/uploadModel.js");
const exp = require("express");
const mng = require("mongoose");
const env = require("dotenv").config();
const route = exp.Router();
const bcrypt = require("bcrypt");
const pnv = process.env;

module.exports.UploadBills = async (data) => {
  const errors = []; // Array to store error messages

  console.log("Bills:", data.bills);
  console.log("Zone:", data.zone);

  try {
    // Validate the input data
    if (!Array.isArray(data.bills)) {
      return { error: "Data must be an array of bills." };
    }

    // First pass: Validate all bills before saving
    for (const billData of data.bills) {
      const validationError = await validateSingleBill(billData); // Validate each bill individually
      if (validationError) {
        errors.push(validationError); // Collect validation errors
      }
    }

    // If there are errors, return them and do not save any bills
    if (errors.length > 0) {
      return {
        success: false,
        message: "There were validation errors in some bills.",
        errors: errors,
      };
    }

    // Second pass: Process and save all bills if validation passed
    const results = [];
    for (const billData of data.bills) {
      const result = await processSingleBill(billData);
      results.push(result.bill); // If successful, add to the results
    }

    // After successful processing of all bills, save to uploadHistory
    const uploadHistoryEntry = new UploadHistory({
      date: new Date(),
      consumers: data.bills.length,
      zone: data.zone,
      status: "success",
    });
    await uploadHistoryEntry.save();

    return {
      success: true,
      message: "Batch processing completed.",
      data: results,
    };
  } catch (err) {
    console.error("Batch processing error:", err); // Log error for debugging
    return { error: `There was an error processing the batch: ${err.message}` };
  }
};

// Function to validate a single bill
async function validateSingleBill(billData) {
  // Array to store missing fields
  const missingFields = [];

  // Check for required fields
  if (!billData.acc_num) missingFields.push("acc_num");
  if (!billData.accountName) missingFields.push("accountName");
  if (!billData.due_date) missingFields.push("due_date");
  if (!billData.present_read) missingFields.push("present_read");
  if (
    billData.prev_read === undefined ||
    billData.prev_read === null ||
    billData.prev_read === ""
  ) {
    missingFields.push("prev_read");
  }
  if (!billData.totalDue) missingFields.push("totalDue");
  if (!billData.reading_date) missingFields.push("reading_date");
  if (!billData.payment_status) missingFields.push("payment_status");
  if (!billData.consumption) missingFields.push("consumption");
  if (!billData.category) missingFields.push("category");
  if (!billData.currentBill) missingFields.push("currentBill");

  // If any required fields are missing, return an error with the list of missing fields
  if (missingFields.length > 0) {
    return `Account ${
      billData.acc_num || "Unknown"
    }: Missing required fields: ${missingFields.join(", ")}.`;
  }

  // Check if client exists
  const clientExists = await Client.findOne({
    acc_num: billData.acc_num,
    accountName: billData.accountName,
  });

  if (!clientExists) {
    return `Client with account number ${billData.acc_num} and name ${billData.accountName} does not exist.`;
  }
  if (clientExists.status == "Pending") {
    return `Client with account number ${billData.acc_num} and name ${billData.accountName} Not yet activated`;
  }

  // Check if a bill with the same account number, reading date, and due date already exists (to prevent duplicates)
  const billExists = await bills.findOne({
    acc_num: billData.acc_num,
    reading_date: new Date(billData.reading_date),
    due_date: new Date(billData.due_date),
  });

  if (billExists) {
    return `A bill for account number ${billData.acc_num} with the same reading date and due date already exists.`;
  }

  // No validation errors
  return null;
}
async function processSingleBill(billData) {
  try {
    const currentDate = new Date();
    const dueDate = new Date(billData.due_date);

    // Calculate consumption
    const consumption = billData.present_read - billData.prev_read || 0;

    // Create a new bill entry
    const newBill = new bills({
      acc_num: billData.acc_num,
      reading_date: new Date(billData.reading_date),
      due_date: dueDate,
      accountName: billData.accountName,
      present_read: billData.present_read,
      prev_read: billData.prev_read || 0,
      totalDue: billData.totalDue,
      arrears: billData.arrears || 0,
      payment_status: "Unpaid",
      remarks: billData.remarks || "",
      consumption: consumption,
      category: billData.category || "",
      currentBill: billData.currentBill,
    });

    const savedBill = await newBill.save();

    // Update client details
    const clientExists = await Client.findOne({ acc_num: billData.acc_num });

    if (clientExists) {
      const newTotalBalance =
        parseFloat(clientExists.totalBalance || 0) + billData.totalDue;

      await Client.findOneAndUpdate(
        { acc_num: billData.acc_num },
        {
          totalBalance: newTotalBalance,
          last_billDate: billData.reading_date,
          last_billStatus: "Unpaid",
          latest_billDue: billData.due_date,
        },
        { new: true }
      );
    }

    // Check for 3 unpaid bills
    const unpaidBillsCount = await bills.countDocuments({
      acc_num: billData.acc_num,
      payment_status: "Unpaid",
    });

    // If 3+ unpaid bills, update status to "For Disconnection"
    if (unpaidBillsCount >= 3) {
      await Client.findOneAndUpdate(
        { acc_num: billData.acc_num },
        { disconnection_status: "For Disconnection", status: "Inactive" },
        { new: true }
      );
    }

    return {
      success: true,
      bill: savedBill,
    };
  } catch (err) {
    console.error(
      `Error processing bill for account ${billData.acc_num}:`,
      err
    );
    return {
      error: `Error processing bill for account ${billData.acc_num}: ${err.message}`,
    };
  }
}

module.exports.GetUploadHistory = async () => {
  return await UploadHistory.find({})
    .then((result) => {
      if (result) {
        return result;
      }
    })
    .catch((err) => {
      return { error: "There is an error" };
    });
};
