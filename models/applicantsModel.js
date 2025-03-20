const mongoose = require("mongoose");

const applicantSchema = new mongoose.Schema({
  applicant_name: {
    type: String,
    required: true,
    trim: true,
  },
  firstname: {
    type: String,
    required: true,
    trim: true,
  },
  lastname: {
    type: String,
    required: true,
    trim: true,
  },
  address: {
    type: String,
    required: true,
  },
  contact: {
    type: String,
    required: true,
    match: [/^\d{10,12}$/, "Invalid contact number"], // Validates phone number (10-12 digits)
  },
  date_applied: {
    type: Date,
    required: true,
  },
  date_of_birth: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    trim: true,
    enum: [
      "New",
      "For Inspection",
      "Inspected",
      "Pending Approval",
      "For Installation",
      "Installed",
    ],
    default: "New",
  },
  inspection_date: {
    type: Date,
  },
  inspection_fee: {
    type: Number,
    default: 0,
  },
  installation_date: {
    type: Date,
  },
  installation_fee: {
    type: Number,
    default: 0,
  },
  paid_inspection: {
    type: Boolean,
    default: false,
  },
  paid_installation: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Applicant", applicantSchema);
