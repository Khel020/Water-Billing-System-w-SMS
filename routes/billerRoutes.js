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
route.get("/getBillbyBillNum/:billNumber", (req, res) => {
  console.log("Your Request Body:", req.params);
  biller.GetBillsByBillNum(req.params).then((result) => {
    console.log(result);
    res.send(result);
  });
});
route.get("/findBillPay/:acc_number", (req, res) => {
  console.log("finding bill for payment");
  biller.findBillsPayment(req.params).then((response) => {
    res.send(response);
  });
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
  biller.AddPayment(req.body).then((result) => {
    if (result) {
      res.send(result);
    }
  });
});
