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
    // Check if the account number or account name is already taken
    const existingClient = await client.findOne({
      $or: [{ acc_num: data.accountNumber }, { accountName: data.accountName }],
    });

    if (existingClient) {
      // If a client with the same account number or account name exists, return an error
      return {
        error:
          "Account number or account name is already taken. Please use a unique value.",
      };
    }

    const totalBalance = parseFloat(data.installation_fee);

    // Create a new client object with total balance included
    let NewClient = new client({
      acc_num: data.accountNumber,
      accountName: data.accountName,
      meter_num: data.meter_num,
      pipe_size: data.pipe_size,
      meter_brand: data.brand_num,
      contact: data.contact,
      initial_read: data.initial_read,
      c_address: data.address,
      client_type: data.client_type,
      install_date: data.install_date,
      activation_date: data.activationDate,
      install_fee: data.installation_fee,
      meter_installer: data.meter_installer,
      zone: data.zone,
      sequenceNumber: data.seq_num,
      totalBalance: totalBalance, // Add total balance here
    });

    const result = await NewClient.save();

    return { result: result, message: "Client Successfully Created" };
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
    c_address: data.address,
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
        const billDetails = await bill
          .aggregate([
            { $match: { acc_num } },
            { $sort: { reading_date: -1 } },
            {
              $group: {
                _id: "$acc_num",
                last_billDate: { $first: "$reading_date" },
              },
            },
          ])
          .exec();

        let last_billDate = null;

        if (billDetails.length > 0) {
          const result = billDetails[0];
          last_billDate = result.last_billDate || null;
        }

        const updatedClient = await client.findOneAndUpdate(
          { acc_num },
          {
            last_billDate: last_billDate,
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

exports.generateAccountNumber = async (data) => {
  // Find the latest consumer in the specified zone
  const latestConsumer = await client
    .findOne({ zone: data.zone })
    .sort({ sequenceNumber: -1 })
    .exec();

  console.log("latest Consumer", latestConsumer);
  let zone = data.zone;
  let c_type;
  let book = 1; // Default starting book
  let sequenceNumber = 1; // Start with 001

  // Map client type to group classification numbers
  switch (data.c_type) {
    case "Residential":
      c_type = 102;
      break;
    case "Government":
      c_type = 202;
      break;
    case "Commercial":
      c_type = 303;
      break;
    default:
      throw new Error("Invalid client type");
  }
  console.log("Latest Consumer", latestConsumer);
  if (latestConsumer) {
    // Increment the sequence number
    sequenceNumber = latestConsumer.sequenceNumber + 1;

    // Check if sequence number exceeds 999
    if (sequenceNumber > 999) {
      book = latestConsumer.book + 1; // Move to the next book
      sequenceNumber = 1; // Reset sequence to 001
    } else {
      book = latestConsumer.book; // Keep the current book
    }
  }

  // Format the sequence number as three digits (e.g., 001, 002)
  const formattedSequence = String(sequenceNumber).padStart(3, "0");

  // Combine all parts to form the account number
  const accountNumber = `${zone}${book}-${c_type}-${formattedSequence}`;

  const result = {
    acc_num: accountNumber,
    seq_num: formattedSequence,
    book: book,
  };
  return { result };
};
exports.GetforActivation = async () => {
  try {
    // Fetch the accounts with activationStatus "pending"
    const result = await client.find({ status: "Pending" });
    return result;
  } catch (error) {
    // Log the error and throw it to be handled by the route
    console.error("Error fetching accounts for activation:", error);
    throw new Error("Error fetching accounts for activation");
  }
};
exports.UpdatePending = async (data) => {
  try {
    console.log("For Update", data);
    console.log("Updating");
    const result = await client.findOneAndUpdate(
      { acc_num: data.acc_num },
      { status: data.status },
      { new: true }
    );
    console.log("RESULT", result);
    return result; // Return the updated result if needed
  } catch (error) {
    console.error("Error updating status:", error);
    throw error; // Optionally, rethrow the error for further handling
  }
};
