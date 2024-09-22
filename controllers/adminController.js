const admin = require("../models/adminModel.js");
const users = require("../models/usersModel.js");
const biller = require("../models/BillMngr.js");
const payments = require("../models/payments.js");
const bills = require("../models/BillsModel.js");
const Rates = require("../models/ratesModel.js");
const exp = require("express");
const mng = require("mongoose");
const env = require("dotenv").config();
const route = exp.Router();
const bcrypt = require("bcrypt");
const pnv = process.env;

let passHash = (password) => {
  return bcrypt.hashSync(password, parseInt(pnv.SALT));
};
exports.CreateAdmin = async (data) => {
  const account = await admin.findOne({
    $or: [{ username: data.username }, { email: data.email }],
  });
  if (account) {
    const errors = {};
    if (account.username === data.username) {
      errors.acc_name = "Username Name is already taken.";
    }
    if (account.email === data.email) {
      errors.email = "Email is already taken.";
    }
    return { success: false, errors };
  } else {
    let newAdmin = new admin();
    newAdmin.username = data.username;
    newAdmin.password = passHash(data.password);
    newAdmin.contact = data.contact;
    newAdmin.name = `${data.fname} ${data.lastname}`;
    newAdmin.email = data.email;
    newAdmin.address = data.address;
    newAdmin.dateCreated = new Date();
    return newAdmin
      .save()
      .then((result) => {
        if (result) {
          return { success: true, message: "Admin already saved" };
        }
      })
      .catch((err) => {
        return { success: false, error: "There is an error" + err };
      });
  }
};
exports.GetAdmin = async (data) => {
  return await admin
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
exports.UpdateAdminByID = async (data) => {
  const adminID = data._id;
  const name = data.name;
  const email = data.email;
  const contact = data.contact;
  const address = data.address;

  const updates = {
    name: name,
    email: email,
    contact: contact,
    address: address,
  };

  try {
    const updatedAdmin = await admin.findByIdAndUpdate(adminID, updates, {
      new: true,
    });

    if (!updatedAdmin) {
      return { message: "Admin not found" };
    }

    return { success: true, updatedAdmin };
  } catch (error) {
    console.error("Error updating admin:", error);
    return { message: "Error updating admin", error: error.message };
  }
};
exports.GetAllUsers = async (req, res) => {
  try {
    // Fetch data from each collection, excluding archived accounts
    const usersData = await users.find({ isArchive: { $ne: true } }).exec();
    const billerData = await biller.find({ isArchive: { $ne: true } }).exec();
    const adminData = await admin.find({ isArchive: { $ne: true } }).exec();

    // Add a role identifier to each record for easy differentiation
    const usersWithRole = usersData.map((user) => ({
      ...user.toObject(), // Convert Mongoose documents to plain objects
      role: "user", // Adding role
    }));

    const billersWithRole = billerData.map((biller) => ({
      ...biller.toObject(),
      role: "biller",
    }));

    const adminsWithRole = adminData.map((admin) => ({
      ...admin.toObject(),
      role: "admin",
    }));

    // Combine all the data into one array
    const allUsers = [...usersWithRole, ...billersWithRole, ...adminsWithRole];

    // Create a properly structured response object
    const responseObject = {
      success: true,
      message: "Users fetched successfully", // Optional message
      data: allUsers, // Main payload containing the combined user data
    };

    // Send the response object as JSON
    res.status(200).json(responseObject);
  } catch (error) {
    // Error handling with a structured error response
    res.status(500).json({
      success: false,
      message: "Failed to fetch users", // Error message
      errors: {
        // Optional detailed error information
        message: error.message,
        stack: error.stack, // Include stack trace in development environment only
      },
    });
  }
};
exports.updateAccountStatus = async (req, res) => {
  try {
    const accountID = req._id;
    const usertype = req.usertype;
    const status = req.status;

    let model; // This will hold the model to be updated

    // Determine which model to use based on user type
    if (usertype === "admin") {
      model = admin;
    } else if (usertype === "billmngr") {
      model = biller;
    } else if (usertype === "users") {
      model = users;
    } else {
      return {
        success: false,
        message: "Invalid user type",
      };
    }

    const newStatus = status === "active" ? "deactivated" : "active";

    const updateStatus = await model.findByIdAndUpdate(
      accountID,
      { status: newStatus },
      { new: true } // Return the updated document
    );

    if (updateStatus) {
      return {
        success: true,
        message: "Account Status Updated",
        data: updateStatus,
      };
    } else {
      return {
        success: false,
        message: "Account not found",
      };
    }
  } catch (error) {
    console.error("Error updating account status:", error);
    return {
      success: false,
      message: "Internal server error",
    };
  }
};
exports.ArchiveAccount = async (data) => {
  const { status, usertype, _id: id } = data;

  try {
    let archivedAccount;

    switch (usertype) {
      case "admin":
        archivedAccount = await admin.findByIdAndUpdate(
          id,
          { isArchive: true, status: "deactivated" },
          { new: true }
        );
        console.log(`Archiving admin account with ID: ${id}`);
        break;

      case "users":
        archivedAccount = await users.findByIdAndUpdate(
          id,
          { isArchive: true, status: "deactivated" },
          { new: true }
        );
        console.log(`Archiving user account with ID: ${id}`);
        break;

      case "billermngr":
        archivedAccount = await biller.findByIdAndUpdate(
          id,
          { isArchive: true, status: "deactivated" },
          { new: true }
        );
        console.log(`Archiving biller manager account with ID: ${id}`);
        break;

      default:
        console.log(`Unknown usertype: ${usertype}`);
        return { success: false, message: "Invalid usertype" };
    }

    if (archivedAccount) {
      return {
        success: true,
        message: "Account archived successfully",
        data: archivedAccount,
      };
    } else {
      return { success: false, message: "Account not found" };
    }
  } catch (error) {
    console.error(`Error archiving account with ID: ${id}`, error);
    return {
      success: false,
      message: "Internal server error",
      error: error.message,
    };
  }
};
exports.getBillSummary = async (req, res) => {
  try {
    // Extract startDate and endDate from query parameters
    const { startDate, endDate } = req;

    if (!startDate || !endDate) {
      return { message: "Start date and end date are required." };
    }

    // Parse dates
    const start = new Date(startDate);
    const end = new Date(endDate);

    console.log("Filtering bills from:", start, "to:", end);

    // Perform the aggregation
    const summary = await bills.aggregate([
      {
        $match: {
          reading_date: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            month: { $month: "$reading_date" },
            year: { $year: "$reading_date" },
            category: "$category", // Assuming you have a category field
          },
          totalBills: { $sum: 1 },
          totalBilled: { $sum: "$currentBill" }, // Total amount billed
          totalConsumption: { $sum: "$consumption" }, // Assuming you have a consumption field
          totalAmountPaid: { $sum: "$amountPaid" }, // Assuming you have an amountPaid field
          totalPenalties: { $sum: "$p_charge" }, // Assuming you have a penalties field
        },
      },
      {
        $project: {
          _id: 0,
          month: {
            $concat: [
              { $toString: "$_id.month" },
              "-",
              { $toString: "$_id.year" },
            ],
          },
          category: "$_id.category",
          totalBilled: 1,
          totalBills: 1,
          totalConsumption: 1,
          totalAmountPaid: 1,
          totalPenalties: 1,
        },
      },
      {
        $sort: { month: 1, category: 1 },
      },
    ]);

    // Debug: Log the aggregation pipeline stages
    console.log("Aggregation Pipeline Result:", summary);

    // Return the result as a JSON response
    return { summary };
  } catch (error) {
    console.error("Error fetching bill summary:", error);
    res.status(500).json({ message: "Server Error" });
  }
};

exports.getAllRates = async () => {
  try {
    const rates = await Rates.find();
    console.log("RATES", rates);
    return {
      success: true,
      data: rates,
    };
  } catch (error) {
    return {
      success: false,
      message: "Server Error",
      error: error.message,
    };
  }
};
exports.updateRate = async (req, res) => {
  const { id } = req.params;
  const { category, size, minimumCharge, commodityRates } = req.body;

  try {
    // Find and update the rate document
    const updatedRate = await Rates.findByIdAndUpdate(
      id,
      {
        category,
        size,
        minimumCharge,
        commodityRates,
      },
      { new: true, runValidators: true } // Return the updated document and validate
    );

    if (!updatedRate) {
      return res.status(404).json({ message: "Rate not found" });
    }

    res
      .status(200)
      .json({ message: "Rate updated successfully", data: updatedRate });
  } catch (error) {
    console.error("Error updating rate:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
exports.getConsumerCollectionSummary = async (req, res) => {
  try {
    const { startDate, endDate } = req; // Use req.query for query parameters

    // Parse and adjust the start and end dates to cover the entire month
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Ensure the end date covers the whole month
    end.setMonth(end.getMonth() + 1); // Move to the next month
    end.setDate(0); // Set to the last day of the current month

    // Log the dates for debugging
    console.log("Start Date:", start);
    console.log("End Date:", end);

    // Aggregate the data based on the adjusted start and end dates
    const collectionSummary = await payments.aggregate([
      // Use the payments collection
      {
        $match: {
          paymentDate: { $gte: start, $lte: end },
        },
      },
      {
        $group: {
          _id: {
            acc_num: "$acc_num",
            accountName: "$accountName",
          },
          totalBilled: { $sum: "$amountDue" }, // Total billed is amount due
          totalCollected: { $sum: { $subtract: ["$tendered", "$change"] } }, // Total collected
          outstanding: { $sum: "$balance" }, // Outstanding balance
          lastPaymentDate: { $max: "$paymentDate" }, // Last payment date
        },
      },
      {
        $project: {
          _id: 0,
          acc_num: "$_id.acc_num",
          accountName: "$_id.accountName",
          totalBilled: 1,
          totalCollected: 1,
          outstanding: 1,
          lastPaymentDate: 1,
        },
      },
      { $sort: { accountName: 1 } },
    ]);

    // Return the result
    return collectionSummary;
  } catch (error) {
    console.error("Error fetching consumer collection summary:", error);
    return res.status(500).json({
      message: "Failed to fetch collection summary",
      error: error.message,
    });
  }
};
