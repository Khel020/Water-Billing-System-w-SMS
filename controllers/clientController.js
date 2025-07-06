const client = require("../models/clientModel.js");
const bill = require("../models/BillsModel.js");
const exp = require("express");
const mng = require("mongoose");
const env = require("dotenv").config();
const route = exp.Router();
const bcrypt = require("bcrypt");
const pnv = process.env;

//TODO: UPLOAD BUNCH CLIENT
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
        { acc_num: clientData.accountNumber }, // Unique dapat
        { meter_num: clientData.meter_num }, // Unique dapat
      ],
    });

    if (existingClient) {
      return {
        error:
          "Account number or account name is already taken. Please use a unique value.",
      };
    }

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
      dateApplied: clientData.date_applied,
      paidInspection: true,
      paidInstallation: true,
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

exports.AddClient = async (data) => {
  try {
    const existingClient = await client.findOne({
      $or: [{ acc_num: data.accountNumber }, { accountName: data.accountName }],
    });

    if (existingClient) {
      return {
        error:
          "Account number or account name is already taken. Please use a unique value.",
      };
    }
    let newClient = new client({
      acc_num: data.accountNumber,
      accountName: data.accountName,
      contact: data.contact,
      initial_read: data.initial_read,
      c_address: data.address,
      client_type: data.client_type,
      inspec_date: data.inspec_date,
      inspec_fee: data.inspection_fee,
      zone: data.barangay,
      advancePayment: 0,
      dateApplied: data.date_applied,
      dateCreated: data.dateCreated,
    });
    const result = await newClient.save();
  } catch (err) {
    return { error: `Error creating client: ${err.message}` }; // Proper error handling
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
exports.GettingClients = async () => {
  try {
    const totalPending = await client.countDocuments({ status: "Pending" });
    const totalApproved = await client.countDocuments({ status: "Approved" });
    const totalInstalling = await client.countDocuments({
      status: "Installing",
    });
    const totalInstalled = await client.countDocuments({ status: "Installed" });

    return {
      totalPending,
      totalApproved,
      totalInstalling,
      totalInstalled,
    };
  } catch (error) {
    return { error: "There is an error retrieving client counts" };
  }
};
exports.GettingApplicants = async () => {
  try {
    const statusOrder = {
      Pending: 1,
      Approved: 2,
      Installing: 3,
      Installed: 4,
    };

    const applicants = await client
      .find({})
      .sort({
        status: 1, // Sort alphabetically (not by custom order yet)
        dateApplied: -1, // Sort by dateApplied (latest first)
      })
      .lean(); // Convert to plain objects for performance

    // Manually sort using JavaScript (since MongoDB doesn't support custom order directly)
    applicants.sort((a, b) => {
      return statusOrder[a.status] - statusOrder[b.status];
    });

    return {
      sortedApplicants: applicants,
    };
  } catch (error) {
    console.error(error); // Log the error for debugging
    return { error: "There is an error retrieving applicants" };
  }
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
    const latestbill = await bill.findOne({ acc_num: data.acc_num });

    return hasClientID;
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
// Function to get sorted clients with or without bills
exports.ConsumersWithBill = async () => {
  try {
    // Fetch all clients and unique account numbers with bills
    const allClients = await client.find({}).exec();
    const billAccNumbers = await bill.distinct("acc_num").exec();
    const updatedClients = [];

    // Process clients that have bills
    if (billAccNumbers && billAccNumbers.length > 0) {
      for (const acc_num of billAccNumbers) {
        // Get the latest bill date for each account
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
          last_billDate = billDetails[0].last_billDate || null;
        } else {
          console.log(`No bills found for account number: ${acc_num}`);
        }

        // Update the client with the latest bill date
        const updatedClient = await client.findOneAndUpdate(
          { acc_num },
          { last_billDate },
          { new: true }
        );

        if (updatedClient) {
          updatedClients.push(updatedClient);
        }
      }

      // Find clients without bills
      const clientsWithoutBills = allClients.filter(
        (client) => !billAccNumbers.includes(client.acc_num)
      );

      // Combine all clients
      const allClientsWithBills = [...updatedClients, ...clientsWithoutBills];

      // Sort clients by status and then by dateCreated (newest first)
      return sortClientsByStatusAndDate(allClientsWithBills);
    } else {
      // If no bills exist, just sort all clients
      return sortClientsByStatusAndDate(allClients);
    }
  } catch (error) {
    console.error("Error in ConsumersWithBill:", error);
    throw new Error("Internal Server Error");
  }
};

// Helper function to sort clients by status priority and date
function sortClientsByStatusAndDate(clients) {
  return clients.sort((a, b) => {
    // Define status priorities (higher number = higher priority)
    const statusOrder = {
      Inactive: 1,
      Pending: 2,
      Active: 3,
    };

    const aStatusPriority = statusOrder[a.status] || 0;
    const bStatusPriority = statusOrder[b.status] || 0;

    // Sort by status priority first
    if (aStatusPriority !== bStatusPriority) {
      return aStatusPriority - bStatusPriority;
    }

    // If status is the same, sort by dateCreated (newest first)
    // This applies to all statuses, not just Active or Pending
    const aDate = new Date(a.dateCreated || 0);
    const bDate = new Date(b.dateCreated || 0);

    // Debug log if needed
    // console.log(`Comparing dates for ${a.acc_num} and ${b.acc_num}: ${bDate} - ${aDate}`);

    // Return newest first (descending order)
    return bDate - aDate;
  });
}

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
    .sort({ book: -1 }) // Get the latest book number
    .exec();

  console.log("Latest Consumer", latestConsumer);
  console.log("Data GENERATE ACC", data);
  let zone = data.barangay; // House number as the last part of the account number
  let c_type;
  let book = 1; // Default starting book

  // Map client type to group classification numbers
  switch (data.c_type) {
    case "Residential":
      c_type = 102;
      break;
    case "Res-Boton":
      c_type = 103;
      break;
    case "Res-Inlagadian":
      c_type = 104;
      break;
    case "Government":
      c_type = 202;
      break;
    case "Commercial/Industial":
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
    case "Bulk1":
      c_type = 403;
      break;
    case "Bulk2":
      c_type = 404;
      break;
    default:
      throw new Error("Invalid client type");
  }

  // Determine book number
  if (latestConsumer) {
    book = latestConsumer.book; // Retain the latest book number
    const consumersInBook = await client.countDocuments({
      zone: data.zone,
      book: book,
    });

    // If consumers in current book exceed a limit (e.g., 999), increment book
    if (consumersInBook >= 999) {
      book += 1;
    }
  }

  // Combine all parts to form the account number
  const accountNumber = `${zone}${book}-${c_type}-${data.houseNum}`;

  const result = {
    acc_num: accountNumber,
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
      { acc_num: data.acc_num }, // Find by account number
      {
        status: data.status,
        dateActivated: Date.now(), // Set the activation date to now
      },
      { new: true } // Return the updated document
    );

    console.log("RESULT", result);
    return result; // Return the updated result
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
exports.GetConsumerForSMS = async () => {
  try {
    console.log("📡 Fetching Consumers for SMS...");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const endOfToday = new Date(today);
    endOfToday.setHours(23, 59, 59, 999);

    const threeDaysDue = new Date(today);
    threeDaysDue.setDate(today.getDate() + 3);
    threeDaysDue.setHours(0, 0, 0, 0);

    const endOfThreeDaysDue = new Date(threeDaysDue);
    endOfThreeDaysDue.setHours(23, 59, 59, 999);

    console.log("📆 TODAY:", today);
    console.log("⚠️ END OF TODAY:", endOfToday);
    console.log("⏳ NEAR OVERDUE START:", threeDaysDue);
    console.log("⏳ NEAR OVERDUE END:", endOfThreeDaysDue);

    // 🔍 New Consumers (activated today)
    const newConsumers = await client.find({
      dateActivated: {
        $gte: today,
        $lte: endOfToday,
      },
    });

    // 🔍 Consumers marked for disconnection
    const forDisconnection = await client.find({
      disconnection_status: "For Disconnection",
    });

    // 🔍 Consumers with overdue bills
    const overdueClients = await client.find({
      last_billStatus: "Unpaid",
      latest_billDue: { $lte: endOfToday },
    });
    console.log("LIst1", overdueClients);
    const overdueBillsList = [];

    for (const consumer of overdueClients) {
      const bills = await bill.find({
        acc_num: consumer.acc_num,
        payment_status: "Overdue",
        due_date: { $lte: endOfToday },
      });
      console.log("LIst2", bills);
      if (bills.length > 0) {
        overdueBillsList.push({
          type: "Overdue",
          acc_num: consumer.acc_num,
          acc_name: consumer.accountName,
          address: consumer.c_address,
          contact: consumer.contact,
          date: bills[0]?.reading_date,
          billsUnpaid: bills.length, // total number of unpaid/overdue bills
          billAmount: bills[0]?.currentBill,
          balance: consumer.totalBalance, // total balance from client record
          latest_billDue: consumer.latest_billDue, // from client record
        });
      }
    }
    console.log("LIst", overdueBillsList);
    // 🔍 Near Overdue (exactly 3 days from now)
    const nearOverdueBills = await client.find({
      last_billStatus: "Unpaid" ,
      latest_billDue: {
        $gte: threeDaysDue,
        $lte: endOfThreeDaysDue,
      },
    });

    const consumersList = [
      ...newConsumers.map((consumer) => ({
        type: "New Consumer",
        acc_num: consumer.acc_num,
        acc_name: consumer.accountName,
        address: consumer.c_address,
        contact: consumer.contact,
      })),
      ...forDisconnection.map((consumer) => ({
        type: "For Disconnection",
        acc_num: consumer.acc_num,
        acc_name: consumer.accountName,
        address: consumer.c_address,
        contact: consumer.contact,
      })),
      ...overdueBillsList,
      ...nearOverdueBills.map((consumer) => ({
        type: "Near Overdue",
        acc_num: consumer.acc_num,
        acc_name: consumer.accountName,
        address: consumer.c_address,
        contact: consumer.contact,
      })),
    ];

    return consumersList;
  } catch (error) {
    console.error("❌ Error fetching consumers for SMS:", error);
  }
};
exports.InspectedStatus = async (req, res) => {
  try {
    const acc_name = req.acc_name;
    console.log(acc_name);
    const updatedClient = await client.findOneAndUpdate(
      { accountName: acc_name },
      { status: "Inspected" }, // Update the inspected status
      { new: true }
    );

    if (!updatedClient) {
      return res
        .status(404)
        .json({ success: false, message: "Client not found." });
    }

    res.json({
      success: true,
      message: "Inspection status updated successfully!",
      data: updatedClient,
    });
  } catch (error) {
    console.error("Error updating inspected status:", error);
    res.status(500).json({ success: false, message: "Internal Server Error" });
  }
};
