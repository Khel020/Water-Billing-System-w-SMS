const admin = require("../models/adminModel.js");
const users = require("../models/usersModel.js");
const biller = require("../models/BillMngr.js");
const payments = require("../models/payments.js");
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
    // Fetch data from each collection
    const usersData = await users.find({}).exec();
    const billerData = await biller.find({}).exec();
    const adminData = await admin.find({}).exec();

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
    res.status(200).json({
      success: true,
      message: "Users fetched successfully",
      data: allUsers,
    });
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
exports.GetAllPayments = async () => {
  try {
    const result = await payments.find({});
    console.log(result);
    return {
      success: true,
      message: "Payments fetched successfully",
      data: result,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to fetch payments",
      error: error.message,
    };
  }
};
