const biller = require("../models/BillMngr");
const bills = require("../models/BillsModel");
const Rate = require("../models/ratesModel");
const Logs = require("../models/LogsModel");
const Client = require("../models/clientModel");
const Payment = require("../models/payments");
const exp = require("express");
const mng = require("mongoose");
const env = require("dotenv").config();
const route = exp.Router();
const bcrypt = require("bcrypt");
const pnv = process.env;

let passHash = (password) => {
  return bcrypt.hashSync(password, parseInt(pnv.SALT));
};
exports.CreateBillingMngr = async (data) => {
  try {
    const account = await biller.findOne({
      $or: [{ username: data.username }, { email: data.email }],
    });
    if (account) {
      const errors = {};
      if (account.username === data.username) {
        errors.acc_name = "Username is already taken.";
      }
      if (account.email === data.email) {
        errors.email = "Email is already taken.";
      }
      return { success: false, errors };
    } else {
      let newBillMngr = new biller();
      newBillMngr.username = data.username;
      newBillMngr.password = passHash(data.password);
      newBillMngr.contact = data.contact;
      newBillMngr.name = `${data.fname} ${data.lastname}`;
      newBillMngr.email = data.email;
      newBillMngr.address = data.address;
      newBillMngr.dateCreated = new Date();

      return newBillMngr
        .save()
        .then((result) => {
          if (result) {
            return { success: true, message: "New Biller already saved" };
          }
        })
        .catch((err) => {
          return { success: false, error: "There is an error" + err };
        });
    }
  } catch (err) {
    console.error(err);
    return {
      success: false,
      message: "An error occurred while creating the account.",
    };
  }
};

module.exports.AddBill = async (data) => {
  const results = [];

  try {
    // Process each bill in the batch
    for (const billData of data) {
      const result = await processSingleBill(billData); // Process each bill individually
      results.push(result); // Push the result (either success or error) to results array
    }

    return {
      success: true,
      message: "Batch processing completed",
      data: results,
    };
  } catch (err) {
    return { error: `There was an error processing the batch: ${err.message}` };
  }
};

async function processSingleBill(billData) {
  try {
    // Hanapin kung nage-exist ang client
    const clientExists = await Client.findOne({
      acc_num: billData.acc_num,
      accountName: billData.accountName,
    });

    if (!clientExists) {
      return {
        error: `Client with account number ${billData.acc_num} and name ${billData.accountName} does not exist.`,
      };
    }

    // Get the current date and the due date
    const currentDate = new Date();
    const dueDate = new Date(billData.due_date); // Updated to match new field

    // Calculate the total due with penalty if the due date has passed
    let totalDue = parseFloat(billData.totalDue);

    // Check if the current date is past the due date
    if (currentDate > dueDate) {
      const penaltyCharge = 0.1 * totalDue; // Calculate 10% penalty
      totalDue += penaltyCharge; // Add penalty to total due
    }

    // Calculate consumption
    const consumption = billData.present_read - billData.prev_read;

    // I-save ang bagong bill
    const newBill = new bills({
      acc_num: billData.acc_num,
      reading_date: new Date(billData.reading_date),
      due_date: dueDate,
      accountName: billData.accountName,
      present_read: billData.present_read,
      prev_read: billData.prev_read || 0, // Optional previous reading
      totalDue: totalDue, // Updated total amount due
      arrears: billData.arrears,
      payment_status: "Unpaid",
      remarks: billData.remarks || "", // Optional remarks
      consumption: consumption, // Added consumption field
      category: billData.category || "", // Added category field
      currentBill: totalDue, // Added currentBill field
    });

    const savedBill = await newBill.save();

    // Update ang total balance ng client
    const newTotalBalance =
      parseFloat(clientExists.totalBalance || 0) + totalDue; // Use the updated totalDue

    await Client.findOneAndUpdate(
      { acc_num: billData.acc_num },
      { totalBalance: newTotalBalance },
      { new: true }
    );

    // Check for 3 unpaid bills
    const unpaidBillsCount = await bills.countDocuments({
      acc_num: billData.acc_num,
      payment_status: "Unpaid",
    });

    // If the client has 3 or more unpaid bills, update status to "For Disconnection"
    if (unpaidBillsCount >= 3) {
      await Client.findOneAndUpdate(
        { acc_num: billData.acc_num },
        { disconnection_status: "For Disconnection", status: "Inactive" },
        { new: true }
      );
    }

    return savedBill;
  } catch (err) {
    return {
      error: `Error processing bill for account ${billData.acc_num}: ${err.message}`,
    };
  }
}

module.exports.GetAllBills = async (data) => {
  return await bills
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
module.exports.GetBillsByAccNum = async (data) => {
  try {
    const results = await bills.find({ acc_num: data.acc_number });

    if (results) {
      return results;
    } else {
      return { error: "No bills found with this account number" };
    }
  } catch (err) {
    return { error: "There is an error" };
  }
};
module.exports.GetBillsByBillNum = async (data) => {
  try {
    const results = await bills.find({ billNumber: data.billNumber });
    if (results) {
      return results;
    } else {
      return { error: "No bills found with this account number" };
    }
  } catch (err) {
    return { error: "There is an error" };
  }
};

module.exports.findBillsPayment = async (account) => {
  try {
    console.log("Search", account);

    // Check if the search value is either account number or account name
    const client = await Client.findOne({
      $or: [{ acc_num: account }, { accountName: account }],
    }).exec();

    console.log("client", client);

    if (client) {
      const consumerBills = await bills
        .find({ acc_num: client.acc_num })
        .exec();

      // If no bills exist, return the totalBalance from the client
      if (consumerBills.length === 0) {
        return {
          totalAmountDue: parseFloat(client.totalBalance).toFixed(2),
          totalPenalty: 0,
          consumerName: client.accountName,
          accountNum: client.acc_num,
          address: client.c_address,
        };
      }

      const latestBill = await bills
        .findOne({ acc_num: client.acc_num })
        .sort({ reading_date: -1 })
        .exec();

      console.log("latestBill", latestBill);
      const billNo = latestBill.billNumber;
      const status = latestBill.payment_status;
      const billAmount = parseFloat(latestBill.currentBill).toFixed(2); // Ensure 2 decimal places
      const arrears = parseFloat(latestBill.arrears).toFixed(2);
      const totalAmountDue = parseFloat(client.totalBalance).toFixed(2);
      const totalPenalty = parseFloat(latestBill.p_charge).toFixed(2); // Ensure penalty is a decimal

      // Return the response with bill details
      return {
        arrears,
        status,
        billAmount,
        totalAmountDue,
        totalPenalty,
        accountNum: client.acc_num,
        consumerName: client.accountName,
        address: client.c_address,
        billNo,
      };
    } else {
      // Return 404 if the client is not found
      return {
        error: "Client not found",
        message: "Client not found",
        totalAmountDue: 0,
        totalPenalty: 0,
        consumerName: null,
        address: null,
      };
    }
  } catch (error) {
    console.error("Error finding bills payment:", error);

    // Handle server error
    return {
      message: "Server error",
      totalAmountDue: 0,
      totalPenalty: 0,
      consumerName: null,
      address: null,
    };
  }
};

module.exports.calculateChange = async (data) => {
  try {
    // Validate input data
    if (!data.acc_num || !data.paymentAmount) {
      return { success: false, message: "Invalid input data" };
    }

    // Find the client by account number
    const client = await Client.findOne({ acc_num: data.acc_num }).exec();

    if (!client) {
      return { success: false, message: "Client not found" };
    }

    const newBalance = parseFloat(
      client.totalBalance - data.paymentAmount
    ).toFixed(2);
    let change = 0;

    if (newBalance < 0) {
      // Calculate the absolute value of the negative balance (i.e., the change)
      change = parseFloat(Math.abs(newBalance).toFixed(2));

      // If the change is less than 1 peso, round it down to 0
      if (change < 0) {
        change = 0;
      } else {
        // Optionally round to the nearest whole peso if it's >= 1 peso
        change = Math.round(change);
      }
    }

    return { success: true, change };
  } catch (error) {
    console.error("Error calculating change:", error.message);
    return { success: false, message: "Error calculating change" };
  }
};

module.exports.AddPayment = async (data) => {
  const results = [];
  let remainingPayment = parseFloat(data.paymentAmount.toFixed(2)); // Initialize with the full payment amount
  let paymentRecord = null; // To store the payment record
  const billNumbers = []; // To store the list of bill numbers

  try {
    // Find all unpaid bills for the consumer, ordered by oldest to newest
    const unpaidBills = await bills
      .find({ acc_num: data.acc_num, payment_status: { $ne: "Paid" } })
      .sort({ reading_date: 1 }) // Sort by oldest first
      .exec();

    if (unpaidBills.length > 0) {
      // Create a single payment record
      paymentRecord = new Payment({
        acc_num: data.acc_num,
        accountName: data.acc_name,
        address: data.address,
        paymentDate: data.p_date,
        arrears: data.arrears,
        tendered: data.paymentAmount,
        billNo: [], // Initialize empty list for bill numbers
        amountDue: 0, // This will be updated to the total amount due
        change: 0, // To be calculated
        balance: 0, // To be calculated
      });

      let totalDue = 0; // Total amount due for all bills paid
      let totalBalance = 0; // Total remaining balance

      for (const bill of unpaidBills) {
        if (remainingPayment <= 0) break; // Stop if there's no payment left to apply

        const billDue = parseFloat(bill.currentBill).toFixed(2);
        console.log(
          `Processing Bill ${bill.billNumber} | Bill Due: ${billDue} | Remaining Payment: ${remainingPayment}`
        );

        const paymentApplied = Math.min(remainingPayment, billDue);
        let remainingBalance = billDue - paymentApplied; // Calculate the remaining balance

        // Round all values to two decimal places to avoid floating-point errors
        const paymentAppliedRounded = parseFloat(paymentApplied.toFixed(2));
        remainingBalance = parseFloat(remainingBalance.toFixed(2));
        remainingPayment = parseFloat(
          (remainingPayment - paymentAppliedRounded).toFixed(2)
        ); // Round here after deduction

        console.log(
          `Applying Payment: ${paymentAppliedRounded} | Remaining Balance: ${remainingBalance} | Remaining Payment: ${remainingPayment}`
        );

        // Update the bill with the payment information
        await bills.updateOne(
          { _id: bill._id }, // Use _id for precise updates
          {
            amountPaid: paymentAppliedRounded,
            totalDue: remainingBalance,
            payment_status: remainingBalance > 0 ? "Partial" : "Paid",
            payment_date: data.p_date,
          }
        );

        totalDue += paymentAppliedRounded; // Accumulate the total due amount
        totalBalance += remainingBalance; // Accumulate the total remaining balance

        // Collect the bill number
        billNumbers.push(bill.billNumber);
      }

      // Finalize the payment record
      paymentRecord.amountDue = parseFloat(totalDue.toFixed(2));
      paymentRecord.change =
        remainingPayment > 0 ? remainingPayment.toFixed(2) : 0;
      paymentRecord.balance = parseFloat(totalBalance.toFixed(2)); // Ensure balance is a number with 2 decimal places
      paymentRecord.billNo = billNumbers; // Save the list of bill numbers

      // Save the payment record
      const paymentResult = await paymentRecord.save();
      results.push({ paymentResult, OR_NUM: paymentResult.OR_NUM });

      // Update the client's total balance and advance payment (if applicable)
      const clientUpdateResult = await Client.findOneAndUpdate(
        { acc_num: data.acc_num },
        {
          totalBalance: totalBalance,
          advancePayment: data.advTotalAmount,
        },
        { new: true }
      );

      console.log("clientUpdateResult", clientUpdateResult);

      console.log(
        `Client updated: Total Balance: ${totalBalance}, Advance Payment: ${data.advTotalAmount}`
      );

      // Activate the client if they were inactive or marked for disconnection
      if (
        clientUpdateResult.status === "Inactive" ||
        clientUpdateResult.disconnection_status === "For Disconnection"
      ) {
        await Client.findOneAndUpdate(
          { acc_num: data.acc_num },
          {
            status: "Active",
            disconnection_status: "Paid",
          },
          { new: true }
        );
      }
    } else {
      // If no bills exist, assume this is an installation fee payment
      const newPayment = new Payment({
        acc_num: data.acc_num,
        accountName: data.acc_name,
        address: data.address,
        paymentDate: data.p_date,
        tendered: parseFloat(data.paymentAmount.toFixed(2)),
        amountDue: parseFloat(data.paymentAmount.toFixed(2)), // Assume full payment for the installation fee
        change: 0, // No change expected
        balance: 0.0, // No remaining balance
        billNumbers: [], // No bill numbers for installation fee
      });

      const paymentResult = await newPayment.save();
      results.push({ paymentResult, OR_NUM: paymentResult.OR_NUM });

      // Update the client's balance to 0 since there are no bills
      await Client.findOneAndUpdate(
        { acc_num: data.acc_num },
        {
          totalBalance: 0,
          advancePayment: data.advTotalAmount,
        },
        { new: true }
      );
    }

    return {
      success: true,
      message: "Payment processed successfully",
      data: results,
    };
  } catch (error) {
    // Handle any errors that occur during the process
    console.error("Error processing payment:", error);
    return {
      success: false,
      message: "Error processing payment",
      error: error.message,
    };
  }
};

module.exports.GetPaymentsAccNum = async (acc_num) => {
  try {
    const result = await Payment.find({ acc_num: acc_num }).exec();
    return result;
  } catch (error) {
    console.error("Error fetching payments:", error);
    throw new Error("Error fetching payments");
  }
};
module.exports.getBillStatus = async () => {
  try {
    const totalBills = await bills.countDocuments();
    const unpaidBills = await bills.countDocuments({
      payment_status: "Unpaid",
    });
    const paidBills = await bills.countDocuments({ payment_status: "Paid" });

    return { totalBills, unpaidBills, paidBills };
  } catch (error) {
    console.error("Error fetching bills status:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};

module.exports.getLatestBill = async (acc_num) => {
  // Kunin ang pinakabagong bill
  const latestBill = await bills
    .findOne({ acc_num: acc_num })
    .sort({ reading_date: -1 })
    .select("reading_date acc_num accountName category present_read") // Isama ang present_read
    .exec();

  // Kunin ang client para sa initial reading
  const client = await Client.findOne({ acc_num })
    .select("initial_read")
    .exec();

  if (!latestBill) {
    // Kung walang bill, ibalik null at gamitin ang initial_reading bilang prev_reading
    return {
      latestBill: null,
      prev_reading: client ? client.initial_read : null,
    };
  }

  console.log("latestBill", latestBill);
  return {
    latestBill,
    prev_reading:
      latestBill.present_read || (client ? client.initial_reading : null), // Gamitin ang initial_reading kung walang present_read
  };
};

module.exports.adjustbill = async (billId, adjustmentData, adjustedBy) => {
  try {
    console.log(`Adjusting bill with ID: ${billId}`);
    console.log("Adjustment data received:", adjustmentData);

    // Find the bill by ID
    const bill = await bills.findById(billId);
    if (!bill) {
      console.error(`Bill with ID ${billId} not found.`);
      throw new Error("Bill not found");
    }
    console.log(`Bill found: ${bill}`);

    // Track the changes made to the bill
    let adjustedFields = {};

    // Update the bill with the provided adjustment data
    Object.keys(adjustmentData).forEach((key) => {
      if (bill[key] !== adjustmentData[key]) {
        // Log only if the field is changed
        adjustedFields[key] = {
          previousValue: bill[key],
          newValue: adjustmentData[key],
        };
        bill[key] = adjustmentData[key]; // Dynamically updating the bill
      }
    });

    if (Object.keys(adjustedFields).length === 0) {
      console.log("No changes made to the bill.");
      throw new Error("No fields were adjusted");
    }

    // Save the updated bill
    const updatedBill = await bill.save();
    console.log("Bill successfully updated:", updatedBill);

    return { success: true, data: updatedBill };
  } catch (error) {
    console.error(`Error adjusting bill with ID ${billId}: ${error.message}`);
    throw new Error(`Failed to adjust bill: ${error.message}`);
  }
};
