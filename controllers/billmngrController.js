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

          // Debugging logs to trace the values
          console.log(`Rate Range: ${rangeStart} - ${rangeEnd}`);
          console.log(`Remaining Consumption: ${remainingConsumption}`);
          console.log(`Applicable Consumption: ${applicableConsumption}`);
          console.log(`Rate per Cubic Meter: ${ratePerCubicMeter}`);

          // Add the charge for this range to the total commodity charge
          const rangeCharge = applicableConsumption * ratePerCubicMeter;
          commodityCharge += rangeCharge;

          // Log the charge calculated for this range
          console.log(`Commodity Charge for this range: ${rangeCharge}`);
          console.log(`Total Commodity Charge so far: ${commodityCharge}`);

          // Decrease the remaining consumption
          remainingConsumption -= applicableConsumption;

          // Log the updated remaining consumption
          console.log(`Updated Remaining Consumption: ${remainingConsumption}`);

          // If all consumption has been accounted for, break out of the loop
          if (remainingConsumption <= 0) {
            console.log("No remaining consumption left. Exiting loop.");
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
        .sort({ reading_date: -1 });

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
      const totalDue =
        parseFloat(totalBillAmount) +
        parseFloat(arrears) +
        parseFloat(additionalFees);

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

      const unpaidBills = await bills.countDocuments({
        acc_num: String(billData.acc_num), // Ensures it's treated as a string
        payment_status: "Unpaid",
      });

      console.log("UNPAID BILLS", unpaidBills);

      await Client.findOneAndUpdate(
        { acc_num: billData.acc_num },
        {
          totalBalance: newTotalBalance,
          advancePayment: remainingAdvancePayment,
          status: unpaidBills >= 3 ? "Inactive" : clientExists.status,
          disconnection_status:
            unpaidBills >= 3
              ? "For Disconnection"
              : clientExists.disconnection_status,
        },
        { new: true }
      );
    }

    return {
      success: true,
      message: "All bills added successfully",
      data: results,
    };
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
  let remainingPayment = data.paymentAmount; // Initialize with the full payment amount
  let paymentRecord = null; // To store the payment record
  const billNumbers = []; // To store the list of bill numbers

  try {
    // Find all unpaid bills for the consumer, ordered by oldest to newest
    const unpaidBills = await bills
      .find({ acc_num: data.acc_num, payment_status: { $ne: "Paid" } })
      .sort({ reading_date: -1 }) // Sort by oldest first
      .exec();

    if (unpaidBills.length > 0) {
      // Create a single payment record
      paymentRecord = new Payment({
        acc_num: data.acc_num,
        accountName: data.acc_name,
        address: data.address,
        paymentDate: data.p_date,
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

        const billDue = parseFloat(bill.totalDue).toFixed(2); // Ensure it's a decimal value
        const paymentApplied = Math.min(remainingPayment, billDue); // Apply either the remaining payment or the billDue
        let remainingBalance = billDue - paymentApplied; // Calculate the remaining balance
        console.log("Remaining balance1", remainingBalance);

        // Handle floating-point precision issues by rounding to two decimal places
        remainingBalance =
          Math.abs(remainingBalance) < 0.01 ? 0 : remainingBalance.toFixed(2);
        console.log("Remaining balance2", remainingBalance);

        // Update the bill with the payment information
        await bills.updateOne(
          { _id: bill._id }, // Use _id for precise updates
          {
            amountPaid: parseFloat(paymentApplied).toFixed(2),
            totalDue: remainingBalance,
            payment_status: remainingBalance > 0 ? "Partial" : "Paid", // Update status correctly
            payment_date: data.p_date,
          }
        );

        remainingPayment -= paymentApplied;
        totalDue += parseFloat(paymentApplied); // Accumulate the total due amount
        totalBalance += parseFloat(remainingBalance); // Accumulate the total remaining balance

        // Collect the bill number
        billNumbers.push(bill.billNumber);
      }

      // Finalize the payment record
      paymentRecord.amountDue = totalDue;
      paymentRecord.change = remainingPayment > 0 ? remainingPayment : 0;
      paymentRecord.balance = parseFloat(totalBalance.toFixed(2)); // Ensure balance is a number with 2 decimal places
      paymentRecord.billNo = billNumbers; // Save the list of bill numbers

      // Save the payment record
      const paymentResult = await paymentRecord.save();
      results.push({ paymentResult, OR_NUM: paymentResult.OR_NUM });

      // Update the client's total balance and advance payment (if applicable)
      const result = await Client.findOneAndUpdate(
        { acc_num: data.acc_num },
        {
          totalBalance: totalBalance,
          advancePayment: data.advTotalAmount,
        },
        { new: true }
      );
      if (
        result.status === "Inactive" ||
        result.disconnection_status === "For Disconnection"
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
        tendered: data.paymentAmount,
        amountDue: data.paymentAmount, // Assume full payment for the installation fee
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
