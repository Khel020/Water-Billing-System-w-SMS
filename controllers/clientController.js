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
  const results = [];
  try {
    // Process each client in the batch
    for (const client of data) {
      const result = await CreateClient(client); // Process each client individually
      results.push(result); // Push the result (either success or error) to results array
    }

    return {
      success: true,
      message: "Batch processing completed",
      data: results,
    };
  } catch (err) {
    return { error: `There was an error processing the batch: ${err.message}` };
  }
};

// New function to handle single client creation request
async function CreateClient(clientData) {
  try {
    const existingClient = await client.findOne({
      $or: [
        { acc_num: clientData.accountNumber },
        { accountName: clientData.accountName },
      ],
    });

    if (existingClient) {
      return {
        error:
          "Account number or account name is already taken. Please use a unique value.",
      };
    }

    const totalBalance = parseFloat(clientData.installation_fee) || 0; // Use fallback value if undefined or null

    let newClient = new client({
      acc_num: clientData.accountNumber,
      accountName: clientData.accountName,
      meter_num: clientData.meter_num,
      pipe_size: clientData.pipe_size,
      meter_brand: clientData.meterBrand,
      contact: clientData.contact,
      initial_read: clientData.initial_read,
      c_address: clientData.address,
      client_type: clientData.client_type,
      install_date: clientData.install_date,
      activation_date: clientData.activationDate,
      install_fee: clientData.installation_fee,
      meter_installer: clientData.meter_installer,
      zone: clientData.zone,
      sequenceNumber: clientData.seq_num,
      dateCreated: clientData.dateCreated,
      totalBalance: totalBalance,
    });

    const result = await newClient.save();

    return {
      success: true,
      result: result,
      message: "Client successfully created",
    };
  } catch (err) {
    return { error: `Error creating client: ${err.message}` }; // Proper error handling
  }
}

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
    c_address: data.c_address,
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
// Function to get sorted clients with or without bills
exports.ConsumersWithBill = async () => {
  try {
    const allClients = await client.find({}).exec();

    const billAccNumbers = await bill.distinct("acc_num").exec();

    const updatedClients = [];

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
        } else {
          console.log(`No bills found for account number: ${acc_num}`);
        }

        const updatedClient = await client.findOneAndUpdate(
          { acc_num },
          { last_billDate },
          { new: true }
        );

        if (updatedClient) {
          updatedClients.push(updatedClient);
        }
      }

      const clientsWithoutBills = allClients.filter(
        (client) => !billAccNumbers.includes(client.acc_num)
      );

      const allClientsWithBills = [...updatedClients, ...clientsWithoutBills];

      const sortedClients = allClientsWithBills.sort((a, b) => {
        const statusOrder = { Inactive: 1, Pending: 2, Active: 3 };

        const aStatusPriority = statusOrder[a.status];
        const bStatusPriority = statusOrder[b.status];

        // Sort by status priority first
        if (aStatusPriority !== bStatusPriority) {
          return aStatusPriority - bStatusPriority;
        }

        // If both are active, sort by latest `dateCreated` (newest first)
        if (a.status === "Pending" && b.status === "Pending") {
          const aDate = new Date(a.dateCreated);
          const bDate = new Date(b.dateCreated);
          console.log(`Comparing dates: ${bDate} - ${aDate}`);
          return bDate - aDate; // Newest date first
        }
        if (a.status === "Active" && b.status === "Active") {
          const aDate = new Date(a.dateCreated);
          const bDate = new Date(b.dateCreated);
          console.log(`Comparing dates: ${bDate} - ${aDate}`);
          return bDate - aDate; // Newest date first
        }

        return 0;
      });

      return sortedClients;
    } else {
      return allClients.sort((a, b) => {
        const statusOrder = { Inactive: 1, Pending: 2, Active: 3 };

        const aStatusPriority = statusOrder[a.status];
        const bStatusPriority = statusOrder[b.status];

        // Sort by status priority first
        if (aStatusPriority !== bStatusPriority) {
          return aStatusPriority - bStatusPriority;
        }

        // If both are active, sort by latest `dateCreated` (newest first)
        if (a.status === "Active" && b.status === "Active") {
          const aDate = new Date(a.dateCreated);
          const bDate = new Date(b.dateCreated);
          console.log(`Comparing dates: ${bDate} - ${aDate}`);
          return bDate - aDate; // Newest date first
        }

        return 0;
      });
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
    const pendingClients = await client.countDocuments({ status: "Pending" });

    return { totalClients, activeClients, inactiveClients, pendingClients };
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
    case "Commercial_A":
      c_type = 304;
      break;
    case "Commercial_B":
      c_type = 305;
      break;
    case "Commercial_C":
      c_type = 306;
      break;
    case "Bulk":
      c_type = 402;
      break;
    case "Industrial":
      c_type = 503;
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
    // Get the current date to compare activation dates
    const currentDate = new Date();

    // Fetch the accounts with status "Pending" and activation_date less than the current date
    const result = await client.find({
      status: "Pending",
      activation_date: { $lt: currentDate },
    });

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
exports.GetForDisconnection = async () => {
  try {
    const ForDisconnect = await client.find({
      disconnection_status: "For Disconnection",
    });

    return ForDisconnect; // Return the result
  } catch (error) {
    console.error("Error fetching accounts for disconnection:", error);
    throw error; // Throw the error so it can be handled by the calling function
  }
};
exports.getClientwithBalance = async () => {
  try {
    const withBalance = await client.find({
      totalBalance: { $exists: true, $gt: 0 },
    });

    if (withBalance.length === 0) {
      return { success: false, message: "No clients found with a balance." };
    }

    return { success: true, withBalance };
  } catch (err) {
    console.error("Error fetching data:", err); // Log the error for debugging
    return {
      error: "An error occurred while fetching the data. Please try again.",
    };
  }
};
