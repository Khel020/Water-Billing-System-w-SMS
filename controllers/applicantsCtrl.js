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
      applicantName,
      address,
      contact,
      date_of_birth,
      date_applied,
      inspec_fee,
      officer_agency,
      position,
      business_name,
      business_position,
      client_type,
      email,
    } = data;

    // Basic validation
    if (
      !applicantName ||
      !address ||
      !contact ||
      !date_of_birth ||
      !client_type
    ) {
      return {
        success: false,
        message: "All required fields must be provided.",
      };
    }

    // Check if the contact number is already registered
    const existingContact = await Applicant.findOne({ contact });
    if (existingContact) {
      return { success: false, message: "Contact number is already in use." };
    }

    // **Government Client Type Check**
    if (client_type === "Government") {
      const existingAgency = await Applicant.findOne({ officer_agency });
      if (existingAgency) {
        return {
          success: false,
          message: "An application for this government office already exists.",
        };
      }
    }

    // **Commercial, Industrial, Bulk Client Type Check**
    if (client_type === "Comm/Indu/Bulk") {
      const existingBusiness = await Applicant.findOne({ business_name });
      if (existingBusiness) {
        return {
          success: false,
          message: "An application for this business name already exists.",
        };
      }
    }

    // Create new applicant
    const newApplicant = new Applicant({
      applicant_name: applicantName,
      address,
      contact,
      date_of_birth,
      date_applied,
      inspection_fee: inspec_fee,
      officer_agency,
      position,
      business_name,
      business_position,
      classification: client_type,
      email,
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

exports.getApplications = async () => {
  try {
    const statusOrder = {
      "Pending Approval": 1, // First (Needs action ASAP)
      New: 2, // Second (Just registered, needs processing)
      "For Inspection": 3, // Third (Next step after approval)
      Inspected: 4, // Fourth (Inspection done, awaiting installation)
      "For Installation": 5, // Fifth (Ready for installation)
      Installing: 6, // Last (Already in progress)
    };

    // Fetch all applications
    const applications = await Applicant.find({}).lean();

    // Custom sorting function
    applications.sort((a, b) => {
      // 1️⃣ Compare based on status priority (lower number = higher priority)
      const statusA = statusOrder[a.status] ?? 99; // Default to 99 if not found
      const statusB = statusOrder[b.status] ?? 99;
      const statusComparison = statusA - statusB;
      if (statusComparison !== 0) return statusComparison;

      // 2️⃣ If same status, compare by latest date_applied (newest first)
      const dateComparison =
        new Date(b.date_applied) - new Date(a.date_applied);
      if (dateComparison !== 0) return dateComparison;

      // 3️⃣ If same status & date_applied, compare by ObjectId (newest first)
      return b._id.toString().localeCompare(a._id.toString());
    });

    return applications;
  } catch (error) {
    console.error("Error fetching applications:", error);
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
    const Pending_Approval = await Applicant.countDocuments({
      status: "Pending Approval",
    });
    const Installing = await Applicant.countDocuments({ status: "Installing" });

    return {
      New,
      For_Inspection,
      For_Installation,
      Pending_Approval,
      Installing,
    };
  } catch (error) {
    console.error("Error fetching client statistics:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
exports.getPendingApplicants = async (req, res) => {
  try {
    // Fetch applicants with status "Pending_Approval"
    const pendingApplicants = await Applicant.find({
      status: "Pending Approval",
    });

    // Send response
    return pendingApplicants;
  } catch (error) {
    console.error("Error fetching pending applicants:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};
exports.getInstallingApplicants = async () => {
  try {
    const installingApplicants = await Applicant.find({ status: "Installing" });
    return installingApplicants;
  } catch (error) {
    console.error("Error fetching installing applicants:", error);
    throw error;
  }
};
exports.approveApplicant = async (id, data) => {
  try {
    const updatedApplicant = await Applicant.findByIdAndUpdate(
      id,
      { isApprove: true, status: "Installing" },
      { new: true }
    );

    if (!updatedApplicant) {
      return { success: false, message: "Applicant not found" };
    }

    console.log("Applicant approved:", updatedApplicant);
    return {
      success: true,
      message: "Applicant approved successfully",
      data: updatedApplicant,
    };
  } catch (error) {
    console.error("Error approving applicant:", error);
    return { success: false, message: "Internal server error" };
  }
};
exports.doneInstall = async (id, requestBody) => {
  try {
    console.log(id);

    const updatedApplicant = await Applicant.findByIdAndUpdate(
      id,
      { status: requestBody.status },
      { new: true }
    );

    if (!updatedApplicant) {
      return { success: false, message: "Applicant not found" };
    }

    console.log("Installation marked as done:", updatedApplicant);

    return {
      success: true,
      message:
        "Installation marked as done successfully. Proceed to account creation.",
      applicant: updatedApplicant,
    };
  } catch (error) {
    console.error("Error marking installation as done:", error);
    return { success: false, message: "Internal server error" };
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
          status: "For Installation",
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
