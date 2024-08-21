const rates = require("../models/ratesModel.js");
const exp = require("express");
const mng = require("mongoose");
const env = require("dotenv").config();
const route = exp.Router();
const bcrypt = require("bcrypt");
const pnv = process.env;

exports.updateRate = async (req, res) => {
  try {
    const { id, category, minConsumption, maxConsumption, rate } = req.body;

    const updatedRate = await rates.findByIdAndUpdate(
      id,
      { category, minConsumption, maxConsumption, rate },
      { new: true }
    );

    if (!updatedRate) {
      return res.status(404).json({ message: "Rate not found" });
    }

    return res.status(200).json(updatedRate);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.addRate = async (data) => {
  try {
    const category = data.category;
    const minConsumption = data.minConsumption;
    const maxConsumption = data.maxConsumption;
    const rate = data.rate;

    const newRate = new rates({
      category,
      minConsumption,
      maxConsumption,
      rate,
    });

    await newRate.save();
    return { message: "Rate successfully added" };
  } catch (error) {
    return { message: "Adding Rate Failed" };
  }
};

// Delete a rate
exports.deleteRate = async (data) => {
  try {
    const { id } = req.params;

    const deletedRate = await rates.findByIdAndDelete(id);

    if (!deletedRate) {
      return res.send(404).json({ message: "Rate not found" });
    }

    return res.status(200).json({ message: "Rate deleted successfully" });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

exports.GetRates = async (data) => {
  return await rates
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
