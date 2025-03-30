const mongoose = require("mongoose");

const applicantSchema = new mongoose.Schema({
  application_number: {
    type: String,

    unique: true,
  },
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
    match: [/^\d{10,12}$/, "Invalid contact number"],
  },
  date_applied: {
    type: Date,
    required: true,
    default: Date.now,
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
      "Done",
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

// Middleware to generate short application number before saving
applicantSchema.pre("save", async function (next) {
  if (!this.application_number) {
    const today = new Date();
    const yearMonth =
      today.getFullYear().toString().slice(2) +
      (today.getMonth() + 1).toString().padStart(2, "0");

    // Count applicants created in the current month
    const count = await this.constructor.countDocuments({
      date_applied: {
        $gte: new Date(today.getFullYear(), today.getMonth(), 1),
        $lt: new Date(today.getFullYear(), today.getMonth() + 1, 1),
      },
    });

    // Generate unique application number (APP-YYMM-XXX)
    this.application_number = `APP-${yearMonth}-${String(count + 1).padStart(
      3,
      "0"
    )}`;
  }
  next();
});

module.exports = mongoose.model("Applicant", applicantSchema);
