const client = require("../models/clientModel.js");
const bill = require("../models/BillsModel.js");
const fee = require("../models/FeesModel.js");
const exp = require("express");
const mng = require("mongoose");
const env = require("dotenv").config();
const route = exp.Router();
const bcrypt = require("bcrypt");
const pnv = process.env;

//TODO: Creating Client/ Add Client
exports.CreateClient = async (data) => {
  try {
    // Check if the account number or account name is already taken
    const existingClient = await client.findOne({
      $or: [{ acc_num: data.acc_num }, { accountName: data.accountName }],
    });

    if (existingClient) {
      // If a client with the same account number or account name exists, return an error
      return {
        error:
          "Account number or account name is already taken. Please use a unique value.",
      };
    }
    // Create a new client object
    let NewClient = new client({
      acc_num: data.acc_num,
      accountName: data.accountName,
      meter_num: data.meter_num,
      pipe_size: data.pipe_size,
      status: data.status,
      brand_num: data.brand_num,
      initial_read: data.initial_read,
      c_address: data.address,
      client_type: data.client_type,
      install_date: data.install_date,
      activation_date: data.activationDate,
      installation_fee: data.installation_fee,
      connection_fee: data.connection_fee,
      meter_installer: data.meter_installer,
    });

    const result = await NewClient.save();
    const clientFees = new fee({
      acc_num: data.acc_num,
      accountName: data.accountName,
      installation_fee: data.installation_fee,
      connection_fee: data.connection_fee,
    });
    const saveFees = await clientFees.save();
    return {
      message: "Client and fees successfully created",
      client: result,
      fees: saveFees,
    };
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
  try {
    const updatedClients = [];

    // Get all clients
    const allClients = await client.find({}).exec();

    // Get distinct account numbers from the bills collection
    const billAccNumbers = await bill.distinct("acc_num").exec();

    if (billAccNumbers && billAccNumbers.length > 0) {
      for (const acc_num of billAccNumbers) {
        const totalBalanceswithDate = await bill
          .aggregate([
            { $match: { acc_num } },
            { $sort: { reading_date: -1 } },
            {
              $group: {
                _id: "$acc_num",
                last_billDate: { $first: "$reading_date" },
                totalBalance: { $sum: "$totalAmount" },
              },
            },
          ])
          .exec();

        let totalBalance = 0.0;
        let last_billDate = null;

        if (totalBalanceswithDate.length > 0) {
          const result = totalBalanceswithDate[0];
          totalBalance = result.totalBalance;
          last_billDate = result.last_billDate || null;
        }

        const updatedClient = await client.findOneAndUpdate(
          { acc_num },
          {
            last_billDate: last_billDate,
            totalBalance: parseFloat(totalBalance.toFixed(2)),
          },
          { new: true }
        );

        if (updatedClient) {
          updatedClients.push(updatedClient);
        }
      }

      // Combine updated clients with those who don't have bills
      const clientsWithoutBills = allClients.filter(
        (client) => !billAccNumbers.includes(client.acc_num)
      );

      return [...updatedClients, ...clientsWithoutBills]; // Return all clients, updated and non-updated
    } else {
      return allClients; // If no bills exist, return all clients as is
    }
  } catch (error) {
    console.error("Error in ConsumersWithBill:", error);
    throw new Error("Internal Server Error");
  }
};

exports.GetTotalClients = async () => {
  try {
    const totalClients = await client.countDocuments();
    const activeClients = await client.countDocuments({ status: "Active" });
    const inactiveClients = await client.countDocuments({ status: "Inactive" });

    return { totalClients, activeClients, inactiveClients };
  } catch (error) {
    console.error("Error fetching client statistics:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
