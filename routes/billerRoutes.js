const exp = require("express");
const route = exp.Router();
const biller = require("../controllers/billmngrController");
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
  biller.CreateBillingMngr(req.body).then((result) => {
    res.send(result);
  });
});
route.post("/addbill", (req, res) => {
  console.log("Adding Bill");
  console.log("Request Body", req.body);
  biller.AddBill(req.body).then((result) => {
    res.send(result);
  });
});
route.get("/getAllbills", (req, res) => {
  console.log("Getting All Bills");
  biller.GetAllBills(req.body).then((result) => {
    res.send(result);
  });
});
route.get("/getBillbyAccNum/:acc_number", (req, res) => {
  console.log("Your Request Body:", req.params);
  biller.GetBillsByAccNum(req.params).then((result) => {
    console.log(result);
    res.send(result);
  });
});
route.get("/getBillbyBillNum", (req, res) => {
  const billNumber = req.query.billNumber; // Extract billNumber from query parameters
  console.log("Received Bill Number:", billNumber);

  biller
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

route.get("/findBillPay/:account", async (req, res) => {
  try {
    console.log("Finding bill for payment...", req.params.account);

    // Pass the account parameter to the findBillsPayment function
    const response = await biller.findBillsPayment(req.params.account);

    if (!response) {
      return res
        .status(404)
        .json({ message: "No bills found for this account." });
    }

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
route.post("/newPayment", (req, res) => {
  console.log("New Payment Transaction");
  console.log("REQ BODY", req.body);
  biller.AddPayment(req.body).then((result) => {
    console.log("Result", result);
    res.send(result);
  });
});
route.post("/calculateChange", (req, res) => {
  console.log("Calculating Charge:");
  console.log(req.body);
  biller.calculateChange(req.body).then((result) => {
    console.log("Result", result);
    res.send(result);
  });
});
route.get("/getPayments/:acc_num", async (req, res) => {
  const acc_num = req.params.acc_num;
  try {
    biller.GetPaymentsAccNum(acc_num).then((result) => {
      res.json(result);
    });
  } catch (error) {
    res.status(500).json({ error: error.message }); // Respond with error message if something goes wrong
  }
});
route.get("/billStatus", async (req, res) => {
  try {
    const stats = await biller.getBillStatus();
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
    biller.getLatestBill(acc_num).then((result) => {
      res.json(result);
    });
  } catch {
    res.status(500).json({ error: error.message });
  }
});
