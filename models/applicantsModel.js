const mongoose = require("mongoose");

const applicantSchema = new mongoose.Schema({
  applicant_name: {
    type: String,
    required: true,
    trim: true,
  },
  classification: {
    type: String,
    trim: true,
    enum: ["Residential", "Comm/Indu/Bulk", "Government"],
  },
  address: {
    type: String,
    required: true,
  },
  email: {
    type: String,
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
      "For Installation",
      "Pending Approval",
      "Installing",
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
  isApprove: {
    type: Boolean,
    default: false,
  },
  officer_agency: {
    type: String,
  },
  position: {
    type: String,
  },
  business_name: {
    type: String,
  },
  business_position: {
    type: String,
  },
});

module.exports = mongoose.model("Applicant", applicantSchema);
