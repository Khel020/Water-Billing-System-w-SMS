const Applicant = require("../models/applicantsModel");
const exp = require("express");
const mng = require("mongoose");
const env = require("dotenv").config();
const route = exp.Router();
const bcrypt = require("bcrypt");
const pnv = process.env;

exports.createApplication = async (data) => {
  try {
    const {
      firstname,
      lastname,
      address,
      contact,
      date_of_birth,
      date_applied,
      inspec_fee,
    } = data;

    // Basic validation
    if (!firstname || !lastname || !address || !contact || !date_of_birth) {
      return { success: false, message: "All fields are required." };
    }

    // Check if the applicant already exists based on name and address
    const existingApplicant = await Applicant.findOne({
      firstname,
      lastname,
      address,
    });
    if (existingApplicant) {
      return {
        success: false,
        message: "Application already exists for this person.",
      };
    }

    // Check if the contact number is already registered
    const existingContact = await Applicant.findOne({ contact });
    if (existingContact) {
      return { success: false, smessage: "Contact number is already in use." };
    }

    // Create new applicant
    const newApplicant = new Applicant({
      applicant_name: `${firstname} ${lastname}`, // Combine firstname and lastname
      firstname,
      lastname,
      address,
      contact,
      date_of_birth,
      date_applied,
      inspection_fee: inspec_fee,
    });

    await newApplicant.save();
    return {
      success: true,
      message: "Application created successfully!",
      applicant: newApplicant,
    };
  } catch (error) {
    console.error(error);
    return {
      success: false,
      message: "Application creation failed",
      error: error.message,
    };
  }
};

// Get all applications
exports.getApplications = async () => {
  try {
    const applications = await Applicant.find({});

    return applications;
  } catch (error) {
    return { error: "Error fetching applications" };
  }
};
exports.GetTotalApplicants = async () => {
  try {
    const New = await Applicant.countDocuments({ status: "New" });
    const For_Inspection = await Applicant.countDocuments({
      status: "For Inspection",
    });
    const For_Installation = await Applicant.countDocuments({
      status: "For Installation",
    });
    const Installed = await Applicant.countDocuments({ status: "Installed" });

    return { New, For_Inspection, For_Installation, Installed };
  } catch (error) {
    console.error("Error fetching client statistics:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

// Delete an application
exports.deleteApplication = async (id) => {
  try {
    const deletedApplication = await Applicant.findByIdAndDelete(id);

    if (!deletedApplication) {
      return { message: "Application not found" };
    }

    return { message: "Application deleted successfully" };
  } catch (error) {
    return { message: error.message };
  }
};

exports.Schedule = async (data) => {
  try {
    // Hanapin ang applicant at i-update ang inspection_date field
    const updatedApplicant = await Applicant.findOneAndUpdate(
      { applicant_name: data.applicant }, // Palitan ito kung gumagamit ka ng ibang identifier (e.g., _id)
      { inspection_date: data.inspectionDate },
      { new: true } // Return the updated document
    );

    if (!updatedApplicant) {
      throw new Error("Applicant not found");
    }

    return { success: true, applicant: updatedApplicant };
  } catch (error) {
    console.error("Error scheduling inspection:", error);
    throw new Error("Internal Server Error");
  }
};
exports.DoneInspection = async (account) => {
  try {
    const applicant = await Applicant.findOne({ applicant_name: account });

    if (!applicant) {
      return {
        success: false,
        message: `Applicant with account ${account} not found.`,
      };
    }

    // If the applicant is already inspected, return a message
    if (applicant.status === "Inspected") {
      return {
        success: true,
        message: `Applicant with account ${account} is already inspected.`,
        data: applicant,
      };
    }

    // Otherwise, update the status to "Inspected"
    const result = await Applicant.findOneAndUpdate(
      { applicant_name: account },
      { $set: { status: "Inspected" } },
      { new: true }
    );
    console.log("Result is", result);
    return {
      success: true,
      message: `Status updated for account: ${account}`,
      data: result,
    };
  } catch (error) {
    console.error("Error updating inspection status:", error);
    return {
      success: false,
      message: "Error updating inspection status",
      error: error.message,
    };
  }
};
exports.ScheduleInstall = async (data) => {
  try {
    const { applicantName, installationDate, installationFee } = data;

    // Find and update the applicant record in one step
    const updatedApplicant = await Applicant.findOneAndUpdate(
      { applicant_name: applicantName },
      {
        $set: {
          installation_date: installationDate,
          installation_fee: installationFee,
          status: "Pending Approval",
        },
      },
      { new: true }
    );

    if (!updatedApplicant) {
      return {
        success: false,
        message: `Applicant with the name ${applicantName} not found.`,
      };
    }

    return {
      success: true,
      message: `Installation scheduled for applicant: ${applicantName}`,
      data: updatedApplicant,
    };
  } catch (error) {
    console.error("Error scheduling installation:", error);
    return {
      success: false,
      message: "Error scheduling installation",
      error: error.message,
    };
  }
};
