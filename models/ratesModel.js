const mongoose = require("mongoose");

const rateSchema = new mongoose.Schema({
  category: {
    type: String,
    enum: [
      "Residential",
      "Commercial",
      "Government",
      "Industrial",
      "Commercial_A",
      "Commercial_B",
      "Commercial_C",
    ],
    required: true,
  },
  size: {
    type: String,
    required: true,
  },
  minimumCharge: {
    type: String,
    required: true,
  },
  commodityRates: [
    {
      rangeStart: { type: Number, required: true }, // Starting range (inclusive)
      rangeEnd: { type: Number, required: true }, // Ending range (inclusive)
      rate: { type: String, required: true }, // Rate per cubic meter for this range
    },
  ],
});

module.exports = mongoose.model("Rate", rateSchema);
