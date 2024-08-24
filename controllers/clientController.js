const client = require("../models/clientModel.js");
const bill = require("../models/BillsModel.js");
const exp = require("express");
const mng = require("mongoose");
const env = require("dotenv").config();
const route = exp.Router();
const bcrypt = require("bcrypt");
const pnv = process.env;

//TODO: Creating Client/ Add Client
exports.CreateClient = async (data) => {
  try {
    // Create a new client object
    let NewClient = new client({
      acc_num: data.acc_num,
      accountName: data.accountName,
      meter_num: data.meter_num,
      contact: data.contact,
      status: data.status,
      c_address: data.address,
      client_type: data.client_type,
      email: data.email,
      install_date: data.install_date,
    });

    // Save the new client to the database
    const result = await NewClient.save();

    // Return a success message
    return { message: "Client successfully created", client: result };
  } catch (err) {
    // Log and return error message
    console.error(err);
    return { error: "Failed to create client" };
  }
};
//TODO: Get all the client
exports.GetAllClients = async () => {
  return await client
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
//TODO: Update Using Acc Num
exports.UpdateClientByAccNum = async (data) => {
  const clientID = data._id;
  const updates = {
    accountName: data.accountName,
    meter_num: data.meter_num,
    contact: data.contact,
    status: data.status,
    client_type: data.client_type,
    email: data.email,
    c_address: {
      house_num: data.c_address.house_num,
      purok: data.c_address.purok,
      brgy: data.c_address.brgy,
    },
  };
  try {
    // Ensure that the `updates` object contains valid fields and values
    if (
      !updates ||
      typeof updates !== "object" ||
      Object.keys(updates).length === 0
    ) {
      throw new Error("Invalid updates object");
    }
    // Use findByIdAndUpdate with { new: true } to return the updated document
    const updatedClient = await client.findByIdAndUpdate(clientID, updates, {
      new: true,
    });

    if (!updatedClient) {
      return { message: "Client not found" };
    }

    console.log(updatedClient);
    return updatedClient;
  } catch (error) {
    console.error("Error updating client:", error);
    return { message: "Error updating client", error: error.message };
  }
};
exports.ArchiveClient = async (data) => {};
//TODO: Checking account first and if valid or existing acc then you can now register
exports.CheckAccount = async (data) => {
  const { accountName, acc_num } = data;

  try {
    // Find a user with both matching account name and number
    const account = await client.findOne({ accountName, acc_num });
    return { exists: !!account }; // Return true if account exists, false otherwise
  } catch (err) {
    console.error(err);
    throw new Error("Server error");
  }
};
exports.GetClientsByAccNum = async (data) => {
  try {
    const hasClientID = await client.find({ acc_num: data.acc_number });
    if (!hasClientID) {
      return res.status(404).json({ message: "Client not found" });
    }
    console.log("Customer Info", hasClientID);
    return hasClientID;
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
exports.ConsumersWithBill = async () => {
  const updatedClients = []; // Array to hold all updated clients

  const bills = await bill.distinct("acc_num").exec();
  for (const acc_num of bills) {
    console.log(acc_num);

    const totalBalanceswithDate = await bill
      .aggregate([
        { $match: { acc_num } }, // Match the specific account number
        { $sort: { reading_date: 1 } }, // Sort by reading_date descending
        {
          $group: {
            _id: "$acc_num", // Group by acc_num (account number)
            last_billDate: { $first: "$reading_date" }, // Get the first (latest) reading_date after sorting
            totalBalance: { $sum: "$totalAmount" }, // Sum the totalAmount for each acc_num
          },
        },
      ])
      .exec();

    if (totalBalanceswithDate.length === 0) {
      console.log(`No bills found for account: ${acc_num}`);
      continue; // Move to the next iteration of the loop
    }

    const { totalBalance, last_billDate } = totalBalanceswithDate[0];

    const updatedClient = await client.findOneAndUpdate(
      { acc_num },
      {
        last_billDate: last_billDate, // Update the last bill date
        totalBalance: totalBalance, // Update the total balance
      },
      { new: true } // Return the updated document
    );

    console.log("Updated Client Document:", updatedClient);

    if (updatedClient) {
      updatedClients.push(updatedClient); // Add the updated client to the array
    }
  }

  return updatedClients; // Return all updated clients
};
