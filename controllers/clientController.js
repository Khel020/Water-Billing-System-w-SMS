const client = require("../models/clientModel.js");
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
      client_type: data.client_type,
      email: data.email,
      birthday: data.birthday,
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
exports.GetAllClients = async (data) => {
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
    acc_num: data.acc_num,
    accountName: data.accountName,
    meter_num: data.meter_num,
    contact: data.contact,
    status: data.status,
    client_type: data.client_type,
    email: data.email,
    birthday: data.birthday,
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
// FIXME: FIND CLIENT BY ID
const getClientById = async (req, res) => {
  try {
    const hasClientID = await client.findById(req.params.id);
    if (!hasClientID) {
      return res.status(404).json({ message: "Client not found" });
    }
    res.json(hasClientID);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
