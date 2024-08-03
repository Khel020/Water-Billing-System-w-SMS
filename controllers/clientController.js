const client = require("../models/clientModel.js");
const exp = require("express");
const mng = require("mongoose");
const env = require("dotenv").config();
const route = exp.Router();
const bcrypt = require("bcrypt");
const pnv = process.env;

exports.CreateClient = async (data) => {
  try {
    // Create a new client object
    let NewClient = new client({
      acc_num: data.acc_num,
      accountName: data.fname + " " + data.lastname, // Concatenate first and last names
      c_address: data.c_address,
      contact: data.contact,
      meter_num: data.meter_num,
      status: data.status,
      client_type: data.client_type,
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
exports.UpdateClientByID = async (data) => {
  const clientsID = data.id;
  const updates = data.updates;

  const updatedClient = await client.findByIdAndUpdate(clientsID, updates);

  if (!updatedClient) {
    return { message: "Client not found" };
  }
  return updatedClient;
};
exports.DeleteClientByID = async (data) => {};

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
