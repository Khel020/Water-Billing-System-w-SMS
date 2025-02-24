const exp = require("express");
const route = exp.Router();
const cashier = require("../controllers/cashierController");
const controller = require("../controllers/clientController");
const auth = require("../middleware/Auth");
const { GetTotalClients } = require("../controllers/clientController");
module.exports = route;

route.get("/clients/:acc_number", (req, res) => {
  console.log("Getting Clients by Acc nUm");
  controller.GetClientsByAccNum(req.params).then((result) => {
    res.send(result);
  });
});
route.post("/addBiller", (req, res) => {
  console.log("Adding Biller..");
  console.log(req.body);
  cashier.CreateBillingMngr(req.body).then((result) => {
    res.send(result);
  });
});
route.post("/addbill", (req, res) => {
  console.log("Adding Bill");
  console.log("Request Body", req.body);
  cashier.AddBill(req.body).then((result) => {
    res.send(result);
  });
});
route.get("/getAllbills", (req, res) => {
  console.log("Getting All Bills");
  cashier.GetAllBills(req.body).then((result) => {
    res.send(result);
  });
});
route.get("/getBillbyAccNum/:acc_number", (req, res) => {
  console.log("Your Request Body:", req.params);
  cashier.GetBillsByAccNum(req.params).then((result) => {
    console.log(result);
    res.send(result);
  });
});
route.get("/getBillbyBillNum", (req, res) => {
  const billNumber = req.query.billNumber; // Extract billNumber from query parameters
  console.log("Received Bill Number:", billNumber);

  cashier
    .GetBillsByBillNum({ billNumber })
    .then((result) => {
      console.log(result);
      res.send(result);
    })
    .catch((error) => {
      console.error("Error fetching bill:", error);
      res.status(500).send({ error: "Failed to fetch bill" });
    });
});
route.get("/findBillPay/:account", auth.BillerOnly, async (req, res) => {
  try {
    console.log("Finding bill for payment...", req.params.account);

    // Pass the account parameter to the findBillsPayment function
    const response = await cashier.findBillsPayment(req.params.account);

    if (!response) {
      return res
        .status(404)
        .json({ message: "No bills found for this account." });
    }
    console.log("RESPONSE", response);
    // Send the response if data is found
    res.json(response);
  } catch (error) {
    console.error("Error finding bill for payment:", error);

    // Handle any errors
    res.status(500).json({ message: "Server error. Please try again later." });
  }
});
route.get("/status", async (req, res) => {
  try {
    const stats = await GetTotalClients();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching client statistics:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
route.get("/getBillStatus", async (req, res) => {
  try {
    console.log("Getting Bill Status");
    const stats = await cashier.getBillStatus();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching client statistics:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
route.post(
  "/newPayment",
  auth.BillerOnly,
  auth.getUsernameFromToken,
  (req, res) => {
    console.log("New Payment Transaction");
    console.log("REQ BODY", req.body);

    // Access the username extracted by the middleware
    const username = req.username; // Retrieve username from the req object
    const usertype = req.role;
    // Prepare the payment data, including the username
    const paymentData = {
      billNo: req.body.billNo,
      acc_num: req.body.acc_num,
      acc_name: req.body.acc_name,
      address: req.body.address,
      p_date: req.body.p_date,
      arrears: req.body.arrears,
      totalChange: req.body.totalChange,
      balance: req.body.balance,
      tendered: req.body.tendered,
      advTotalAmount: req.body.advTotalAmount, // Add any additional fields as necessary
      processedBy: username, // Include the username here
      role: usertype,
      paymentType: req.body.paymentType,
    };

    // Call the AddPayment method with the prepared paymentData
    cashier
      .AddPayment(paymentData)
      .then((result) => {
        console.log("Result", result);
        res.send(result);
      })
      .catch((error) => {
        console.error("Error processing payment:", error);
        res.status(500).json({ error: "Internal Server Error" });
      });
  }
);

route.post("/calculateChange", (req, res) => {
  console.log("Calculating Charge:");
  console.log(req.body);
  cashier.calculateChange(req.body).then((result) => {
    console.log("Result", result);
    res.send(result);
  });
});
route.get("/getPayments/:acc_num", async (req, res) => {
  const acc_num = req.params.acc_num;
  try {
    cashier.GetPaymentsAccNum(acc_num).then((result) => {
      res.json(result);
    });
  } catch (error) {
    res.status(500).json({ error: error.message }); // Respond with error message if something goes wrong
  }
});
route.get("/billStatus", async (req, res) => {
  try {
    const stats = await cashier.getBillStatus();
    res.json(stats);
  } catch (error) {
    console.error("Error fetching client statistics:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});
route.get("/ForDisconnect", (req, res) => {
  console.log("Getting Accounts for DC");
  controller
    .GetForDisconnection(req.query)
    .then((result) => {
      res.send(result);
    })
    .catch((error) => {
      console.error("Error fetching data:", error);
      res.status(500).send("Failed to retrieve accounts for disconnection.");
    });
});
route.get("/latestBill/:acc_num", (req, res) => {
  console.log("Getting latest bill using acc_num");
  const acc_num = req.params.acc_num;
  console.log("ACCOUNT num", acc_num);
  try {
    cashier.getLatestBill(acc_num).then((result) => {
      console.log("result", result);
      res.json(result);
    });
  } catch {
    res.status(500).json({ error: error.message });
  }
});
route.get("/withBalance", (req, res) => {
  console.log("Getting Client with balances");
  controller.getClientwithBalance().then((result) => {
    res.json(result);
  });
});
route.put("/adjustbill/:id", auth.BillerOnly, async (req, res) => {
  console.log("Adjusting bill using ID");

  const billId = req.params.id;
  const adjustmentData = req.body;

  console.log("Bill ID:", billId);
  console.log("Adjustment Data:", adjustmentData);

  try {
    // Assuming cashier.adjustbill is a function that returns a promise
    const result = await cashier.adjustbill(billId, adjustmentData);
    console.log("Updated Bill:", result);

    // Send the response only once after the operation is complete
    res.json(result);
  } catch (error) {
    console.error("Error adjusting bill:", error.message);

    // Send the error response only once
    res.status(500).json({ error: error.message });
  }
});
