const rates = require("../models/ratesModel.js");
const exp = require("express");
const mng = require("mongoose");
const env = require("dotenv").config();
const route = exp.Router();
const bcrypt = require("bcrypt");
const pnv = process.env;

exports.addRate = async (data) => {
  try {
    const { category, size, minimumCharge, commodityRates } = data;

    // Ensure the commodityRates array is properly formatted
    const formattedCommodityRates = commodityRates.map((rate) => ({
      rangeStart: rate.rangeStart,
      rangeEnd: rate.rangeEnd,
      rate: parseFloat(rate.rate).toFixed(2),
    }));

    const newRate = new rates({
      category,
      size,
      minimumCharge,
      commodityRates: formattedCommodityRates,
    });

    await newRate.save();
    return { message: "Rate successfully added" };
  } catch (error) {
    console.error(error); // Log the error for debugging
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
