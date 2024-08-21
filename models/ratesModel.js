const mongoose = require("mongoose");

const rateSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: ["Residential", "Commercial"],
    required: true,
  },
  minConsumption: { type: Number, required: true },
  maxConsumption: { type: Number, required: true },
  rate: { type: Number, required: true },
});

module.exports = mongoose.model("Rate", rateSchema);
