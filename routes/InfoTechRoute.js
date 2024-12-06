const exp = require("express");
const route = exp.Router();
const controller = require("../controllers/itController.js");
const auth = require("../middleware/Auth.js");

module.exports = route;
// TODO: ADD ACCOUNT FOR USER MANAGEMENT
route.post("/new_IT", (req, res) => {
  console.log("Adding new IT ");
  console.log("PassReq", req.body);
  controller.CreateITAccount(req.body).then((result) => {
    res.send(result);
  });
});
route.post("/new_Admin", (req, res) => {
  console.log("Adding new Admin");
  console.log(req.body);
  controller.CreateAdmin(req.body).then((result) => {
    res.send(result);
  });
});
route.post("/new_Cashier", (req, res) => {
  console.log("Adding New Cashier");
  console.log(req.body);
  controller.CreateCashier(req.body).then((result) => {
    res.send(result);
  });
});
route.post("/new_Uploader", (req, res) => {
  console.log("Adding New Uploader");
  console.log(req.body);
  controller.CreateDataEntry(req.body).then((result) => {
    console.log("Result is", result);
    res.send(result);
  });
});
route.post("/newCS_Officer", (req, res) => {
  console.log("Adding new CS officer");
  console.log("REQ", req.body);
  controller.CreateCS_Officer(req.body).then((result) => {
    res.send(result);
  });
});
