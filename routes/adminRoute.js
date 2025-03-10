const exp = require("express");
const route = exp.Router();
const controller = require("../controllers/adminController.js");
const customerctrl = require("../controllers/clientController.js");
const ratectrl = require("../controllers/ratesController.js");
const auth = require("../middleware/Auth.js");

module.exports = route;

route.post("/addAccounts", (req, res) => {
  console.log("Adding Accounts..");
  console.log(req.body);
  controller.CreateAccounts(req.body).then((result) => {
    res.send(result);
  });
});
route.get("/customers/:acc_number", auth.AdminOrCS_Officer, (req, res) => {
  console.log("Getting Customer Info");
  console.log(req.params);
  customerctrl.GetClientsByAccNum(req.params).then((result) => {
    res.send(result);
  });
});
route.put("/updateAccountStatus", async (req, res) => {
  try {
    console.log("Updating Status");
    console.log(req.body);

    const result = await controller.updateAccountStatus(req.body);
    res.send(result);
  } catch (error) {
    console.error("Error updating account status:", error);
    res.status(500).send({ error: "Internal server error" });
  }
});
route.get("/customers", (req, res) => {
  console.log("GETTING CLIENT!");
  customerctrl.ConsumersWithBill(req.body).then((result) => {
    res.send(result);
  });
});
route.post("/addRates", (req, res) => {
  console.log("Adding Rates");
  console.log(req.body);
  ratectrl.addRate(req.body).then((result) => {
    res.send(result);
  });
});

route.post("/newclient", (req, res) => {
  console.log("Adding New Client");
  console.log(req.body);
  customerctrl.CreateClient(req.body).then((result) => {
    console.log("Result is", result);
    res.send(result);
  });
});
route.post("/addDataUploader", (req, res) => {
  console.log("Adding New Client");
  console.log(req.body);
  controller.CreateDataEntry(req.body).then((result) => {
    console.log("Result is", result);
    res.send(result);
  });
});
route.put("/editClient", (req, res) => {
  console.log("Updating Client");
  console.log(req.body);
  customerctrl.UpdateClientByAccNum(req.body).then((result) => {
    res.send(result);
  });
});
route.delete("/deleteClient", (req, res) => {
  console.log("Archiving..");
  console.log(req.body);
  customerctrl
    .ArchiveClient(req.body)
    .then((result) => {
      res.send(result);
    })
    .catch((err) => {
      console.log(err);
    });
});

route.get("/admins", (req, res) => {
  console.log("Loading Admins");
  console.log(req.body);
  controller.GetAdmin(req.body).then((result) => {
    res.send(result);
  });
});

route.post("/add", (req, res) => {
  console.log("Adding Admin Acc");
  console.log(req.body);
  controller.CreateAdmin(req.body).then((result) => {
    res.send(result);
  });
});
route.post("/addstaffs", (req, res) => {
  console.log("Adding Admin Acc");
  console.log(req.body);
  controller.CreateAdmin(req.body).then((result) => {
    res.send(result);
  });
});
route.put("/editAdmin", (req, res) => {
  console.log("Updating Admin");
  console.log(req.body);
  controller.UpdateAdminByID(req.body).then((result) => {
    res.send(result);
  });
});
route.post("/generate_accNum", (req, res) => {
  console.log("Generating Acc Number");
  console.log(req.body);
  customerctrl.generateAccountNumber(req.body).then((result) => {
    res.send(result);
  });
});

route.get("/GetAllUsers", async (req, res) => {
  try {
    console.log("Getting All Users");
    await controller.GetAllUsers(req, res); // Directly pass req and res
  } catch (error) {
    // Handle any unexpected errors
    res.status(500).json({
      success: false,
      message: "Failed to get users",
      error: error.message,
    });
  }
});
route.get("/forActivation", (req, res) => {
  console.log("Account For Activation");
  customerctrl.GetforActivation(req.body).then((result) => {
    res.status(200).json({ success: true, result });
  });
});
route.get("/collectionSummary", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    console.log("startDate", startDate);
    console.log("endDate", endDate);
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required." });
    }
    const result = await controller.getConsumerCollectionSummary({
      startDate,
      endDate,
    });

    console.log("Collection SUMMARY RESULT", result);

    res.json(result);
  } catch (error) {
    console.error("Error fetching bill summary:", error);
    res.status(500).json({ message: "Server Error" });
  }
});
route.put("/archiveAccount", (req, res) => {
  console.log("Account for Archive", req.body);
  controller.ArchiveAccount(req.body).then((result) => {
    res.send(result);
  });
});
route.get("/billSummary/", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    console.log("startDate", startDate);
    console.log("endDate", endDate);
    if (!startDate || !endDate) {
      return res
        .status(400)
        .json({ message: "Start date and end date are required." });
    }
    const result = await controller.getBillSummary({ startDate, endDate });

    console.log("BILLING SUMMARY RESULT", result);

    // Respond with the result
    res.json(result);
  } catch (error) {
    console.error("Error fetching bill summary:", error);
    res.status(500).json({ message: "Server Error" });
  }
});
route.post("/update_pendingStatus", async (req, res) => {
  try {
    console.log("Updating pending status", req.body);
    const result = await customerctrl.UpdatePending(req.body);
    res.status(200).json({ message: "Status updated successfully", result });
  } catch (error) {
    console.error("Error updating status:", error);
    res
      .status(500)
      .json({ message: "Error updating status", error: error.message });
  }
});
route.get("/rates", (req, res) => {
  console.log("Getting Rates");
  controller.getAllRates(req.body).then((result) => {
    res.json(result);
  });
});
route.put("/updateRate/:id", (req, res) => {
  console.log("Updating Rates");
  controller.updateRate(req, res);
});
route.get("/logs", (req, res) => {
  console.log("Getting Logs");
  controller.GetLogs().then((result) => {
    res.send(result);
  });
});
route.get("/revenues", (req, res) => {
  console.log("Getting Monthly Revenue");
  controller.monthlyRevenue().then((result) => {
    console.log("RESULTL:", result);
    res.send(result);
  });
});
route.get("/paymentStatus", (req, res) => {
  console.log("Getting paymentStatus");
  controller.paymentStatus().then((result) => {
    console.log("RESULTL:", result);
    res.send(result);
  });
});
