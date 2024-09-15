const biller = require("../models/BillMngr");
const bills = require("../models/BillsModel");
const Rate = require("../models/ratesModel");
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
    for (const billData of data) {
      const clientExists = await Client.findOne({
        acc_num: billData.acc_num,
        accountName: billData.accountName,
      });

      if (!clientExists) {
        results.push({
          error: `Client with account number ${billData.acc_num} and name ${billData.accountName} does not exist.`,
        });
        continue; // Skip to the next bill
      }

      let previousReading = 0;

      // Find the latest bill of the client, if exists
      const latestBill = await bills
        .findOne({ acc_num: billData.acc_num })
        .sort({ reading_date: -1 })
        .exec();

      // Assigning Amount to previous
      if (latestBill) {
        previousReading = latestBill.present_read || 0;
      } else if (clientExists.initial_read) {
        previousReading = clientExists.initial_read;
      }

      // Calculate consumption
      const consumption = billData.present_read - previousReading;

      // Ensure consumption is non-negative
      if (consumption < 0) {
        results.push({
          error: `Invalid consumption: Present reading (${billData.present_read}) is less than previous reading (${previousReading}).`,
        });
        continue;
      }

      // Fetch rates based on classification and pipe size
      const rateData = await Rate.findOne({
        category: clientExists.client_type,
        size: clientExists.pipe_size,
      });

      if (!rateData) {
        results.push({
          error: `No rate found for classification ${clientExists.client_type} and pipe size ${clientExists.pipe_size}.`,
        });
        continue; // Skip to the next bill
      }

      const minimumCharge = rateData.minimumCharge;
      const commodityRates = rateData.commodityRates; // Assume this is an array of {range, rate}

      console.log("Rate", rateData);
      console.log("Minimum Charge", minimumCharge);
      console.log("commodityRates", commodityRates);

      let totalBillAmount = minimumCharge;
      let remainingConsumption = consumption - 10; // First 10 cu.m. covered by minimum charge
      console.log("remainingConsumption", remainingConsumption);
      // Calculate commodity charges for remaining consumption
      if (remainingConsumption > 0) {
        let commodityCharge = 0;

        // Loop through the commodity rates
        for (const rate of rateData.commodityRates) {
          const { rangeStart, rangeEnd, rate: ratePerCubicMeter } = rate;

          // Determine the applicable consumption for this rate range
          const applicableConsumption = Math.min(
            remainingConsumption,
            rangeEnd - rangeStart + 1
          );

          // Add the charge for this range to the total commodity charge
          commodityCharge += applicableConsumption * ratePerCubicMeter;
          console.log("commodityCharge", commodityCharge);
          // Decrease the remaining consumption
          remainingConsumption -= applicableConsumption;
          console.log("remainingConsumption", remainingConsumption);
          // If all consumption has been accounted for, break out of the loop

          if (remainingConsumption <= 0) {
            break;
          }
        }
        // Add the commodity charge to the total bill amount
        totalBillAmount =
          parseFloat(totalBillAmount) + parseFloat(commodityCharge);

        console.log("TotalBillAmount", totalBillAmount);
      }

      // Calculate due date, disconnect date, and penalties
      const readingDate = new Date(billData.reading_date);
      const dueDate = calculateDueDate(readingDate);
      const disconnectDate = calculateDC(dueDate);
      let penalty = 0;
      let daysPastDue = 0;

      const currentDate = new Date();
      if (currentDate > dueDate) {
        daysPastDue = Math.floor(
          (currentDate - dueDate) / (1000 * 60 * 60 * 24)
        );
        penalty = calculateDailyPenalty(totalBillAmount, daysPastDue);
        totalBillAmount += penalty;
      }

      // Check for any unpaid bills
      const latestUnpaidBill = await bills
        .findOne({
          acc_num: billData.acc_num,
          reading_date: { $lt: readingDate },
          payment_status: { $in: ["Unpaid", "Partial"] },
        })
        .sort({ reading_date: 1 });

      let arrears = 0;
      if (latestUnpaidBill) {
        arrears = latestUnpaidBill.totalDue;
      }

      // Additional fees
      let additionalFees = 0;
      if (clientExists.totalBalance > 0 && !latestBill) {
        additionalFees = clientExists.totalBalance;
      }

      // Calculate total due amount
      const totalDue = totalBillAmount + arrears + additionalFees;

      // Handle advance payment
      let remainingAdvancePayment = clientExists.advancePayment || 0;
      let newTotalBalance = totalDue;

      if (remainingAdvancePayment > 0) {
        if (remainingAdvancePayment >= totalDue) {
          remainingAdvancePayment -= totalDue;
          newTotalBalance = 0;
        } else {
          newTotalBalance -= remainingAdvancePayment;
          remainingAdvancePayment = 0;
        }
      }

      const unpaidBills = await bills.countDocuments({
        acc_num: String(billData.acc_num), // Ensures it's treated as a string
        payment_status: "Unpaid",
      });

      console.log("UNPAID BILLS", unpaidBills);

      // Create and save the new bill
      const newBill = new bills({
        acc_num: billData.acc_num,
        reading_date: readingDate,
        due_date: dueDate,
        accountName: billData.accountName,
        consumption: consumption,
        dc_date: disconnectDate,
        present_read: billData.present_read,
        prev_read: previousReading,
        category: billData.category,
        currentBill: totalBillAmount,
        arrears: arrears,
        totalDue: newTotalBalance,
        p_charge: penalty,
        dayPastDueDate: daysPastDue,
        others: billData.others,
        remarks: billData.remarks,
        payment_status: newTotalBalance === 0 ? "Paid" : "Unpaid",
      });

      const result = await newBill.save();
      results.push(result);

      await Client.findOneAndUpdate(
        { acc_num: billData.acc_num },
        {
          totalBalance: newTotalBalance,
          advancePayment: remainingAdvancePayment,
        }
      );
    }

    return { message: "All bills added successfully", data: results };
  } catch (err) {
    return { error: `There was an error: ${err.message}` };
  }
};

function calculateDueDate(readingDate) {
  const dueDate = new Date(readingDate);
  dueDate.setDate(dueDate.getDate() + 16);
  return dueDate;
}

function calculateDC(DUE_DATE) {
  const DC_DATE = new Date(DUE_DATE);
  DC_DATE.setDate(DC_DATE.getDate() + 7);
  return DC_DATE;
}

function calculateDailyPenalty(totalAmount, daysPastDue) {
  const dailyPenaltyRate = 0.01; // Example: 1% daily penalty
  return totalAmount * dailyPenaltyRate * daysPastDue;
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
module.exports.findBillsPayment = async (data) => {
  try {
    const client = await Client.findOne({ acc_num: data.acc_number }).exec();

    if (client) {
      const consumerBills = await bills
        .find({ acc_num: client.acc_num })
        .exec();

      // If no bills exist, return the totalBalance from the client
      if (consumerBills.length === 0) {
        return {
          totalAmountDue: client.totalBalance,
          totalPenalty: 0,
          consumerName: client.accountName,
          address: client.c_address,
        };
      }

      const latestBill = await bills
        .findOne({ acc_num: client.acc_num })
        .sort({ reading_date: -1 })
        .exec();

      // Calculate totalAmountDue based on the latest bill
      let billNo = latestBill.billNumber;
      let billAmount = latestBill.currentBill;
      let arrears = latestBill.arrears;
      let totalAmountDue = client.totalBalance;
      let totalPenalty = latestBill.p_charge;
      // Calculate total penalties from all unpaid bills

      return {
        arrears,
        billAmount,
        totalAmountDue,
        totalPenalty,
        consumerName: client.accountName,
        address: client.c_address,
        billNo: billNo,
      };
    } else {
      console.log("Client not found.");
      return {
        consumerBills: [],
        totalAmountDue: 0,
        totalPenalty: 0,
        consumerName: null,
        address: null,
      };
    }
  } catch (error) {
    console.error("Error finding bills payment:", error);
    return {
      consumerBills: [],
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

    const newBalance = client.totalBalance - data.paymentAmount;
    let change = 0;

    if (newBalance < 0) {
      change = Math.abs(newBalance); // Calculate the change amount
    }
    return { success: true, change };
  } catch (error) {
    console.error("Error calculating change:", error.message);
    return { success: false, message: "Error calculating change" };
  }
};

module.exports.AddPayment = async (data) => {
  const results = [];
  let remainingPayment = data.paymentAmount; // Initialize with the full payment amount
  let paymentRecord = null; // To store the payment record

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
        tendered: data.paymentAmount,
        amountDue: 0, // This will be updated to the total amount due
        change: 0, // To be calculated
        balance: 0, // To be calculated
      });

      let totalDue = 0; // Total amount due for all bills paid
      let totalChange = 0; // Total change calculated
      let totalBalance = 0; // Total remaining balance

      for (const bill of unpaidBills) {
        if (remainingPayment <= 0) break; // Stop if there's no payment left to apply

        const billDue = bill.currentBill; // Current bill amount
        const paymentApplied = Math.min(remainingPayment, billDue); // Apply either the remaining payment or the billDue
        const remainingBalance = billDue - paymentApplied; // Calculate the remaining balance

        // Update the bill with the payment information
        await bills.updateOne(
          { _id: bill._id }, // Use _id for precise updates
          {
            amountPaid: paymentApplied,
            totalDue: remainingBalance,
            payment_status: remainingBalance > 0 ? "Partial" : "Paid",
          }
        );

        remainingPayment -= paymentApplied;
        totalDue += paymentApplied; // Accumulate the total due amount
        totalBalance += remainingBalance; // Accumulate the total remaining balance
      }

      // Finalize the payment record
      paymentRecord.amountDue = totalDue;
      paymentRecord.change = remainingPayment > 0 ? remainingPayment : 0;
      paymentRecord.balance = parseFloat(totalBalance.toFixed(2)); // Ensure balance is a number with 2 decimal places

      // Save the payment record
      const paymentResult = await paymentRecord.save();
      results.push({ paymentResult, OR_NUM: paymentResult.OR_NUM });

      // Update the client's total balance and advance payment (if applicable)
      await Client.findOneAndUpdate(
        { acc_num: data.acc_num },
        {
          totalBalance: totalBalance,
          advancePayment: data.advTotalAmount,
        },
        { new: true }
      );
    } else {
      // If no bills exist, assume this is an installation fee payment
      const newPayment = new Payment({
        acc_num: data.acc_num,
        accountName: data.acc_name,
        address: data.address,
        paymentDate: data.p_date,
        tendered: data.paymentAmount,
        amountDue: data.paymentAmount, // Assume full payment for the installation fee
        change: 0, // No change expected
        balance: 0.0, // No remaining balance
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
