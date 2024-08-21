const exp = require("express");
const route = exp.Router();
const biller = require("../controllers/billmngrController");
const auth = require("../middleware/Auth");

module.exports = route;

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
